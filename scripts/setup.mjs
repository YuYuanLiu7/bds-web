#!/usr/bin/env node
/**
 * BDS 一鍵開站腳本
 * ------------------------------------------------------------
 * 用途：把每個新站點的設定從「手動跑 SQL／建 bucket／改 role」壓到一個指令。
 *
 * 用法（於專案根目錄）：
 *   node scripts/setup.mjs                 # 驗證環境變數＋檢查資料表＋建立 uploads bucket
 *   node scripts/setup.mjs --migrate       # 另外用 SUPABASE_DB_URL 直接跑完所有 SQL 遷移（含 RLS）
 *   ADMIN_EMAIL=a@b.com ADMIN_PASSWORD=xxx ADMIN_NAME=站長 node scripts/setup.mjs --admin
 *
 * 需求：.env.local 已填好（至少 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY）。
 * 本腳本只讀環境變數與 db/*.sql，不會把任何機密寫進版控。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Node 20 無原生 WebSocket，supabase-js 建立 client 時會檢查其存在；
// 本腳本只用 REST/Storage（HTTPS），用不到 realtime，故塞一個永不被實例化的 stub 讓建構通過。
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {};
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DO_MIGRATE = args.includes('--migrate');
const DO_ADMIN = args.includes('--admin') || !!process.env.ADMIN_EMAIL;

// ── 小工具：彩色標記（無外部依賴）────────────────────────────
const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const warn = (m) => console.log('  \x1b[33m⚠\x1b[0m ' + m);
const head = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');
let hasError = false;

// ── 讀取 .env.local（不覆蓋已存在的 process.env）──────────────
function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) {
    warn('找不到 .env.local，僅以現有環境變數判斷（CI 環境正常）');
    return;
  }
  const text = fs.readFileSync(p, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

// ── 1. 環境變數檢查 ───────────────────────────────────────────
function checkEnv() {
  head('1. 環境變數檢查');
  const core = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET'];
  const payment = ['PAYUNI_MERID', 'PAYUNI_HASH_KEY', 'PAYUNI_HASH_IV', 'NEXT_PUBLIC_PAYUNI_UPP_URL'];
  const email = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'];
  const video = ['BUNNY_STREAM_LIBRARY_ID', 'BUNNY_TOKEN_AUTH_KEY'];

  const report = (label, keys, critical) => {
    const missing = keys.filter((k) => !process.env[k]);
    if (missing.length === 0) ok(`${label}：齊全`);
    else {
      const msg = `${label}：缺少 ${missing.join(', ')}`;
      if (critical) { bad(msg); hasError = true; } else warn(msg + '（該功能上線前需補齊）');
    }
  };
  report('核心（必填）', core, true);
  report('金流 PayUni', payment, false);
  report('寄信 Resend', email, false);
  report('影片 Bunny', video, false);

  // 正式環境安全提醒
  if (process.env.ENABLE_PAYMENT_SIMULATION === 'true') {
    warn('ENABLE_PAYMENT_SIMULATION=true（正式上線請改為 false 或移除，避免免費開通）');
  }
  if ((process.env.NEXT_PUBLIC_PAYUNI_UPP_URL || '').includes('sandbox')) {
    warn('PayUni 目前指向 sandbox 端點（測試用；正式上線請換 https://api.payuni.com.tw/api/upp）');
  }
}

// ── 可選：用 pg 跑完所有 SQL 遷移 ─────────────────────────────
async function runMigrations() {
  head('2. 資料庫遷移（--migrate）');
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    bad('未設定 SUPABASE_DB_URL，無法自動遷移。請於 Supabase → Project Settings → Database → Connection string 取得，');
    console.log('     或改為手動於 Supabase SQL Editor 依序貼上 db/*.sql。');
    hasError = true;
    return;
  }
  // 自動掃描 db/ 內所有 .sql（排除 schema.sql 參考檔），讓「未來新增的遷移檔」自動納入、永遠不會漏跑。
  // 規則：init.sql 必最先（建立基礎表）；fix_token_rls.sql / enable_rls.sql 必最後（對外上鎖）。
  // 其餘皆為冪等（IF NOT EXISTS / ADD COLUMN IF NOT EXISTS），彼此先後不影響結果，故依檔名排序即可。
  const FIRST = ['init.sql'];
  const LAST = ['fix_token_rls.sql', 'enable_rls.sql'];
  const allSql = fs
    .readdirSync(path.join(ROOT, 'db'))
    .filter((f) => f.endsWith('.sql') && f !== 'schema.sql');
  const middle = allSql.filter((f) => !FIRST.includes(f) && !LAST.includes(f)).sort();
  const order = [
    ...FIRST.filter((f) => allSql.includes(f)),
    ...middle,
    ...LAST.filter((f) => allSql.includes(f)),
  ];
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const file of order) {
      const fp = path.join(ROOT, 'db', file);
      if (!fs.existsSync(fp)) { warn(`略過（找不到）：db/${file}`); continue; }
      try {
        await client.query(fs.readFileSync(fp, 'utf8'));
        ok(`已執行 db/${file}`);
      } catch (e) {
        warn(`db/${file} 執行時有訊息（多為冪等可忽略）：${e.message}`);
      }
    }
  } finally {
    await client.end();
  }
}

// ── 連線 + 資料表檢查 + bucket + 管理員 ───────────────────────
async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    bad('缺少 Supabase URL 或 service_role 金鑰，後續檢查中止');
    hasError = true;
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function checkTables(supabase) {
  head((DO_MIGRATE ? '3' : '2') + '. 資料表檢查');
  const tables = [
    'users', 'courses', 'chapters', 'orders', 'user_courses', 'user_downloads',
    'downloads', 'articles', 'events', 'membership_plans', 'course_announcements',
    'course_reviews', 'course_comments', 'site_settings', 'rate_limits',
  ];
  const missing = [];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error && /relation|does not exist|not.*find|42P01/i.test(error.message)) missing.push(t);
    else if (error) warn(`${t}：查詢異常（${error.message}）`);
  }
  if (missing.length === 0) ok(`全部 ${tables.length} 張資料表皆存在`);
  else {
    bad(`缺少資料表：${missing.join(', ')}`);
    console.log('     → 請執行遷移：`node scripts/setup.mjs --migrate`（需 SUPABASE_DB_URL），');
    console.log('       或於 Supabase SQL Editor 依序貼上 db/*.sql（最後跑 enable_rls.sql）。');
    hasError = true;
  }
}

async function ensureBucket(supabase) {
  head((DO_MIGRATE ? '4' : '3') + '. Storage：uploads bucket');
  const { data, error } = await supabase.storage.getBucket('uploads');
  if (data) { ok('uploads bucket 已存在（public=' + data.public + '）'); return; }
  if (error && !/not.*found|does not exist/i.test(error.message)) {
    warn('查詢 bucket 異常：' + error.message); return;
  }
  const { error: cerr } = await supabase.storage.createBucket('uploads', { public: true });
  if (cerr) { bad('建立 uploads bucket 失敗：' + cerr.message); hasError = true; }
  else ok('已建立 public uploads bucket');
}

async function ensureAdmin(supabase) {
  head((DO_MIGRATE ? '5' : '4') + '. 管理員帳號');
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || '網站管理員';
  if (!email || !password) {
    warn('未提供 ADMIN_EMAIL / ADMIN_PASSWORD，略過建立管理員');
    console.log('     → 如需自動建立：ADMIN_EMAIL=a@b.com ADMIN_PASSWORD=至少6位 node scripts/setup.mjs --admin');
    return;
  }
  if (password.length < 6) { bad('ADMIN_PASSWORD 至少需 6 位'); hasError = true; return; }

  const { data: existing } = await supabase.from('users').select('id, role').eq('email', email).maybeSingle();
  if (existing) {
    if (existing.role === 'admin') ok(`管理員已存在：${email}`);
    else {
      const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', existing.id);
      if (error) { bad('提升為管理員失敗：' + error.message); hasError = true; }
      else ok(`已將既有帳號提升為管理員：${email}`);
    }
    return;
  }
  const password_hash = await bcrypt.hash(password, 12);
  const { error } = await supabase.from('users').insert([{ email, name, password_hash, role: 'admin' }]);
  if (error) { bad('建立管理員失敗：' + error.message); hasError = true; }
  else ok(`已建立管理員：${email}（密碼已雜湊儲存）`);
}

// ── 主流程 ───────────────────────────────────────────────────
(async () => {
  console.log('\x1b[1m\n=== BDS 一鍵開站檢查 ===\x1b[0m');
  loadEnvLocal();
  checkEnv();
  if (DO_MIGRATE) await runMigrations();

  const supabase = await checkSupabase();
  if (supabase) {
    await checkTables(supabase);
    await ensureBucket(supabase);
    if (DO_ADMIN) await ensureAdmin(supabase);
    else { head((DO_MIGRATE ? '5' : '4') + '. 管理員帳號'); warn('未指定 --admin，略過（見上方說明）'); }
  }

  head('結果');
  if (hasError) {
    console.log('  \x1b[31m有項目未通過，請依上方提示處理後重跑。\x1b[0m');
    process.exit(1);
  }
  console.log('  \x1b[32m基礎設定檢查通過。接著請完成金流真卡實測等項目，見 LAUNCH-CHECKLIST.md。\x1b[0m');
})().catch((e) => {
  console.error('\n腳本執行錯誤：', e);
  process.exit(1);
});
