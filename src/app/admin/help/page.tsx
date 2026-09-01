'use client';

import { HelpCircle, Search, FileText, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminHelpPage() {
  const faqs = [
    { q: '如何設定 PayUni 金流？', a: '請至「設定」->「金流設定」填入您的 PayUni 商店代號、Hash Key 及 Hash IV。詳細金流串接規範可參閱 PayUni 官方開發者手冊。' },
    { q: '如何新增課程章節與單元影片？', a: '進入「課程」管理頁面，點選指定課程的「編輯」按鈕，即可使用章節編輯器新增章節與上傳影片。' },
    { q: '如何設定自訂網域 (CNAME)？', a: '在「設定」->「網域設定」填入您的自訂網域，並將您的 DNS CNAME 紀錄指向 BDS 平台所提供的伺服器網址。' }
  ];

  // 搜尋字串；即時過濾常見問題（同時比對問題與答案文字）
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLowerCase();
  const filteredFaqs = keyword
    ? faqs.filter(faq => faq.q.toLowerCase().includes(keyword) || faq.a.toLowerCase().includes(keyword))
    : faqs;

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none font-sans text-slate-700 pt-6">
      <div className="flex items-center space-x-2">
        <Link href="/admin" className="text-slate-400 hover:text-slate-600 transition flex items-center text-xs font-bold">
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回儀表板
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white text-center space-y-4 shadow-md">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold">您好，需要什麼協助？</h1>
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋教學文章、設定疑難排解..."
            className="w-full bg-white text-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-300 transition placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* FAQ Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Support channels */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 text-sm flex items-center">
            <MessageSquare className="w-4 h-4 text-indigo-500 mr-2" /> 線上客戶支援
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            遇到問題時，先查看右側的「常見問題」。與帳務、寄件網域、客服信箱等相關的設定，可到
            <Link href="/admin/settings" className="text-indigo-600 hover:underline font-bold">設定</Link>
            與
            <Link href="/admin/global-settings" className="text-indigo-600 hover:underline font-bold">全站設定</Link>
            頁面調整。
          </p>
        </div>

        {/* FAQs list */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 text-sm flex items-center">
            <FileText className="w-4 h-4 text-indigo-500 mr-2" /> 常見問題
          </h2>
          <div className="divide-y divide-slate-50">
            {filteredFaqs.map((faq, i) => (
              <div key={i} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                <h3 className="font-bold text-slate-800 text-xs">{faq.q}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <p className="py-3.5 text-slate-400 text-xs font-medium">
                找不到符合「{query}」的常見問題，請試試其他關鍵字。
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
