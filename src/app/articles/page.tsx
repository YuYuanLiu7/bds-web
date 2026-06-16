'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Eye, ArrowLeft, ArrowRight, User, Layers, Clock } from 'lucide-react';

export default function ArticlesPage() {
  const [primaryColor, setPrimaryColor] = useState('#21448e');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch site settings
    fetch('/api/admin/site-settings')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch settings');
      })
      .then(data => {
        setPrimaryColor(data.primaryColor || '#21448e');
      })
      .catch(err => console.warn("Using default settings in Articles page:", err));

    // 2. Fetch dynamic articles
    fetch('/api/articles')
      .then(async res => {
        if (!res.ok) throw new Error('API response not ok');
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((e: any) => ({
            id: e.id,
            title: e.title,
            author: e.author || 'BDS 編輯部',
            date: e.date ? e.date.split('T')[0] : '',
            views: e.views || 0,
            category: e.category || '',
            summary: e.summary || '',
            imageUrl: e.image_url || e.imageUrl || 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=800'
          }));
          setArticles(mapped);
        } else {
          throw new Error('Data is not an array');
        }
      })
      .catch(err => {
        console.warn("文章載入失敗，將顯示空狀態：", err);
        setArticles([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-16 font-sans relative overflow-hidden">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[320px] left-[5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[580px] right-[5%] w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      
      {/* Header */}
      <div 
        style={{ backgroundColor: primaryColor }}
        className="w-full text-white py-16 px-6 relative overflow-hidden select-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto space-y-4 relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 回首頁
          </Link>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">產業洞察與實戰專欄</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">專欄文章</h1>
            <p className="text-white/70 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
              匯聚半導體、硬體與醫療器材產業的第一手商業觀察，提供商務開發、談判銷售與職涯成長策略。
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4 select-none">
          <h2 className="text-lg font-black text-slate-800 flex items-center">
            <span className="w-1.5 h-5 bg-[#21448e] rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
            最新文章 ({articles.length})
          </h2>
          <span className="text-xs text-slate-400 font-bold">每週固定更新</span>
        </div>

        {/* Card Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 font-semibold text-xs select-none">
            專欄文章載入中...
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article 
                key={article.id}
                className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col group hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-300 transition-all duration-300"
              >
                {/* Image Preview */}
                <Link href={`/articles/${article.id}`} className="aspect-[16/10] w-full overflow-hidden bg-slate-50 relative select-none block">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  <span 
                    style={{ backgroundColor: primaryColor }}
                    className="absolute top-4 left-4 text-white text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg"
                  >
                    {article.category}
                  </span>
                </Link>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between text-left space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-800 leading-snug group-hover:text-[#21448e] transition duration-200 line-clamp-2">
                      <Link href={`/articles/${article.id}`} className="hover:underline">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  {/* Footer Info */}
                  <div className="space-y-4 border-t border-slate-50 pt-4">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold select-none">
                      <div className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        <span>由 {article.author} 發布</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-300" />
                          {article.date}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-300" />
                          瀏覽 {article.views} 次
                        </span>
                      </div>
                    </div>

                    {/* Read More */}
                    <Link 
                      href={`/articles/${article.id}`}
                      className="text-xs font-black text-[#21448e] flex items-center justify-end select-none group-hover:underline cursor-pointer" 
                      style={{ color: primaryColor }}
                    >
                      閱讀全文 <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>

              </article>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white/90 backdrop-blur-md border border-slate-200/70 rounded-3xl p-16 select-none shadow-sm space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">目前尚無專欄文章</h3>
              <p className="text-slate-400 text-xs font-semibold">我們正在準備精彩的產業分析與專欄報導，敬請期待！</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
