'use client';

import { useState } from 'react';
import { Download, Search, Plus, Eye, Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState([
    { id: '1', title: 'BDS 獨家：半導體高階業務求職信與履歷模板', downloads: 125, price: 'NT$ 499', status: 'published', type: 'PDF 文件' },
    { id: '2', title: '硬體產業 ODM 生意開發策略白皮書 (2026 最新版)', downloads: 86, price: 'NT$ 1,200', status: 'published', type: 'PDF/PPT 簡報' },
    { id: '3', title: '外商商務開發面試經典 50 問與模擬解題手冊', downloads: 234, price: 'NT$ 699', status: 'published', type: 'PDF 電子書' }
  ]);

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <span className="material-symbols-outlined mr-2 text-indigo-600" style={{ fontSize: '26px' }}>download</span>
            數位下載
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">管理與上傳可供學員單獨購買或下載的 PDF 手冊、簡報與學習模板。</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98">
          <Plus className="w-4 h-4 mr-1.5" /> 新增數位商品
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold">
            共 <span className="text-slate-700 font-extrabold">{downloads.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{downloads.length}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 h-12">
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">商品名稱</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">定價</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">商品格式 / 下載量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {downloads.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px]">
                          販售中
                        </span>
                      </div>
                      <Link href={`/admin/downloads/${item.id}`} className="block font-bold text-blue-600 hover:text-blue-800 transition text-sm mt-1.5 leading-snug">
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-extrabold text-sm">
                      {item.price}
                    </td>
                    <td className="px-6 py-4 space-y-1 text-slate-400 font-semibold text-xs">
                      <div className="flex items-center text-slate-500">
                        {item.type}
                      </div>
                      <div className="flex items-center">
                        <Download className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        已售出/下載: <span className="text-slate-600 font-bold ml-1">{item.downloads} 次</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1 lg:order-first">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2.5 border-b border-slate-50">商品篩選</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">商品名稱</label>
                <input 
                  type="text" 
                  placeholder="搜尋數位商品名稱"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer">
                <Search className="w-3.5 h-3.5 mr-1" /> 搜尋商品
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
