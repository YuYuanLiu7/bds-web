'use client';

import { Megaphone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminNewsPage() {
  const updates = [
    { tag: '新功能', date: '2026-05-24', title: '新增 PayUni 金流串接與完整的訂單支付與狀態回傳機制', desc: '我們現在全面支援 PayUni 支付，並能自動偵測回傳狀態，在後台更新訂單的同時，為購買成功的學員立即開通課程學習權限。' },
    { tag: '介面優化', date: '2026-05-18', title: '重構管理後台 layout 佈局，使操作更流暢、載入更快速', desc: '更新了整體管理側邊欄、整合網站前台連結，並針對課程管理、成員管理、財務報表等功能頁面進行了極簡且符合使用者體驗的現代化設計。' },
    { tag: '安全性提升', date: '2026-05-02', title: '更新 Next-Auth 認證安全規範與 Supabase 行層級安全 (RLS)', desc: '實施了更為嚴密的後台權限管制。只有資料庫 role 被標註為 "admin" 的帳號才可獲授權進入 /admin 後台及調用管理 API。' }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none font-sans text-slate-700 pt-6">
      <div className="flex items-center space-x-2">
        <Link href="/admin" className="text-slate-400 hover:text-slate-600 transition flex items-center text-xs font-bold">
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回儀表板
        </Link>
      </div>

      <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
        <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
          <Megaphone className="w-5 h-5 text-indigo-600 mr-2" /> 產品新訊與系統更新公告
        </h1>
      </div>

      <div className="space-y-6">
        {updates.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs">
              <span className={`inline-flex px-2 py-0.5 rounded-full font-bold ${
                item.tag === '新功能' ? 'bg-green-50 text-green-600' :
                item.tag === '介面優化' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {item.tag}
              </span>
              <span className="text-slate-400 font-semibold">{item.date}</span>
            </div>
            <h2 className="text-sm font-extrabold text-slate-800">{item.title}</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
