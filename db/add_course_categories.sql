-- 課程分類資料表（冪等，可重複執行）
-- 註：courses.category 文字欄位保留相容，不刪除；本表供未來分類管理使用

CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                             -- 分類名稱
  slug TEXT,                                      -- 分類網址代稱
  sort_order INTEGER DEFAULT 0,                   -- 顯示順序
  created_at TIMESTAMPTZ DEFAULT NOW()
);
