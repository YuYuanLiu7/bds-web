-- ========================================================
-- BDS 行銷促銷方案 (promotions) 資料表遷移
-- 請在 Supabase SQL Editor 執行本腳本
-- 本腳本為純新增（additive），不修改任何既有欄位，
-- 亦不影響金流結帳與 membership_plans。
-- ========================================================

-- 建立行銷促銷方案資料表
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,                 -- 方案名稱
  price INTEGER NOT NULL DEFAULT 0,    -- 方案價格（NT$）
  period TEXT NOT NULL DEFAULT '限時', -- 期間，例如：限時、月、季、年、一次性
  description TEXT,                     -- 方案說明
  status TEXT NOT NULL DEFAULT 'active', -- 上/下架：'active'（上架）或 'draft'（下架）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 依上/下架狀態查詢的索引
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
