import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

/**
 * 請求驗證模組：全站共用的輸入驗證規則。
 * 先前 email 格式、密碼長度、重複信箱檢查與 bcrypt 成本
 * 在 signup 與後台學員管理各自複製一份（且寫法已不一致），統一收攏於此。
 */

// Email 格式（後端驗證，防止前端被繞過）
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/**
 * Email 正規化：去除前後空白並轉小寫。
 * 全站「寫入 users.email」與「以 email 查詢」都必須先經過這裡，
 * 否則 John@Gmail.com 註冊、john@gmail.com 登入會查不到（登不進去），
 * 且同一信箱不同大小寫可重複註冊。
 */
export function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

// 密碼規則：至少 6 位
export const MIN_PASSWORD_LENGTH = 6;
export function isValidPassword(password: unknown): boolean {
  return typeof password === 'string' && password.trim().length >= MIN_PASSWORD_LENGTH;
}

// 密碼雜湊成本（全站唯一定義）
export const BCRYPT_COST = 12;
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** 檢查信箱是否已被使用；excludeUserId 用於「更新成員」時排除自己 */
export async function emailTaken(email: string, excludeUserId?: string): Promise<boolean> {
  let query = supabase.from('users').select('id').eq('email', normalizeEmail(email));
  if (excludeUserId) query = query.neq('id', excludeUserId);
  const { data } = await query.maybeSingle();
  return !!data;
}

/** 金額欄位解析：無法解析一律回 0（統一先前 parseInt 會產生 NaN 與 || 0 兩種行為） */
export function parsePrice(value: unknown): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : 0;
}
