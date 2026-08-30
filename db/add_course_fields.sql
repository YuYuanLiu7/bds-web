-- 為 courses / chapters 新增課程功能所需欄位（皆為冪等，可重複執行）
-- 不更動任何既有欄位定義，一律使用 ADD COLUMN IF NOT EXISTS

-- courses 表：課程銷售與 SEO 相關欄位
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle TEXT;                       -- 副標題
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug TEXT;                           -- 銷售網址代稱
ALTER TABLE courses ADD COLUMN IF NOT EXISTS points TEXT;                         -- 課程要點
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_hours TEXT;                    -- 總課程時數
ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date DATE;                     -- 開課日期
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'paid';     -- paid / free（免費名單磁鐵）
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;   -- 設為精選 / 暢銷標籤
ALTER TABLE courses ADD COLUMN IF NOT EXISTS show_student_count BOOLEAN DEFAULT FALSE; -- 銷售頁是否顯示學員數
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_title TEXT;                      -- SEO 標題
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_description TEXT;                -- SEO 描述
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_no_index BOOLEAN DEFAULT FALSE;  -- 是否禁止搜尋引擎索引
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;        -- 顯示順序

-- chapters 表：圖文區塊與排序
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS content_html TEXT;                  -- 圖文 / 簡報連結區塊
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS sort_order INTEGER;                 -- 章節排序（供拖曳 / 上下移使用）

-- 若 sort_order 為新加入（尚無值），沿用既有 order_index 作為初始排序
UPDATE chapters SET sort_order = order_index WHERE sort_order IS NULL;
