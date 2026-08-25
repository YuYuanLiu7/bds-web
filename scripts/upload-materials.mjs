#!/usr/bin/env node
/**
 * BDS 課程教材（簡報/文件）批次上傳工具
 * ------------------------------------------------------------
 * 搭配 bunny-upload.mjs：影片傳 Bunny，這支把「簡報/文件」（pdf/pptx/ppt/key/doc/docx/xls/xlsx/zip）
 * 傳到 Supabase Storage 的 uploads 空間，供貼進後台章節的「教材／附件」欄位。
 *
 * 遞迴掃描整個資料夾（含子資料夾）、只挑文件檔（自動略過影片與圖片），
 * 全部上傳、不重複、可中斷續傳，並輸出對照表（最外層資料夾名＝猜的課程、原檔名＝教材名 → 公開網址）。
 *
 * 模式：
 *   node scripts/upload-materials.mjs "資料夾路徑"
 *       只掃描：列出找到幾個文件檔、輸出 materials-upload-plan.csv（不上傳、不需金鑰）
 *   node scripts/upload-materials.mjs "資料夾路徑" --upload
 *       正式上傳（可中斷續傳）；可加 --limit 3 先傳 3 個測試
 *
 * 需求（--upload 時）：.env.local 需有 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY。
 *   （與影片工具不同，這支不需要 Bunny 金鑰。）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const UPLOAD = argv.includes('--upload');
const limIdx = argv.indexOf('--limit');
const LIMIT = limIdx !== -1 ? parseInt(argv[limIdx + 1], 10) : Infinity;
const folder = argv.find((a) => !a.startsWith('--') && a !== String(LIMIT));

// 只挑「文件/簡報」類（與影片、圖片分開處理）；副檔名 → contentType
const MATERIAL_TYPES = new Map([
  ['pdf', 'application/pdf'],
  ['ppt', 'application/vnd.ms-powerpoint'],
  ['pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['key', 'application/vnd.apple.keynote'],
  ['doc', 'application/msword'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['xls', 'application/vnd.ms-excel'],
  ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['zip', 'application/zip'],
]);
const MAX_BYTES = 50 * 1024 * 1024;
const PROGRESS = path.join(process.cwd(), 'materials-upload-progress.json');
const PLAN_CSV = path.join(process.cwd(), 'materials-upload-plan.csv');
const RESULT_CSV = path.join(process.cwd(), 'materials-upload-result.csv');

const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const warn = (m) => console.log('  \x1b[33m⚠\x1b[0m ' + m);
const head = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`;

if (!folder) { bad('請提供資料夾路徑，例如：node scripts/upload-materials.mjs "C:/課程教材"'); process.exit(1); }

function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local'); if (!fs.existsSync(p)) return;
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('='); if (eq === -1) continue;
    const key = line.slice(0, eq).trim(); let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function scan(dir, root, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) scan(full, root, out);
    else {
      const ext = path.extname(name).toLowerCase().replace('.', '');
      if (!MATERIAL_TYPES.has(ext)) continue; // 只收文件/簡報，影片與圖片略過
      const rel = path.relative(root, full);
      const parts = rel.split(path.sep);
      out.push({ full, rel, ext, size: st.size, guessCourse: parts.length > 1 ? parts[0] : '（未分資料夾）', name });
    }
  }
  return out;
}
function readProgress() { try { return JSON.parse(fs.readFileSync(PROGRESS, 'utf8')); } catch { return {}; } }
function writeProgress(p) { fs.writeFileSync(PROGRESS, JSON.stringify(p, null, 2)); }

(async () => {
  console.log('\x1b[1m\n=== BDS 課程教材批次上傳工具 ===\x1b[0m');
  const absFolder = path.isAbsolute(folder) ? folder : path.resolve(process.cwd(), folder);
  if (!fs.existsSync(absFolder)) { bad('找不到資料夾：' + absFolder); process.exit(1); }

  const files = scan(absFolder, absFolder);
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  head('1. 掃描結果');
  ok(`找到文件/簡報檔：${files.length} 個（影片與圖片已自動略過）`);
  ok(`總大小：${mb(totalSize)}`);

  const planLines = ['course_guess,material_name,relative_path,size_mb'];
  for (const f of files) planLines.push([f.guessCourse, f.name, f.rel, (f.size / 1024 / 1024).toFixed(1)].map(csvCell).join(','));
  fs.writeFileSync(PLAN_CSV, '\uFEFF' + planLines.join('\n'), 'utf8');
  ok(`已輸出上傳計畫：${PLAN_CSV}`);

  if (!UPLOAD) {
    head('結果');
    warn('這是「只掃描」，未上傳、未使用金鑰。');
    console.log('     · 打開 materials-upload-plan.csv 看看抓到的檔對不對。');
    console.log('     · 要正式上傳：加 --upload（可先加 --limit 3 傳 3 個測試）。');
    return;
  }

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { bad('缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  head('2. 上傳到 Supabase Storage（uploads，可中斷續傳）');
  const progress = readProgress();
  const resultLines = ['course_guess,material_name,relative_path,public_url'];
  let done = 0, uploaded = 0, skipped = 0, failed = 0;

  for (const f of files) {
    if (done >= LIMIT) break;
    done++;
    let publicUrl = progress[f.full]?.url;
    if (publicUrl) { skipped++; }
    else {
      if (f.size > MAX_BYTES) { warn(`略過（超過 50MB）：${f.rel}（${mb(f.size)}）`); failed++; continue; }
      try {
        const buffer = fs.readFileSync(f.full);
        const storedName = `material-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${f.ext}`;
        const { error } = await supabase.storage.from('uploads').upload(storedName, buffer, {
          contentType: MATERIAL_TYPES.get(f.ext), upsert: true,
        });
        if (error) throw new Error(error.message);
        publicUrl = supabase.storage.from('uploads').getPublicUrl(storedName).data.publicUrl;
        progress[f.full] = { url: publicUrl };
        writeProgress(progress);
        uploaded++;
        console.log(`     ✓ (${uploaded}) ${f.rel}  ${mb(f.size)}`);
      } catch (e) { failed++; bad(`${f.rel}：${e.message}`); continue; }
    }
    resultLines.push([f.guessCourse, f.name, f.rel, publicUrl].map(csvCell).join(','));
  }

  fs.writeFileSync(RESULT_CSV, '\uFEFF' + resultLines.join('\n'), 'utf8');
  head('結果');
  ok(`本次新上傳：${uploaded} 個`);
  if (skipped) ok(`已上傳過而略過：${skipped} 個`);
  if (failed) warn(`失敗/略過：${failed} 個（可直接重跑，已成功的會自動略過）`);
  ok(`對照表已輸出：${RESULT_CSV}`);
  console.log('\n  下一步：打開 materials-upload-result.csv，依 public_url 到後台把教材貼進對應課程章節的「教材／附件」欄位。');
})().catch((e) => { console.error('\n工具執行錯誤：', e); process.exit(1); });
