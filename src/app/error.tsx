'use client';

// 全站錯誤邊界：當頁面渲染丟出例外時顯示繁中友善畫面與「重試」，避免白屏
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 將錯誤記到 console 方便排查（正式環境可改接監控服務）
    console.error('頁面發生錯誤：', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-800">頁面發生了一點問題</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            很抱歉，載入此頁時發生未預期的錯誤。<br />
            您可以重新整理再試一次，或先回到首頁。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-[#21448e] hover:opacity-90 text-white px-6 py-3 rounded-xl text-sm font-bold transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> 重新嘗試
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold transition active:scale-95"
          >
            <Home className="w-4 h-4" /> 回到首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
