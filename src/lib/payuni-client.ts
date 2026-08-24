'use client';

/**
 * 前端 PayUni 轉跳工具（僅供 client component 使用）。
 * 先前三個購買按鈕（課程 / 下載 / 會員）各自複製一份「建立隱藏表單並送出」的程式碼，
 * 現在統一由此模組處理；UPP 端點由環境變數決定，正式上線設定
 * NEXT_PUBLIC_PAYUNI_UPP_URL 即可，無需改程式碼。
 */
export function submitPayuniForm(params: Record<string, string>): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action =
    process.env.NEXT_PUBLIC_PAYUNI_UPP_URL || 'https://sandbox-api.payuni.com.tw/api/upp';

  Object.keys(params).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
