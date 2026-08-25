#!/usr/bin/env node
/**
 * BDS 課程空殼建立工具（照 CSV 的課程標題，自動在系統建立「空課程」）
 * ------------------------------------------------------------
 * 目的：確保匯入學員權限時「課程標題」一定對得上，且不必手動一門一門建、不會打錯字。
 * 建立的課程為「未發佈」狀態（is_published=false），只是空殼；
 * 你之後在後台補上說明、章節與影片，完成後再「發佈」即可對外顯示。
 *
 * 模式：
 *   node scripts/create-course-shells.mjs <csv 路徑>
 *       試跑：列出「會新增幾門、哪些已存在」，不寫入
 *   node scripts/create-course-shells.mjs <csv 路徑> --commit
 *       正式建立缺少的課程空殼（可重複執行，不會重複建立）
 *
 * 需求：.env.local 已填 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

if (typeof globalThis.WebSocket === 'undefined') globalThis.WebSocket = class {};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const COMMIT = argv.includes('--commit');
const csvPath = argv.find((a) => !a.startsWith('--'));

const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const warn = (m) => console.log('  \x1b[33m⚠\x1b[0m ' + m);
const head = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');
const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');

if (!csvPath) { bad('請提供 CSV 路徑'); process.exit(1); }

function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) { bad('找不到 .env.local'); process.exit(1); }
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('='); if (eq === -1) continue;
    const key = line.slice(0, eq).trim(); let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') {}
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r[0] && r[0].trim()));
}

function distinctCourseTitles() {
  const abs = path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(abs)) { bad('找不到 CSV：' + abs); process.exit(1); }
  const rows = parseCSV(fs.readFileSync(abs, 'utf8'));
  const header = rows.shift().map((h) => norm(h).toLowerCase());
  const iCourses = header.indexOf('attended courses');
  if (iCourses === -1) { bad('CSV 找不到 Attended courses 欄位'); process.exit(1); }
  const set = new Set();
  for (const r of rows) norm(r[iCourses]).split(',').map(norm).filter(Boolean).forEach((t) => set.add(t));
  return [...set];
}

(async () => {
  console.log('\x1b[1m\n=== BDS 課程空殼建立工具 ===\x1b[0m');
  const titles = distinctCourseTitles();
  ok(`CSV 中不重複課程標題：${titles.length} 種`);

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { bad('缺少 Supabase 連線資訊'); process.exit(1); }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: courses, error } = await supabase.from('courses').select('title');
  if (error) { bad('讀取 courses 失敗：' + error.message); process.exit(1); }
  const existing = new Set((courses || []).map((c) => norm(c.title)));

  const toCreate = titles.filter((t) => !existing.has(t));
  const already = titles.filter((t) => existing.has(t));

  head('比對結果');
  ok(`已存在（跳過）：${already.length} 門`);
  ok(`將建立空殼：${toCreate.length} 門`);
  toCreate.sort().forEach((t, i) => console.log(`  ${String(i + 1).padStart(2)}. ${t}`));

  if (!COMMIT) {
    head('結果'); warn('這是「試跑」，未建立任何課程。確認上面清單後，加 --commit 正式建立。');
    return;
  }

  head('建立中（--commit）');
  let created = 0, failed = 0;
  for (const title of toCreate) {
    const { error: e } = await supabase.from('courses').insert({
      title,
      description: '',
      price: 0,
      category: '未分類',
      is_published: false, // 空殼，補完內容後再於後台發佈
    });
    if (e) { bad(`建立失敗「${title}」：${e.message}`); failed++; }
    else created++;
  }
  head('結果');
  ok(`已建立空殼課程：${created} 門`);
  if (failed) warn(`失敗：${failed} 門`);
  console.log('\n  下一步：到後台 /admin 補上每門課的說明、章節與影片，完成後把課程「發佈」。');
})().catch((e) => { console.error('\n工具執行錯誤：', e); process.exit(1); });
