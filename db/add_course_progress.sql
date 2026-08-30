-- ========================================================
-- BDS 學員課程進度 (course_progress) 資料表遷移
-- 請在 Supabase SQL Editor 執行本腳本
-- 本腳本為純新增（additive），不修改任何既有欄位，
-- 亦不影響金流結帳與課程開通邏輯。
-- 冪等、可重複執行。
-- ========================================================

-- 建立學員課程進度資料表（記錄每位學員完成的章節）
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,                          -- 學員 ID
  course_id UUID NOT NULL,                        -- 課程 ID
  chapter_id UUID NOT NULL,                       -- 章節 ID
  completed BOOLEAN DEFAULT TRUE,                 -- 是否已完成該章節
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 最後更新時間
  UNIQUE (user_id, chapter_id)                    -- 同一學員同一章節僅一筆進度
);

-- 依學員與課程查詢進度的索引
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course
  ON course_progress(user_id, course_id);
