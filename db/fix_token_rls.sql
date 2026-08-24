-- ============================================================
-- 一次性資安修正：重新開啟 token 表的 RLS
-- ============================================================
-- 背景：add_auth_flows.sql 先前把 verification_tokens 與 password_reset_tokens
-- 的 RLS 關閉，導致持有公開 anon 金鑰者可直接讀取密碼重設 token 進而接管帳號。
-- 請在 Supabase 主控台的 SQL Editor 貼上並執行此檔一次即可（安全、不會刪除任何資料）。
-- 開啟 RLS 且不建立任何 policy：僅伺服器端的 service_role 金鑰可存取這兩張表。
-- ============================================================

ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
