#!/usr/bin/env node
/**
 * BDS 學員匯入工具（從 Teachify 匯出的 CSV 搬家用）
 * ------------------------------------------------------------
 * CSV 欄位：Name, Email, Contact number, Join date, Student tags, Attended courses, Notes
 * 其中「Attended courses」是以「, 」分隔的課程「標題」清單，代表該學員可觀看的課程。
 *
 * 三種模式：
 *   node scripts/import-students.mjs <csv 路徑> --preview
 *       只解析 CSV、印出統計（不連資料庫、最安全，可先看數字）
 *
 *   node scripts/import-students.mjs <csv 路徑>
 *       連資料庫「試跑」：比對課程標題、報告會建立幾位學員、哪些課程標題在系統中找不到
 *       —— 不會寫入任何資料
 *
 *   node scripts/import-students.mjs <csv 路徑> --commit
 *       真正寫入：建立/更新學員（密碼設為隨機值、is_verified=true），
 *       並依 Attended courses 開通對應課程權限（user_courses）。可重複執行（不會重複建立）。
 *
 * 需求：於 bds-web 目錄下，且 .env.local 已填好 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY。
 * 說明：任何平台都無法匯出會員密碼，故匯入後密碼為隨機值；學員需用「忘記密碼」設定新密碼一次。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

if (typeof globalThis.WebSocket === 'undefined') globalThis.WebSocket = class {};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const PREVIEW = argv.includes('--preview');
const COMMIT = argv.includes('--commit');
const csvPath = argv.find((a) => !a.startsWith('--'));

const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const warn = (m) => console.log('  \x1b[33m⚠\x1b[0m ' + m);
const head = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');

if (!csvPath) {
  bad('請提供 CSV 路徑，例如：node scripts/import-students.mjs "../BDS-students-2026-08-24.csv" --preview');
  process.exit(1);
}

// ── 迷你 CSV 解析器（支援引號包住的欄位、欄位內逗號與換行、"" 轉義；自動去除 BOM）──
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // 去 BOM
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* 忽略 */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

// 標題正規化後比對（去頭尾空白、把連續空白收斂為一個），降低因空白差異導致的對不上
const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');

function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) { warn('找不到 .env.local，將只能跑 --preview 模式'); return; }
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

