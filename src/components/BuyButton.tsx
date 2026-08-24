'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { submitPayuniForm } from '@/lib/payuni-client';

interface BuyButtonProps {
  courseId: string;
  courseName: string;
  amount: number;
}

export default function BuyButton({ courseId, courseName, amount }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

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
        toast.error(params.error || '結帳失敗，請稍後再試。');
        setLoading(false);
        return;
      }

      // 建立隱藏表單並送出至 PayUni（UPP）
      submitPayuniForm(params);
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('結帳失敗，請稍後再試。');
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
