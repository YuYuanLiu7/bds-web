#!/usr/bin/env node
/**
 * BDS 影片批次上傳工具（把整個資料夾的影片一次傳到 Bunny Stream）
 * ------------------------------------------------------------
 * 特色：
 *  - 不管影片怎麼放：遞迴掃描整個資料夾（含子資料夾）找出所有影片檔
 *  - 全部上傳，不重複、可中斷後續傳（進度記在 bunny-upload-progress.json）
 *  - 產出對照表 bunny-upload-result.csv：每個檔 → Bunny 網址；
 *    並「猜」一版對應（最外層資料夾名＝課程、檔名＝章節）供你在後台貼上時參考
 *
 *  ⚠️ 誠實說明：工具能保證「全部傳上去、給你對照表」，但「哪支影片屬於哪門課的哪一章」
 *     若資料夾本身沒有這個資訊，任何工具都無法自動判斷——那部分需你依對照表在後台對應。
 *
 * 模式：
 *   node scripts/bunny-upload.mjs "影片資料夾路徑"
 *       只掃描：列出找到幾支、總大小，並輸出「上傳計畫」bunny-upload-plan.csv（不上傳、不需金鑰）
 *   node scripts/bunny-upload.mjs "影片資料夾路徑" --upload
 *       正式上傳（可中斷續傳）；可加 --limit 3 先傳 3 支測試
 *
 * 需求（--upload 時）：.env.local 需有
 *   BUNNY_STREAM_LIBRARY_ID   （影片庫 ID）
 *   BUNNY_STREAM_API_KEY      （影片庫的 API Key／AccessKey，取自 Bunny → Stream → 你的影片庫 → API）
 *   ※ 注意：這把「上傳用」的 API Key 與播放防盜用的 BUNNY_TOKEN_AUTH_KEY 是不同的東西。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const UPLOAD = argv.includes('--upload');
const limIdx = argv.indexOf('--limit');
const LIMIT = limIdx !== -1 ? parseInt(argv[limIdx + 1], 10) : Infinity;
const folder = argv.find((a) => !a.startsWith('--') && a !== String(LIMIT));

const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi', '.wmv', '.flv']);
const PROGRESS = path.join(process.cwd(), 'bunny-upload-progress.json');
const PLAN_CSV = path.join(process.cwd(), 'bunny-upload-plan.csv');
const RESULT_CSV = path.join(process.cwd(), 'bunny-upload-result.csv');

const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const warn = (m) => console.log('  \x1b[33m⚠\x1b[0m ' + m);
const head = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`;

if (!folder) { bad('請提供影片資料夾路徑，例如：node scripts/bunny-upload.mjs "C:/影片"'); process.exit(1); }

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

// 遞迴掃描資料夾找影片
function scan(dir, root, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) scan(full, root, out);
    else if (VIDEO_EXT.has(path.extname(name).toLowerCase())) {
      const rel = path.relative(root, full);
      const parts = rel.split(path.sep);
      out.push({
        full,
        rel,
        size: st.size,
        guessCourse: parts.length > 1 ? parts[0] : '（未分資料夾）', // 最外層資料夾＝猜的課程
        guessChapter: path.basename(name, path.extname(name)),       // 檔名（去副檔名）＝猜的章節
      });
    }
  }
  return out;
}

function readProgress() { try { return JSON.parse(fs.readFileSync(PROGRESS, 'utf8')); } catch { return {}; } }
function writeProgress(p) { fs.writeFileSync(PROGRESS, JSON.stringify(p, null, 2)); }

async function bunnyCreateVideo(libId, apiKey, title) {
  const res = await fetch(`https://video.bunnycdn.com/library/${libId}/videos`, {
    method: 'POST',
    headers: { AccessKey: apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`建立影片物件失敗（HTTP ${res.status}）`);
  const data = await res.json();
  return data.guid;
}

async function bunnyUploadFile(libId, apiKey, guid, filePath) {
  const stream = fs.createReadStream(filePath);
  const res = await fetch(`https://video.bunnycdn.com/library/${libId}/videos/${guid}`, {
    method: 'PUT',
    headers: { AccessKey: apiKey, 'Content-Type': 'application/octet-stream' },
    body: stream,
    duplex: 'half',
  });
  if (!res.ok) throw new Error(`上傳檔案失敗（HTTP ${res.status}）`);
}

(async () => {
  console.log('\x1b[1m\n=== BDS 影片批次上傳工具 ===\x1b[0m');
  const absFolder = path.isAbsolute(folder) ? folder : path.resolve(process.cwd(), folder);
  if (!fs.existsSync(absFolder)) { bad('找不到資料夾：' + absFolder); process.exit(1); }

  const files = scan(absFolder, absFolder);
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  head('1. 掃描結果');
  ok(`找到影片檔：${files.length} 支`);
  ok(`總大小：${mb(totalSize)}`);

  // 輸出上傳計畫（猜的課程/章節對應）
  const planLines = ['course_guess,chapter_guess,relative_path,size_mb'];
  for (const f of files) planLines.push([f.guessCourse, f.guessChapter, f.rel, (f.size / 1024 / 1024).toFixed(1)].map(csvCell).join(','));
  fs.writeFileSync(PLAN_CSV, '\uFEFF' + planLines.join('\n'), 'utf8');
  ok(`已輸出上傳計畫（猜的課程/章節對應）：${PLAN_CSV}`);

  if (!UPLOAD) {
    head('結果');
    warn('這是「只掃描」，未上傳、未使用金鑰。');
    console.log('     · 打開 bunny-upload-plan.csv 看看「猜的課程/章節」對不對。');
    console.log('     · 要正式上傳：加 --upload（可先加 --limit 3 傳 3 支測試）。');
    return;
  }

  loadEnvLocal();
  const libId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (!libId || !apiKey) {
    bad('缺少 BUNNY_STREAM_LIBRARY_ID 或 BUNNY_STREAM_API_KEY（後者取自 Bunny → Stream → 影片庫 → API）');
    process.exit(1);
  }

  head('2. 上傳到 Bunny（可中斷續傳）');
  const progress = readProgress(); // { 絕對路徑: { guid } }
  const resultLines = ['course_guess,chapter_guess,relative_path,bunny_guid,embed_url'];
  let done = 0, uploaded = 0, skipped = 0, failed = 0;

  for (const f of files) {
    if (done >= LIMIT) break;
    done++;
    let guid = progress[f.full]?.guid;
    if (guid) {
      skipped++;
    } else {
      try {
        guid = await bunnyCreateVideo(libId, apiKey, f.guessChapter);
        await bunnyUploadFile(libId, apiKey, guid, f.full);
        progress[f.full] = { guid };
        writeProgress(progress); // 每支傳完就存，中斷可續
        uploaded++;
        console.log(`     ✓ (${uploaded}) ${f.rel}  ${mb(f.size)}`);
      } catch (e) {
        failed++;
        bad(`${f.rel}：${e.message}`);
        continue;
      }
    }
    const embed = `https://iframe.mediadelivery.net/embed/${libId}/${guid}`;
    resultLines.push([f.guessCourse, f.guessChapter, f.rel, guid, embed].map(csvCell).join(','));
  }

  fs.writeFileSync(RESULT_CSV, '\uFEFF' + resultLines.join('\n'), 'utf8');
  head('結果');
  ok(`本次新上傳：${uploaded} 支`);
  if (skipped) ok(`已上傳過而略過：${skipped} 支`);
  if (failed) warn(`失敗：${failed} 支（可直接重跑，已成功的會自動略過）`);
  ok(`對照表已輸出：${RESULT_CSV}`);
  console.log('\n  下一步：打開 bunny-upload-result.csv，依 embed_url 到後台把每支影片貼進對應課程的章節。');
})().catch((e) => { console.error('\n工具執行錯誤：', e); process.exit(1); });
