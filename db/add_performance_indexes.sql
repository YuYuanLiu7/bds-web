-- ============================================================
-- BDS 效能索引（針對熱查詢路徑，規模化重要）
-- 於 Supabase SQL Editor 執行；冪等、可重複執行。
-- 在數萬使用者 / 大量訂單時，這些索引能避免全表掃描。
-- ============================================================

-- 訂單：依狀態（儀表板/財務）、使用者、建立時間（營收時序）查詢
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id     ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at);

-- 使用者課程 / 下載擁有權：反向以課程/商品查（主鍵已涵蓋 user_id 前綴查詢）
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id     ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_download_id ON user_downloads(download_id);

-- 章節：依課程查（課程詳情/學習頁）
CREATE INDEX IF NOT EXISTS idx_chapters_course_id ON chapters(course_id);

-- 文章：清單依 status 過濾、付費牆依 visibility 判斷（slug 為 UNIQUE 已自帶索引）
CREATE INDEX IF NOT EXISTS idx_articles_status     ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_visibility ON articles(visibility);

-- 課程 / 下載 / 活動 / 會員方案：清單依 published/status 過濾
CREATE INDEX IF NOT EXISTS idx_courses_is_published   ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_downloads_status       ON downloads(status);
CREATE INDEX IF NOT EXISTS idx_events_status          ON events(status);
CREATE INDEX IF NOT EXISTS idx_membership_plans_status ON membership_plans(status);

-- users.email 已為 UNIQUE（登入查詢自帶索引），無需另建。
