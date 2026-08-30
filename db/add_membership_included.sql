-- ============================================================
-- courses 新增 membership_included（是否開放給「訂閱會員」觀看）
-- 會員模型：
--   一般帳號 → 課程需個別購買才可看；
--   訂閱會員 → 可看「文章」＋此欄為 true 的課程（管理員開放的課），其餘課程仍需個別購買。
-- 預設 false（不開放，維持需購買）。冪等、可重複執行。
-- ============================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS membership_included boolean DEFAULT false;
