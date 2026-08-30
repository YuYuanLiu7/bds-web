import { supabase } from './supabase';

/**
 * 折扣碼（Coupons）模組：折抵驗證與金額計算的唯一所在地。
 *
 * 🔒 安全原則：折抵金額與最終金額「一律以伺服器端」重新計算，
 *    絕不信任前端傳入的任何金額。公開驗證 API 與結帳 API 共用同一套規則，
 *    確保「顯示的折後價」與「實際送 PayUni 的金額」必然一致。
 */

// 折扣類型：百分比折扣 / 固定金額折抵
export type CouponDiscountType = 'percent' | 'fixed';

// 折扣碼資料列（對應 coupons 資料表）
export interface CouponRow {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  min_amount: number;
  created_at?: string;
}

// 折抵計算/驗證結果
export interface CouponResult {
  valid: boolean;
  /** 折抵金額（元），已 = 原價 - 最終金額 */
  discountAmount: number;
  /** 折後應付金額（元），至少為 1（不送 0 元給金流） */
  finalAmount: number;
  /** 使用者可讀訊息（成功或失敗原因） */
  message: string;
  /** 驗證通過時帶回折扣碼資料，供結帳寫入訂單 */
  coupon?: CouponRow;
}

/** 折扣碼正規化：去除前後空白並轉為大寫（與資料庫存放格式一致） */
export function normalizeCouponCode(code: string): string {
  return (code || '').trim().toUpperCase();
}

/**
 * 依折扣類型計算「折後應付金額」（伺服器端唯一計算入口）。
 * - percent：round(price * (100 - value) / 100)
 * - fixed：max(0, price - value)
 * 最後一律夾到最低 1 元，避免送 0 元（或負數）給 PayUni。
 */
export function computeFinalAmount(
  price: number,
  discountType: CouponDiscountType,
  discountValue: number
): number {
  let final: number;
  if (discountType === 'percent') {
    final = Math.round((price * (100 - discountValue)) / 100);
  } else {
    final = Math.max(0, price - discountValue);
  }
  // 夾到最低 1 元：折後為 0 或負數時不送 0 元給金流
  return Math.max(1, final);
}

/**
 * 以原價驗證折扣碼並計算折後金額。
 * 檢查項目：存在、active、未過期、used_count < usage_limit（limit 為空視為無限）、原價 >= min_amount。
 * 任一不符即回 { valid:false, ... } 並附使用者可讀訊息；
 * 通過則回折抵金額、折後金額與折扣碼資料。
 *
 * @param code  使用者輸入的折扣碼（此函式內部會正規化）
 * @param price 品項原價（由 resolvePurchasable 於伺服器端取得，非前端傳入）
 */
export async function validateCoupon(code: string, price: number): Promise<CouponResult> {
  const normalized = normalizeCouponCode(code);
  const fail = (message: string): CouponResult => ({
    valid: false,
    discountAmount: 0,
    finalAmount: price,
    message,
  });

  if (!normalized) return fail('請輸入折扣碼');

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .single();

  if (error || !data) return fail('折扣碼不存在');

  const coupon = data as CouponRow;

  if (!coupon.active) return fail('此折扣碼已停用');

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return fail('此折扣碼已過期');
  }

  // usage_limit 為 null/undefined 視為無限；否則已使用次數需小於上限
  if (
    coupon.usage_limit !== null &&
    coupon.usage_limit !== undefined &&
    (coupon.used_count ?? 0) >= coupon.usage_limit
  ) {
    return fail('此折扣碼已達使用次數上限');
  }

  const minAmount = coupon.min_amount ?? 0;
  if (price < minAmount) {
    return fail(`此折扣碼須消費滿 NT$ ${minAmount.toLocaleString()} 才能使用`);
  }

  const finalAmount = computeFinalAmount(price, coupon.discount_type, coupon.discount_value);
  const discountAmount = Math.max(0, price - finalAmount);

  return {
    valid: true,
    discountAmount,
    finalAmount,
    message: '折扣碼套用成功',
    coupon,
  };
}

/**
 * 折扣碼使用次數 +1（盡力而為）。
 * 用於付款成功且完成履約後；採「讀取後寫入」，並發下可能少計，
 * 但這是可接受的統計性欄位，且呼叫端會吞掉錯誤、不影響開通與回應。
 */
export async function incrementCouponUsage(code: string): Promise<void> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return;

  const { data, error } = await supabase
    .from('coupons')
    .select('id, used_count')
    .eq('code', normalized)
    .single();

  if (error || !data) return;

  await supabase
    .from('coupons')
    .update({ used_count: (data.used_count ?? 0) + 1 })
    .eq('id', data.id);
}
