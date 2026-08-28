import { supabase } from "@/lib/supabase";

/**
 * 以 Supabase RPC 實作的輕量速率限制（免外部服務）。
 * 回傳 true=允許、false=已超過上限（或 failClosed 時的機制失效）。
 *
 * 預設 fail-open（機制失效時放行），避免限流本身造成服務中斷；
 * 但對「登入、重設密碼」等安全關鍵端點請傳 { failClosed: true }：
 * 機制失效時改為「拒絕」，避免限流靜默失效時任人暴力破解。
 * 正常部署（已執行 db/add_rate_limiting.sql 建立 check_rate_limit RPC）不會走到失效分支。
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  opts?: { failClosed?: boolean }
): Promise<boolean> {
  const onFailure = opts?.failClosed ? false : true; // failClosed=拒絕、預設=放行
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      // 若持續出現代表 check_rate_limit RPC 未建立，限流實際上並未生效，需儘速處理。
      console.error(
        `[rateLimit] RPC 錯誤（限流未生效，${opts?.failClosed ? '已拒絕' : '暫時放行'}）：`,
        error.message
      );
      return onFailure;
    }
    return data !== false;
  } catch (err) {
    console.error(
      `[rateLimit] 例外（限流未生效，${opts?.failClosed ? '已拒絕' : '暫時放行'}）：`,
      err
    );
    return onFailure;
  }
}

/** 從請求標頭取得用戶端 IP（Vercel/反向代理會帶 x-forwarded-for） */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
