import Link from 'next/link';
import { Home, Search, Compass } from 'lucide-react';

// 全站 404 找不到頁面：取代 Next.js 預設英文畫面，提供繁中導引與返回入口
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[#21448e]/10 flex items-center justify-center text-[#21448e]">
          <Compass className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <p className="text-5xl font-black text-[#21448e] tracking-tight">404</p>
          <h1 className="text-xl font-bold text-slate-800">找不到這個頁面</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            您要找的內容可能已被移動、刪除，或網址輸入有誤。<br />
            別擔心，讓我們帶您回到正確的地方。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#21448e] hover:opacity-90 text-white px-6 py-3 rounded-xl text-sm font-bold transition active:scale-95"
          >
            <Home className="w-4 h-4" /> 回到首頁
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold transition active:scale-95"
          >
            <Search className="w-4 h-4" /> 瀏覽所有課程
          </Link>
        </div>
      </div>
    </div>
  );
}
