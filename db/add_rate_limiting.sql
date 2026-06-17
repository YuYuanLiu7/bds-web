-- ============================================================
-- 輕量速率限制（免外部服務，僅用 Supabase）
-- 於 Supabase SQL Editor 執行；冪等。
-- 由伺服器端以 service_role 透過 RPC 呼叫，對登入/註冊/聯絡表單等敏感端點限流，
-- 防止密碼暴力破解、洗註冊、灌爆寄信。
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;

-- 原子地檢查並累加某個 key 在時間窗內的次數；未超過上限回 true、超過回 false。
CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_limit INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rec rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM rate_limits WHERE key = p_key FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO rate_limits(key, count, window_start) VALUES (p_key, 1, NOW());
    RETURN TRUE;
  END IF;

  -- 視窗已過 → 重置
  IF NOW() - rec.window_start > make_interval(secs => p_window_seconds) THEN
    UPDATE rate_limits SET count = 1, window_start = NOW() WHERE key = p_key;
    RETURN TRUE;
  END IF;

  -- 視窗內已達上限 → 拒絕
  IF rec.count >= p_limit THEN
    RETURN FALSE;
  END IF;

  UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN TRUE;
END;
$$;
