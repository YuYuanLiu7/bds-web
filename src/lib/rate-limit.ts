import { supabase } from "@/lib/supabase";

/**
 * 以 Supabase RPC 實作的輕量速率限制（免外部服務）。
 * 回傳 true=允許、false=已超過上限。
 * 失敗時 fail-open（允許）：例如尚未執行 db/add_rate_limiting.sql 建立 RPC，
 * 不讓限流機制本身造成服務中斷。
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return true; // fail-open
    return data !== false;
  } catch {
    return true; // fail-open
  }
}

/** 從請求標頭取得用戶端 IP（Vercel/反向代理會帶 x-forwarded-for） */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
