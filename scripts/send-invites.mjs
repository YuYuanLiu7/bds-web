#!/usr/bin/env node
/**
 * BDS 搬家邀請信工具（寄「設定新密碼」信給已匯入的學員）
 * ------------------------------------------------------------
 * 搭配 import-students.mjs 使用：學員匯入後密碼是隨機值，需自行設定。
 * 本工具為每位學員產生一組 7 天效期的重設連結，寄出「歡迎搬家、請設定新密碼」信。
 * 連結指向系統既有的 /reset-password 頁面，學員點一下設好密碼即可用原 Email 登入。
 *
 * 模式：
 *   node scripts/send-invites.mjs <csv 路徑>
 *       試跑：列出「會寄給誰、共幾封」，不寄出、不寫入
 *
 *   node scripts/send-invites.mjs <csv 路徑> --test you@example.com
 *       只寄一封測試信到指定信箱（先看看信長怎樣、連結能不能用）
 *
 *   node scripts/send-invites.mjs <csv 路徑> --send
 *       正式寄給全部人（每封間隔約 0.4 秒，避免觸發寄信商速率限制）
 *
 * 需求環境變數（.env.local）：NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY、
 *   RESEND_API_KEY、RESEND_FROM_EMAIL、NEXTAUTH_URL。
 * ⚠️ 要真的寄到 656 位客戶，RESEND_FROM_EMAIL 必須是「已驗證網域」的地址；
 *    若還在用 onboarding@resend.dev 沙盒地址，只會寄到你自己的驗證信箱，本工具會擋下 --send。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

if (typeof globalThis.WebSocket === 'undefined') globalThis.WebSocket = class {};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const SEND = argv.includes('--send');
const testIdx = argv.indexOf('--test');
const TEST_EMAIL = testIdx !== -1 ? argv[testIdx + 1] : null;
const limIdx = argv.indexOf('--limit');
const LIMIT = limIdx !== -1 ? parseInt(argv[limIdx + 1], 10) : Infinity; // 每次最多寄幾封（配合 Resend 每日上限分批）
const csvPath = argv.find((a) => !a.startsWith('--') && a !== TEST_EMAIL && a !== String(LIMIT));

const TOKEN_TTL_DAYS = 7;
const SEND_GAP_MS = 400;
// 已成功寄出的紀錄檔與結果檔（放專案根目錄）——用來「只補未寄成功者」、避免重複寄、且結果可稽核
const SENT_LOG = path.join(process.cwd(), 'invites-sent.json');
const RESULT_CSV = path.join(process.cwd(), 'send-invites-result.csv');

const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const warn = (m) => console.log('  \x1b[33m⚠\x1b[0m ' + m);
const head = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local');
  if (!fs.existsSync(p)) return;
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('='); if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
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
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r[0] && r[0].trim()));
}

function readRecipients() {
  const abs = path.isAbsolute(csvPath) ? csvPath : path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(abs)) { bad('找不到 CSV：' + abs); process.exit(1); }
  const rows = parseCSV(fs.readFileSync(abs, 'utf8'));
  const header = rows.shift().map((h) => h.trim().toLowerCase());
  const iEmail = header.indexOf('email'), iName = header.indexOf('name');
  const seen = new Set(); const out = [];
  for (const r of rows) {
    const email = (r[iEmail] || '').trim().toLowerCase();
    const name = (r[iName] || '').trim();
    if (!/.+@.+\..+/.test(email) || seen.has(email)) continue;
    seen.add(email); out.push({ email, name: name || email.split('@')[0] });
  }
  return out;
}

function inviteHtml(name, url) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>設定您的新密碼</title></head>
  <body style="font-family:sans-serif;background:#f5f7fb;color:#334155;margin:0;padding:40px 20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
      <h2 style="color:#21448e;text-align:center;">BDS 線上學習平台</h2>
      <p>親愛的 ${name} 您好：</p>
      <p>我們的學習平台已<strong>全新升級搬遷</strong>！您原有的帳號與已購買的課程權限都已為您保留。</p>
      <p>由於系統升級，麻煩您點擊下方按鈕，用您<strong>原本的 Email</strong> 設定一組新密碼，即可繼續觀看所有課程：</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${url}" style="display:inline-block;background:#21448e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;">設定我的新密碼</a>
      </div>
      <p>或複製以下連結至瀏覽器開啟：</p>
      <p style="word-break:break-all;color:#21448e;font-size:14px;">${url}</p>
      <p style="color:#64748b;font-size:14px;">此連結將在 ${TOKEN_TTL_DAYS} 天後失效；若過期，您也可到登入頁點「忘記密碼」重新取得。</p>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:16px;">本郵件由 BDS 系統自動發送。</p>
    </div>
  </body></html>`;
}

async function sendEmail({ apiKey, fromEmail, to, name, url }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: `BDS 學習平台 <${fromEmail}>`,
      to: [to],
      subject: '【BDS】平台已搬遷，請設定您的新密碼以繼續學習',
      html: inviteHtml(name, url),
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, id: data.id, error: data.message || data.name };
}

(async () => {
  console.log('\x1b[1m\n=== BDS 搬家邀請信工具 ===\x1b[0m');
  if (!csvPath) { bad('請提供 CSV 路徑'); process.exit(1); }
  loadEnvLocal();

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');

  let recipients = readRecipients();
  head('1. 收件對象');
  ok(`CSV 中不重複、有效 Email：${recipients.length} 位`);

  // 試跑（未加 --send 也非 --test）
  if (!SEND && !TEST_EMAIL) {
    head('結果');
    warn('這是「試跑」，未寄出任何信。');
    console.log('     · 先寄一封測試信看看：加 --test 你的信箱');
    console.log('     · 確認無誤後正式寄出：加 --send');
    return;
  }

  // 環境檢查
  const missing = [];
  if (!supaUrl || !supaKey) missing.push('Supabase 連線');
  if (!apiKey) missing.push('RESEND_API_KEY');
  if (!siteUrl) missing.push('NEXTAUTH_URL');
  if (missing.length) { bad('缺少：' + missing.join('、')); process.exit(1); }

  if (SEND && fromEmail === 'onboarding@resend.dev') {
    bad('RESEND_FROM_EMAIL 仍是沙盒地址 onboarding@resend.dev，正式寄送只會送到你自己的驗證信箱，客戶收不到。');
    console.log('     → 請先在 Resend 驗證你的網域、把 RESEND_FROM_EMAIL 改成 no-reply@你的網域，再重跑 --send。');
    console.log('     （想先看信長怎樣，可用 --test 你的信箱，沙盒地址可以寄給自己測試。）');
    process.exit(1);
  }

  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // --test：只寄一封
  if (TEST_EMAIL) {
    const token = crypto.randomBytes(32).toString('hex');
    const url = `${siteUrl}/reset-password?token=${token}&email=${encodeURIComponent(TEST_EMAIL)}`;
    head('2. 寄送測試信');
    const r = await sendEmail({ apiKey, fromEmail, to: TEST_EMAIL, name: '測試', url });
    if (r.ok) ok(`已寄出測試信到 ${TEST_EMAIL}（此為預覽，未寫入 token；連結需實際 token 才能真的重設）`);
    else bad(`測試信寄送失敗：${r.error}`);
    return;
  }

  // 正式寄送
  head('2. 正式寄送');
  // 讀取「已成功寄出」記錄：重跑時自動跳過，避免重複寄、也不會作廢別人手上還沒點的連結
  let sentSet = new Set();
  try { sentSet = new Set(JSON.parse(fs.readFileSync(SENT_LOG, 'utf8'))); } catch { /* 首次執行沒有記錄檔 */ }
  const pending = recipients.filter((r) => !sentSet.has(r.email));
  ok(`名單共 ${recipients.length} 位；已成功寄過 ${sentSet.size} 位；這次待寄 ${pending.length} 位`);
  if (Number.isFinite(LIMIT)) ok(`本次上限 --limit ${LIMIT} 封（配合 Resend 每日額度分批；隔天再跑一次即續寄）`);

  const resultRows = [];
  let sent = 0, failed = 0, quota = 0; const fails = [];
  for (const rcpt of pending) {
    if (sent >= LIMIT) { quota = pending.length - sent - failed; break; }
    const { data: user } = await supabase.from('users').select('id').eq('email', rcpt.email).maybeSingle();
    if (!user) { warn(`略過（系統查無此帳號，請先跑 import-students）：${rcpt.email}`); resultRows.push([rcpt.email, 'skipped-no-user', '']); continue; }

    const token = crypto.randomBytes(32).toString('hex');
    await supabase.from('password_reset_tokens').delete().eq('email', rcpt.email);
    const { error: tErr } = await supabase.from('password_reset_tokens').insert([{ email: rcpt.email, token, expires_at: expiresAt }]);
    if (tErr) { failed++; fails.push(rcpt.email); resultRows.push([rcpt.email, 'failed-token', tErr.message]); bad(`產生連結失敗 ${rcpt.email}：${tErr.message}`); continue; }

    const url = `${siteUrl}/reset-password?token=${token}&email=${encodeURIComponent(rcpt.email)}`;
    const r = await sendEmail({ apiKey, fromEmail, to: rcpt.email, name: rcpt.name, url });
    if (r.ok) {
      sent++; sentSet.add(rcpt.email);
      fs.writeFileSync(SENT_LOG, JSON.stringify([...sentSet], null, 0)); // 每封成功即存檔，中斷也不會忘記寄過誰
      resultRows.push([rcpt.email, 'sent', r.id || '']);
      if (sent % 25 === 0) console.log(`     ...本次已寄 ${sent} 封`);
    } else {
      failed++; fails.push(rcpt.email); resultRows.push([rcpt.email, 'failed-send', r.error || '']);
      bad(`寄送失敗 ${rcpt.email}：${r.error}`);
    }
    await sleep(SEND_GAP_MS);
  }

  // 輸出結果檔（可稽核）
  const csv = ['email,status,detail', ...resultRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))];
  fs.writeFileSync(RESULT_CSV, '﻿' + csv.join('\n'), 'utf8');

  head('結果');
  ok(`本次成功寄出：${sent} 封（累計已寄 ${sentSet.size} / ${recipients.length}）`);
  if (failed) { warn(`本次失敗：${failed} 封`); console.log('     失敗名單：' + fails.join(', ')); }
  if (quota > 0) warn(`因達 --limit 上限，還有 ${quota} 位未寄 → 明天（或額度恢復後）用「同一指令」再跑一次即自動續寄。`);
  ok(`結果已存檔：${RESULT_CSV}（狀態 sent/failed 可核對）`);
  if (sentSet.size < recipients.length) console.log('     尚未全部寄完：重跑同一指令會自動跳過已成功者、只補剩下的，不會重複寄。');
})().catch((e) => { console.error('\n工具執行錯誤：', e); process.exit(1); });
