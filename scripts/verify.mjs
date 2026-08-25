#!/usr/bin/env node
/**
 * BDS 架站後「一鍵驗收」腳本
 * ------------------------------------------------------------
 * 用途：客戶把網站架好、資料庫建好之後，跑這一支做上線前總體檢。
 *       全程「唯讀」——只檢查、不會修改或刪除任何資料，可安心重複跑。
 *
 * 用法（於 bds-web 資料夾）：
 *   node scripts/verify.mjs
 *   （或 npm run verify）
 *
 * 需求：.env.local 已填好（至少 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY）。
 *
 * 結果：全部通過 → exit 0；有「必須修正」項未過 → exit 1（並印出清楚的下一步）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

if (typeof globalThis.WebSocket === 'undefined') globalThis.WebSocket = class {};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const warn = (m) => console.log('  \x1b[33m⚠\x1b[0m ' + m);
const head = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');
let fail = 0; // 必須修正的項目數

function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) { warn('找不到 .env.local（若在 Netlify/CI 以現有環境變數執行則正常）'); return; }
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('='); if (eq === -1) continue;
    const key = line.slice(0, eq).trim(); let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function checkEnv() {
  head('1. 環境變數');
  const core = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET'];
  const missingCore = core.filter((k) => !process.env[k]);
  if (missingCore.length === 0) ok('核心變數齊全（Supabase / NEXTAUTH）');
  else { bad(`核心變數缺少：${missingCore.join(', ')}（網站無法正常運作）`); fail++; }

  const groups = [
    ['金流 PayUni', ['PAYUNI_MERID', 'PAYUNI_HASH_KEY', 'PAYUNI_HASH_IV', 'NEXT_PUBLIC_PAYUNI_UPP_URL']],
    ['寄信 Resend', ['RESEND_API_KEY', 'RESEND_FROM_EMAIL']],
    ['影片 Bunny', ['BUNNY_STREAM_LIBRARY_ID', 'BUNNY_TOKEN_AUTH_KEY']],
  ];
  for (const [label, keys] of groups) {
    const miss = keys.filter((k) => !process.env[k]);
    if (miss.length === 0) ok(`${label}：齊全`);
    else warn(`${label}：缺少 ${miss.join(', ')}（該功能上線前需補齊）`);
  }

  // 上線安全提醒
  if (process.env.ENABLE_PAYMENT_SIMULATION === 'true') {
    bad('ENABLE_PAYMENT_SIMULATION=true（正式站必須關閉，否則有人能免費開通會員）'); fail++;
  }
  if ((process.env.NEXT_PUBLIC_PAYUNI_UPP_URL || '').includes('sandbox')) {
    warn('PayUni 仍指向 sandbox 測試端點（正式收真錢前請換成 https://api.payuni.com.tw/api/upp）');
  }
  if ((process.env.RESEND_FROM_EMAIL || '') === 'onboarding@resend.dev') {
    warn('寄件人仍是沙盒地址 onboarding@resend.dev（正式對外收客前必須換成自家已驗證網域，否則客戶收不到驗證信而無法登入）');
  }
}

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// 先探測連線是否正常（連不到／金鑰錯時，避免後面把「資料表不存在」誤判為通過）
async function probeConnection(supabase) {
  const { error } = await supabase.from('site_settings').select('key', { head: true, count: 'exact' });
  if (error && !/relation|does not exist|not.*find|42P01/i.test(error.message)) {
    head('2. 資料庫');
    bad(`連不到資料庫或金鑰有誤：${error.message}`);
    console.log('     → 請確認 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY 正確、且網路可連到 Supabase。');
    fail++;
    return false;
  }
  return true;
}

async function checkDatabase(supabase) {
  head('2. 資料庫');
  const tables = [
    'users', 'courses', 'chapters', 'orders', 'user_courses', 'user_downloads',
    'downloads', 'articles', 'events', 'membership_plans', 'course_announcements',
    'course_reviews', 'course_comments', 'site_settings', 'rate_limits',
    'verification_tokens', 'password_reset_tokens',
  ];
  const missing = [];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error && /relation|does not exist|not.*find|42P01/i.test(error.message)) missing.push(t);
  }
  if (missing.length === 0) ok(`全部 ${tables.length} 張資料表都在`);
  else { bad(`缺少資料表：${missing.join(', ')} → 請確認 db/*.sql 都已在 Supabase SQL Editor 執行`); fail++; }

  // check_rate_limit RPC（限流功能靠它）
  const { error: rpcErr } = await supabase.rpc('check_rate_limit', {
    p_key: 'verify-selfcheck', p_limit: 100000, p_window_seconds: 60,
  });
  if (!rpcErr) ok('限流函式 check_rate_limit 存在且可呼叫');
  else if (/function|does not exist|not.*find|42883/i.test(rpcErr.message)) {
    bad('限流函式 check_rate_limit 不存在 → 請執行 db/add_rate_limiting.sql（否則登入/註冊等限流失效）'); fail++;
  } else warn(`呼叫 check_rate_limit 有訊息：${rpcErr.message}`);
}

async function checkStorage(supabase) {
  head('3. 圖片/檔案儲存空間');
  const { data, error } = await supabase.storage.getBucket('uploads');
  if (error || !data) { bad('找不到 uploads bucket → 請於 Supabase → Storage 建立名為 uploads 的 Public bucket'); fail++; return; }
  if (data.public) ok('uploads bucket 存在且為 Public');
  else { warn('uploads bucket 存在但非 Public（上傳的圖片可能無法公開顯示，建議設為 Public）'); }
}

async function checkData(supabase) {
  head('4. 基本資料');
  const { data: settings } = await supabase.from('site_settings').select('key').eq('key', 'homepage').maybeSingle();
  if (settings) ok('網站設定 site_settings(homepage) 已初始化');
  else warn('找不到 site_settings(homepage)（首頁視覺設定會用預設值；跑過 db/init.sql 即會有）');

  const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin');
  if (error) warn(`查詢管理員帳號異常：${error.message}`);
  else if ((count || 0) >= 1) ok(`已有管理員帳號（${count} 個）`);
  else { bad('尚無任何管理員帳號 → 請到 /signup 註冊後，於 SQL 執行 UPDATE users SET role=\'admin\', is_verified=true WHERE email=\'你的信箱\''); fail++; }
}

async function checkSite() {
  const base = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
  head('5. 網站健康檢查（選用）');
  if (!base || /localhost|127\.0\.0\.1/.test(base)) { warn('NEXTAUTH_URL 未設或為本機，略過線上檢查'); return; }
  const hit = async (label, url) => {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) ok(`${label}：${res.status} OK`);
      else warn(`${label}：回應 ${res.status}（部署可能尚未完成或該功能未設定）`);
    } catch {
      warn(`${label}：連不上（部署可能尚未完成）`);
    }
  };
  await hit('公開課程 API', `${base}/api/courses`);
  await hit('公開設定 API', `${base}/api/settings?key=faqs`);
}

(async () => {
  console.log('\x1b[1m\n=== BDS 架站後一鍵驗收 ===\x1b[0m');
  loadEnvLocal();
  checkEnv();
  const supabase = await getSupabase();
  if (!supabase) { bad('缺少 Supabase 連線資訊，後續檢查中止'); fail++; }
  else if (await probeConnection(supabase)) {
    await checkDatabase(supabase);
    await checkStorage(supabase);
    await checkData(supabase);
    await checkSite();
  } else {
    warn('因無法連線，略過資料表／儲存空間／資料檢查。修正連線後請重跑。');
  }

  head('驗收結果');
  if (fail === 0) {
    console.log('  \x1b[32m全部必要項目通過！\x1b[0m 上面若有黃色 ⚠ 提醒，是「上線前建議補齊」的項目（例如金流換正式、寄信換自家網域）。');
    process.exit(0);
  }
  console.log(`  \x1b[31m有 ${fail} 項「必須修正」未通過\x1b[0m，請依上面每項後面的指示處理，再重跑一次。`);
  process.exit(1);
})().catch((e) => { console.error('\n驗收腳本錯誤：', e); process.exit(1); });
