'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as tus from 'tus-js-client';
import { ensureClientImageCompatible } from './image';

/** 上傳大小上限：4.5MB，避免 Netlify gateway 6MB 限制與提升載入效能 */
export const MAX_UPLOAD_SIZE = 4.5 * 1024 * 1024;

/** 大檔（影片/課程檔）直傳大小上限：5GB。此路徑直接 PUT 到 Supabase，不經 Netlify function。 */
export const MAX_LARGE_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024;

/**
 * 瀏覽器端匿名 Supabase client（惰性建立）。
 * 僅用於 uploadToSignedUrl——此操作以伺服器簽發的一次性 token 授權，
 * 不需登入 session，故使用公開的 anon 金鑰即可。
 */
let browserClient: SupabaseClient | null = null;
function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        '缺少 Supabase 前端環境變數（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY），無法進行大檔直傳。'
      );
    }
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return browserClient;
}

/**
 * 大檔直傳（影片、課程檔、大型講義；僅供 client component 使用）：
 * 先向 /api/admin/upload-url 取得一次性上傳 token，再用 supabase-js 直接把檔案
 * PUT 到 Supabase Storage，完全繞過 Netlify/Vercel function 約 6MB 的 body 限制。
 * 成功回傳可存進資料庫的參照字串（protected → protected://；public → 公開網址）。
 *
 * 注意：Supabase 專案本身有「檔案大小上限」設定（免費預設 50MB）。若要上傳數百 MB 的
 * 長片，需先到 Supabase → Storage → Settings 調高該上限，否則會被 Supabase 端擋下。
 */
export async function uploadLargeFile(
  file: File,
  visibility: 'public' | 'protected' = 'protected'
): Promise<string> {
  if (file.size > MAX_LARGE_UPLOAD_SIZE) {
    throw new Error(
      `該檔案大小為 ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB，已超過系統限制 5GB。` +
      `請壓縮或降低解析度（建議 1080p）後再上傳；兩小時以上的長片建議改用 Bunny 串流。`
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. 取得一次性上傳 token
  const res = await fetch('/api/admin/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, ext, visibility }),
  });

  let data: { path?: string; token?: string; bucket?: string; ref?: string; error?: string } = {};
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(text.slice(0, 150) || `伺服器回應錯誤碼: ${res.status}`);
  }

  if (!res.ok || !data.path || !data.token || !data.bucket) {
    throw new Error(data.error || '無法建立上傳連結');
  }

  // 2. 用 token 直接把檔案 PUT 到 Supabase（不經 Netlify）
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage
    .from(data.bucket)
    .uploadToSignedUrl(data.path, data.token, file);

  if (error) {
    // 常見原因：Supabase 專案的「檔案大小上限」預設偏低（免費 50MB），大檔會在此被擋下
    throw new Error(
      '檔案直傳失敗：' + error.message +
      '（若為大影片，請先到 Supabase → Storage → Settings 調高「檔案大小上限」，或改用 Bunny 串流）'
    );
  }

  if (!data.ref) {
    throw new Error('上傳成功但未取得檔案參照，請重試');
  }
  return data.ref;
}

/**
 * 章節影片「直傳 Bunny Stream」（僅供 client component 使用）。
 * 影片屬大檔＋串流內容，應放 Bunny（非 Supabase）：先向 /api/admin/bunny-upload 取得
 * 伺服器建立好的影片物件與 TUS 上傳授權，再用 tus-js-client 直接把檔案傳到 Bunny
 * （金鑰不外洩、可傳大型長片、支援斷點續傳）。成功回傳可存進 video_url 的 Bunny 嵌入網址。
 */
export async function uploadVideoToBunny(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const res = await fetch('/api/admin/bunny-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: file.name }),
  });

  let data: {
    libraryId?: string; videoId?: string; signature?: string; expire?: number; embedUrl?: string; error?: string;
  } = {};
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) data = await res.json();
  else throw new Error((await res.text()).slice(0, 150) || `伺服器回應錯誤碼: ${res.status}`);

  if (!res.ok || !data.videoId || !data.signature || !data.libraryId || !data.expire || !data.embedUrl) {
    throw new Error(data.error || '無法建立 Bunny 上傳授權');
  }

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: 'https://video.bunnycdn.com/tusupload',
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        AuthorizationSignature: data.signature as string,
        AuthorizationExpire: String(data.expire),
        VideoId: data.videoId as string,
        LibraryId: data.libraryId as string,
      },
      metadata: { filetype: file.type || 'video/mp4', title: file.name },
      onError: (err) => reject(err),
      onProgress: (sent, total) => { if (onProgress && total) onProgress(Math.round((sent / total) * 100)); },
      onSuccess: () => resolve(),
    });
    upload.start();
  });

  return data.embedUrl as string;
}

/**
 * 後台檔案上傳（僅供 client component 使用）：
 * 統一處理 HEIC 轉換、4.5MB 大小限制、安全檔名、容錯回應解析與錯誤訊息，
 * 成功回傳檔案公開網址。
 * 先前這段程式碼在 8 個元件/頁面各自複製一份；現在所有上傳一律經過此函式，
 * 修一次等於全部修好。
 */
export async function uploadFile(
  file: File,
  visibility: 'public' | 'protected' = 'public'
): Promise<string> {
  // HEIC/HEIF 先轉為 JPEG 再驗證大小（轉檔後通常更小，非 HEIC 檔案會原樣返回）
  const compatible = await ensureClientImageCompatible(file);

  if (compatible.size > MAX_UPLOAD_SIZE) {
    throw new Error(
      `該檔案大小為 ${(compatible.size / 1024 / 1024).toFixed(1)}MB，已超過系統限制 4.5MB。` +
      `請壓縮後再上傳（這也有助於加快讀者載入網頁的速度）。`
    );
  }

  const formData = new FormData();
  const fileExt = compatible.name.split('.').pop() || 'png';
  formData.append('file', compatible, `upload-${Date.now()}.${fileExt}`);
  // visibility='protected' 代表付費/受保護內容（影片、下載檔、教材），
  // 伺服器會存入 private bucket 並回傳 protected:// 參照，交付時才簽短效網址。
  formData.append('visibility', visibility);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });

  // 容錯解析：伺服器錯誤時可能回傳非 JSON（例如 gateway 的 HTML 錯誤頁），
  // 直接 res.json() 會拋出語法錯誤而掩蓋真正原因
  let data: { url?: string; error?: string } = {};
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(text.slice(0, 150) || `伺服器回應錯誤碼: ${res.status}`);
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error || '上傳失敗');
  }
  return data.url;
}
