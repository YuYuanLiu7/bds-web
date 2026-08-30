-- ========================================================
-- BDS 折扣碼 (coupons) 資料表遷移
-- 請在 Supabase SQL Editor 執行本腳本
-- 本腳本為純新增（additive），不修改任何既有欄位。
-- 折抵金額一律以「伺服器端」為準重新計算，不信任前端傳入金額。
-- 冪等、可重複執行。
-- ========================================================

-- 建立折扣碼資料表
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,                          -- 折扣碼（唯一）
  discount_type TEXT NOT NULL DEFAULT 'percent',      -- 折抵類型：'percent'（百分比）| 'fixed'（固定金額）
  discount_value INTEGER NOT NULL DEFAULT 0,          -- percent：0-100；fixed：折抵金額（元）
  active BOOLEAN DEFAULT TRUE,                         -- 是否啟用
  expires_at TIMESTAMP WITH TIME ZONE,                -- 到期時間（NULL 表示不限期）
  usage_limit INTEGER,                                 -- 總使用次數上限（NULL 表示不限）
  used_count INTEGER DEFAULT 0,                        -- 已使用次數
  min_amount INTEGER DEFAULT 0,                        -- 最低訂單金額門檻（元）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()    -- 建立時間
);
