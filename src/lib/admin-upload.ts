'use client';

import { ensureClientImageCompatible } from './image';

/** 上傳大小上限：4.5MB，避免 Netlify gateway 6MB 限制與提升載入效能 */
export const MAX_UPLOAD_SIZE = 4.5 * 1024 * 1024;

/**
 * 後台檔案上傳（僅供 client component 使用）：
 * 統一處理 HEIC 轉換、4.5MB 大小限制、安全檔名、容錯回應解析與錯誤訊息，
 * 成功回傳檔案公開網址。
 * 先前這段程式碼在 8 個元件/頁面各自複製一份；現在所有上傳一律經過此函式，
 * 修一次等於全部修好。
 */
export async function uploadFile(file: File): Promise<string> {
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
