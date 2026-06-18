'use client';

import { useState } from 'react';

interface BuyButtonProps {
  courseId: string;
  courseName: string;
  amount: number;
}

export default function BuyButton({ courseId, courseName, amount }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, courseName, amount }),
      });

      const params = await response.json();

      // 檢查後端是否回傳錯誤（如未登入/找不到課程/金流未設定），避免把錯誤物件當付款參數送出
      if (!response.ok) {
        alert(params.error || '結帳失敗，請稍後再試。');
        setLoading(false);
        return;
      }

      // Create a hidden form and submit it to PayUni (UPP)
      const form = document.createElement('form');
      form.method = 'POST';
      // UPP 端點由環境變數決定，正式上線設定 NEXT_PUBLIC_PAYUNI_UPP_URL 即可，無需改程式碼
      form.action = process.env.NEXT_PUBLIC_PAYUNI_UPP_URL || 'https://sandbox-api.payuni.com.tw/api/upp';

      Object.keys(params).forEach((key) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('結帳失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition mb-4 shadow-blue-200 shadow-lg disabled:bg-gray-400"
    >
      {loading ? '處理中...' : '立即購買'}
    </button>
  );
}
