'use client';

import { useState } from 'react';
import { FileCode, Search, Plus, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminPagesPage() {
  const [pages, setPages] = useState([
    { id: '1', name: '首頁 (首頁核心展示)', path: '/', type: 'system', status: 'published', lastUpdated: '2026-05-20 18:30' },
    { id: '2', name: '所有課程列表', path: '/courses', type: 'system', status: 'published', lastUpdated: '2026-05-18 12:45' },
    { id: '3', name: '關於我們 / BDS 理念介紹', path: '/about', type: 'custom', status: 'published', lastUpdated: '2026-05-12 14:00' },
    { id: '4', name: '隱私權與服務條款條約', path: '/privacy', type: 'custom', status: 'published', lastUpdated: '2026-04-30 09:15' },
    { id: '5', name: '聯絡我們 / 商務諮詢', path: '/contact', type: 'custom', status: 'draft', lastUpdated: '2026-03-22 17:00' }
  ]);

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <FileCode className="w-6.5 h-6.5 mr-2 text-indigo-600" />
            頁面管理
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">自訂與配置您的官網首頁、課程總覽頁與其他靜態說明頁面。</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98">
          <Plus className="w-4 h-4 mr-1.5" /> 建立自訂頁面
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold">
            共 <span className="text-slate-700 font-extrabold">{pages.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{pages.length}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 h-12">
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-5/12">頁面名稱</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-3/12">路徑</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-2/12">類型 / 狀態</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-2/12">最後更新</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileCode className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="font-bold text-slate-800 text-sm truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-slate-500 text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-100 max-w-full truncate">
                          {p.path}
                        </span>
                        <Link href={p.path} target="_blank" className="text-slate-400 hover:text-slate-600 transition flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center space-x-2">
                        {p.type === 'system' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[9px]">
                            系統內建
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[9px]">
                            自訂頁面
                          </span>
                        )}

                        {p.status === 'published' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-100 font-bold text-[9px]">
                            已發佈
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold text-[9px]">
                            草稿
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium text-xs">
                      {p.lastUpdated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2.5 border-b border-slate-50">頁面搜尋</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">頁面名稱或路徑</label>
                <input 
                  type="text" 
                  placeholder="搜尋頁面名稱/路徑"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer">
                <Search className="w-3.5 h-3.5 mr-1" /> 搜尋頁面
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
