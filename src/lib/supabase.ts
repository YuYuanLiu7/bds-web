import { createClient } from '@supabase/supabase-js';

// 為了在沒有設定環境變數的情況下（例如本地 npm run build 或 CI/CD 環境中）也能編譯成功，
// 如果環境變數為空，我們會使用佔位網址與金鑰，避免 Supabase SDK 拋出 initialization 錯誤。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';

// 本專案的 supabase client 僅在「伺服器端」使用（API routes 與 server component），
// 身分驗證交由 NextAuth + 各 API 的權限檢查處理。
// 啟用 RLS 後，前端 anon 金鑰會被擋下，故伺服器端優先使用 service_role 金鑰繞過 RLS；
// 若未設定 service_role 則退回 anon（向後相容，但啟用 RLS 後 anon 會讀到空資料）。
// ⚠️ SUPABASE_SERVICE_ROLE_KEY 不可加 NEXT_PUBLIC_ 前綴，必須僅存在於伺服器環境，絕不可外洩到瀏覽器。
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-key-for-build-stage';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
