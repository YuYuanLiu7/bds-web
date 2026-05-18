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

      // Create a hidden form and submit it to PayUni (UPP)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox-api.payuni.com.tw/api/upp'; // Sandbox URL

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
