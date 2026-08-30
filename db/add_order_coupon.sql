-- ========================================================
-- BDS 訂單折扣碼欄位 (orders.coupon_code / discount_amount) 遷移
-- 請在 Supabase SQL Editor 執行本腳本
-- 本腳本為純新增欄位（additive），不修改既有欄位、
-- 亦不影響金流結帳與 callback 的金額驗證與防重複開通邏輯。
-- 折抵金額一律以「伺服器端」為準，不信任前端傳入金額。
-- 冪等、可重複執行。
-- ========================================================

-- 訂單使用的折扣碼
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- 折抵金額（元），伺服器端計算後寫入
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
