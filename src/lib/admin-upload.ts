'use client';

import { ensureClientImageCompatible } from './image';

/**
 * 後台檔案上傳（僅供 client component 使用）：
 * 統一處理 HEIC 轉換、安全檔名與錯誤訊息，成功回傳檔案公開網址。
 * 先前這段程式碼在 8 個元件/頁面各自複製一份，且只有其中一份支援 HEIC；
 * 現在所有上傳一律經過此函式，修一次等於全部修好。
 */
export async function uploadFile(file: File): Promise<string> {
  // HEIC/HEIF 自動轉為 JPEG（非 HEIC 檔案會原樣返回）
  const compatible = await ensureClientImageCompatible(file);

  const formData = new FormData();
  const fileExt = compatible.name.split('.').pop() || 'png';
  formData.append('file', compatible, `upload-${Date.now()}.${fileExt}`);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.error || '上傳失敗');
  }
  return data.url as string;
}