// ── 讀檔＋解析成學員物件 ──
function readStudents() {
  const abs = path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(abs)) { bad('找不到 CSV：' + abs); process.exit(1); }
  const rows = parseCSV(fs.readFileSync(abs, 'utf8'));
  const header = rows.shift().map((h) => norm(h).toLowerCase());
  const col = (name) => header.indexOf(name);
  const iName = col('name'), iEmail = col('email'), iPhone = col('contact number');
  const iJoin = col('join date'), iCourses = col('attended courses');
  if (iEmail === -1 || iCourses === -1) {
    bad('CSV 欄位不符預期（需要 Email 與 Attended courses）。實際標題：' + header.join(' | '));
    process.exit(1);
  }
  return rows.map((r) => ({
    name: norm(r[iName]),
    email: norm(r[iEmail]).toLowerCase(),
    phone: norm(r[iPhone]),
    joinDate: norm(r[iJoin]),
    courses: norm(r[iCourses]).split(',').map(norm).filter(Boolean),
  }));
}

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { bad('缺少 Supabase 連線資訊（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）'); process.exit(1); }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// ── 主流程 ──
(async () => {
  console.log('\x1b[1m\n=== BDS 學員匯入工具 ===\x1b[0m');
  const students = readStudents();

  // 基本統計
  const withEmail = students.filter((s) => s.email && /.+@.+\..+/.test(s.email));
  const noEmail = students.length - withEmail.length;
  const courseTitleSet = new Set();
  let grantPairs = 0;
  for (const s of withEmail) for (const c of s.courses) { courseTitleSet.add(c); grantPairs++; }

  head('1. CSV 解析結果');
  ok(`總資料列：${students.length} 位`);
  ok(`有有效 Email（可匯入）：${withEmail.length} 位`);
  if (noEmail) warn(`沒有 Email（無法匯入、將略過）：${noEmail} 位`);
  ok(`CSV 中出現的不重複課程標題：${courseTitleSet.size} 種`);
  ok(`要開通的「學員×課程」權限筆數：${grantPairs} 筆`);

  if (PREVIEW) {
    head('課程標題清單（請確認這些課稍後都要在系統中以「相同標題」建立）');
    [...courseTitleSet].sort().forEach((t, i) => console.log(`  ${String(i + 1).padStart(2)}. ${t}`));
    head('結果'); ok('預覽完成（未連資料庫、未寫入任何資料）。');
    return;
  }

  // 需要資料庫：比對課程標題 → id
  loadEnvLocal();
  const supabase = await getSupabase();

  head('2. 比對系統內既有課程（依標題對應）');
  const { data: courses, error: cErr } = await supabase.from('courses').select('id, title');
  if (cErr) { bad('讀取 courses 失敗：' + cErr.message); process.exit(1); }
  const titleToId = new Map();
  for (const c of courses || []) titleToId.set(norm(c.title), c.id);

  const matched = [], unmatched = [];
  for (const t of courseTitleSet) (titleToId.has(t) ? matched : unmatched).push(t);
  ok(`系統內課程總數：${(courses || []).length} 門`);
  ok(`CSV 課程標題「對得上」的：${matched.length} 種`);
  if (unmatched.length) {
    warn(`CSV 課程標題「找不到對應課程」的：${unmatched.length} 種（這些課的權限會先跳過）`);
    console.log('     → 請先在後台以「完全相同的標題」建立這些課程，再重跑本工具：');
    unmatched.sort().forEach((t) => console.log(`        · ${t}`));
  }

  if (!COMMIT) {
    head('結果');
    warn('這是「試跑」，未寫入任何資料。確認上面數字無誤後，加 --commit 正式匯入。');
    return;
  }

  // 正式寫入
  head('3. 寫入學員與課程權限（--commit）');
  const sharedHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12); // 佔位密碼，學員需自行重設
  let createdOrUpdated = 0, granted = 0, failed = 0;

  for (const s of withEmail) {
    // 3a. upsert 使用者（以 email 為唯一鍵；已存在則更新姓名/電話，不覆寫既有密碼）
    const { data: existing } = await supabase.from('users').select('id').eq('email', s.email).maybeSingle();
    let userId;
    if (existing) {
      userId = existing.id;
      await supabase.from('users').update({ name: s.name || undefined, phone: s.phone || undefined }).eq('id', userId);
    } else {
      const { data: inserted, error: uErr } = await supabase.from('users')
        .insert({ email: s.email, name: s.name || s.email.split('@')[0], phone: s.phone || null,
                  role: 'user', is_verified: true, password_hash: sharedHash })
        .select('id').single();
      if (uErr || !inserted) { bad(`建立失敗 ${s.email}：${uErr?.message}`); failed++; continue; }
      userId = inserted.id;
    }
    createdOrUpdated++;

    // 3b. 依對得上的課程標題開通權限（重複執行安全）
    const rows = s.courses
      .filter((t) => titleToId.has(t))
      .map((t) => ({ user_id: userId, course_id: titleToId.get(t), purchased_at: new Date().toISOString() }));
    if (rows.length) {
      const { error: gErr } = await supabase.from('user_courses').upsert(rows, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
      if (gErr) bad(`開通權限失敗 ${s.email}：${gErr.message}`);
      else granted += rows.length;
    }
    if (createdOrUpdated % 50 === 0) console.log(`     ...已處理 ${createdOrUpdated} 位`);
  }

  head('結果');
  ok(`已建立/更新學員：${createdOrUpdated} 位`);
  ok(`已開通課程權限：${granted} 筆`);
  if (failed) warn(`失敗：${failed} 位（見上方訊息）`);
  console.log('\n  下一步：請通知所有學員到「網站/forgot-password」用同一個 Email 設定新密碼即可登入。');
})().catch((e) => { console.error('\n工具執行錯誤：', e); process.exit(1); });
