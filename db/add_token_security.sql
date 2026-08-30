-- ============================================================
-- users 新增 password_changed_at（密碼最後變更時間）
-- 用途：讓「重設密碼」能使先前簽發、仍在效期內的登入 token 失效。
--   登入時把此值寫進 JWT；之後每隔數分鐘於伺服器端比對，
--   若 DB 的值已變更（代表密碼被重設），即撤銷該 token 的授權（清掉 id/role）。
-- 冪等、可重複執行。
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;
