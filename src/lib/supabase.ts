import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 本專案的 supabase client 僅在「伺服器端」使用（API routes 與 server component），
// 身分驗證交由 NextAuth + 各 API 的權限檢查處理。
// 啟用 RLS 後，前端 anon 金鑰會被擋下，故伺服器端優先使用 service_role 金鑰繞過 RLS；
// 若未設定 service_role 則退回 anon（向後相容，但啟用 RLS 後 anon 會讀到空資料）。
// ⚠️ SUPABASE_SERVICE_ROLE_KEY 不可加 NEXT_PUBLIC_ 前綴，必須僅存在於伺服器環境，絕不可外洩到瀏覽器。

let client: SupabaseClient | null = null;

/**
 * 惰性建立：第一次使用時才讀取環境變數並建立 client（測試可先設定環境變數或替換實作）。
 * 為了在沒有設定環境變數的情況下（例如本地 npm run build 或 CI/CD 環境中）也能編譯成功，
 * 環境變數為空時使用佔位網址與金鑰，避免 Supabase SDK 拋出 initialization 錯誤。
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';

    // 安全防呆：啟用 RLS 後，伺服器端必須使用 service_role 金鑰才能正常讀寫；
    // 若正式環境只設了 anon 金鑰，所有查詢會讀到空資料（看似壞掉），
    // 且代表整套安全模型的假設被破壞。這裡大聲告警協助及早發現設定漏填。
    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error(
        '[supabase] ⚠️ 正式環境未設定 SUPABASE_SERVICE_ROLE_KEY，退回使用公開 anon 金鑰。' +
          '啟用 RLS 後伺服器端將讀到空資料，請至部署平台補上 SUPABASE_SERVICE_ROLE_KEY 後重新部署。'
      );
    }

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'placeholder-key-for-build-stage';
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}

// 向後相容：既有 `import { supabase }` 的 40 個檔案不必改動，
// 透過 Proxy 讓連線延遲到第一次實際使用時才建立
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getSupabase();
    const value = (c as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(c)
      : value;
  },
});
