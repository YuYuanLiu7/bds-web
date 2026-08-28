import { supabase } from './supabase';

/**
 * 儲存空間工具：把 Supabase Storage 的「永久公開網址」換成「短效簽章網址」。
 *
 * 付費檔案若以永久公開網址交付，網址一旦被複製即可無限轉發。
 * 這裡在「伺服器端、驗證過權限之後」才簽發短效網址，降低外流風險。
 *
 * ⚠️ 完整防護需將存放付費檔案的 bucket 設為 private（非 public）。
 *    bucket 為 public 時，簽章網址仍可用，但原始永久網址也仍可直接存取，
 *    因此請將付費影片/下載檔改放在 private bucket。
 *
 * 安全設計：任何解析或簽章失敗都「退回原本的網址」，確保不會因此讓既有下載壞掉。
 */

// 解析 Supabase 公開網址：.../storage/v1/object/public/<bucket>/<path...>
const PUBLIC_RE = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;

export async function signStorageUrl(
  fileUrl: string,
  expiresInSeconds = 10 * 60
): Promise<string> {
  try {
    if (!fileUrl) return fileUrl;
    const m = fileUrl.match(PUBLIC_RE);
    if (!m) return fileUrl; // 非 Supabase Storage 公開網址（例如外部連結），原樣返回

    const bucket = m[1];
    // 去掉可能的 query string，再還原路徑中的百分比編碼
    const rawPath = m[2].split('?')[0];
    const objectPath = decodeURIComponent(rawPath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, expiresInSeconds);

    if (error || !data?.signedUrl) return fileUrl; // 簽章失敗：退回原網址，不讓下載壞掉
    return data.signedUrl;
  } catch {
    return fileUrl; // 任何例外：退回原網址
  }
}
