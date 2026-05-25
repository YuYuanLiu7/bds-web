'use client';

import { useState } from 'react';
import { FileText, Search, Plus, Eye, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState([
    { id: '1', title: '如何切入高階硬體銷售？商務開發的四大核心能力指標', author: 'BDS 編輯部', date: '2026-05-20', views: 342, status: 'published', category: '商務開發' },
    { id: '2', title: '半導體供應鏈重構：業務經理必須掌握的轉型思維與契機', author: 'Phyllis', date: '2026-05-15', views: 512, status: 'published', category: '半導體產業' },
    { id: '3', title: '從新手到 ODM 求職王：外商業務的面試技巧與履歷優化指南', author: 'Angela', date: '2026-04-28', views: 820, status: 'published', category: '職涯成長' }
  ]);

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <span className="material-symbols-outlined mr-2 text-indigo-600" style={{ fontSize: '26px' }}>description</span>
            文章
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">撰寫與管理您的部落格專欄、產業洞察報告與活動公告。</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98">
          <Plus className="w-4 h-4 mr-1.5" /> 發表文章
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold">
            共 <span className="text-slate-700 font-extrabold">{articles.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{articles.length}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 h-12">
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">文章標題</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">分類 / 作者</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">發布時間 / 觀看數</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                          已發布
                        </span>
                      </div>
                      <Link href={`/admin/articles/${article.id}`} className="block font-bold text-blue-600 hover:text-blue-800 transition text-sm mt-1.5 leading-snug">
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 space-y-1 text-slate-500 font-semibold text-xs">
                      <div>{article.category}</div>
                      <div className="text-slate-400 font-medium">由 {article.author} 撰寫</div>
                    </td>
                    <td className="px-6 py-4 space-y-1 text-slate-400 font-semibold text-xs">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        {article.date}
                      </div>
                      <div className="flex items-center text-slate-400 font-medium">
                        <Eye className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        瀏覽量: <span className="text-slate-600 font-bold ml-1">{article.views}次</span>
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
            <h3 className="font-bold text-slate-800 text-sm pb-2.5 border-b border-slate-50">文章篩選</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">文章名稱</label>
                <input 
                  type="text" 
                  placeholder="搜尋文章關鍵字"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer">
                <Search className="w-3.5 h-3.5 mr-1" /> 搜尋文章
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
