-- ============================================================
-- 開啟所有資料表的 Row Level Security（RLS）
-- 於跑完 init.sql / add_performance_indexes.sql / add_rate_limiting.sql 後「最後」執行。
-- 本平台所有資料存取都在伺服器端以 service_role 金鑰進行（會繞過 RLS），
-- 開啟 RLS 後且「不建立任何 policy」即可阻擋任何人用 anon 公開金鑰直接連線存取，
-- 達到「對外鎖死、App 經伺服器存取」的安全狀態。
-- 前提：伺服器端必須已設定 SUPABASE_SERVICE_ROLE_KEY，否則開啟後 App 會讀不到資料。
-- 冪等、可重複執行。
-- ============================================================

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_downloads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits          ENABLE ROW LEVEL SECURITY;
