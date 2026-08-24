-- ============================================================
-- BDS Auth Flow Additions (Email Verification & Password Reset)
-- ============================================================

-- 1. Add is_verified column to users table (default to false for new users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Set all existing users to true so they don't get locked out
UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL;

-- 2. Create verification_tokens table for email activation
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create password_reset_tokens table for forgot password flow
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 開啟 RLS 且「不建立任何 policy」：這兩張表存放密碼重設與 Email 驗證的明文 token，
-- 屬於最敏感的資料。所有存取都在伺服器端以 service_role 金鑰進行（會繞過 RLS），
-- 開啟 RLS 可阻擋任何人用公開 anon 金鑰直接連線讀取 token 進而接管帳號。
-- ⚠️ 與 enable_rls.sql 的做法一致，切勿改回 DISABLE。
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
