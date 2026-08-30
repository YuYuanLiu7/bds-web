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

  // 折扣碼狀態：輸入值、套用中、以及套用成功後的折後金額（僅供顯示；實際金額仍以伺服器端為準）
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<{ finalAmount: number; discountAmount: number } | null>(null);

  // 套用折扣碼：打公開驗證 API，取得伺服器端計算的折後金額後顯示
  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error('請先輸入折扣碼');
      return;
    }
    setApplying(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'course', id: courseId }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setApplied(null);
        toast.error(data.message || '折扣碼無效');
        return;
      }
      setApplied({ finalAmount: data.finalAmount, discountAmount: data.discountAmount });
      toast.success(`折扣碼套用成功，折後 NT$ ${Number(data.finalAmount).toLocaleString()}`);
    } catch (error) {
      console.error('Coupon validate failed:', error);
      setApplied(null);
      toast.error('折扣碼驗證失敗，請稍後再試');
    } finally {
      setApplying(false);
    }
  };

  const handleBuy = async () => {
    setLoading(true);
    try {
      const code = couponCode.trim();
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 有輸入折扣碼才帶上 couponCode；無輸入則行為與原本完全一致
        body: JSON.stringify({ courseId, courseName, amount, ...(code ? { couponCode: code } : {}) }),
      });

      const params = await response.json();

      // 檢查後端是否回傳錯誤（如未登入/找不到課程/金流未設定/折扣碼無效），避免把錯誤物件當付款參數送出
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
    <div className="mb-4">
      {/* 折扣碼輸入區 */}
      <div className="mb-3">
        <label className="block text-xs font-bold text-gray-500 mb-1.5">折扣碼（選填）</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              // 修改折扣碼後清除舊的套用結果，避免顯示過時金額
              if (applied) setApplied(null);
            }}
            placeholder="輸入折扣碼"
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={applying}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition disabled:opacity-55 whitespace-nowrap"
          >
            {applying ? '驗證中...' : '套用'}
          </button>
        </div>
        {applied && (
          <p className="text-xs text-emerald-600 font-semibold mt-2">
            已折抵 NT$ {applied.discountAmount.toLocaleString()}，折後應付 NT$ {applied.finalAmount.toLocaleString()}
          </p>
        )}
      </div>

      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-blue-200 shadow-lg disabled:bg-gray-400"
      >
        {loading
          ? '處理中...'
          : applied
            ? `立即購買（NT$ ${applied.finalAmount.toLocaleString()}）`
            : '立即購買'}
      </button>
    </div>
  );
}
