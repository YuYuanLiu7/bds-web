'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  Calendar, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Filter,
  AlertCircle,
  User
} from 'lucide-react';
import ArticleModal from '@/components/admin/ArticleModal';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'published', 'draft'
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/articles');
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setArticles(data);
      } else {
        setError(data.error || '無法取得文章資料');
        setArticles([]);
      }
    } catch (err) {
      console.error(err);
      setError('連線至資料庫發生錯誤，請確認 articles 資料表是否已建立。');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleAdd = () => {
    setEditingArticle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`確定要刪除文章「${title}」嗎？此動作無法復原。`)) return;

    try {
      const res = await fetch(`/api/admin/articles?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '刪除失敗');
      }

      fetchArticles();
    } catch (err: any) {
      alert('刪除失敗：' + err.message);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => alert('複製失敗，請手動複製'));
  };

  const formatTaiwanDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const hr = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yr}/${mo}/${dy} ${hr}:${min}`;
    } catch {
      return dateStr;
    }
  };

  // Get distinct categories dynamically
  const uniqueCategories = Array.from(new Set(articles.map(e => e.category).filter(Boolean)));

  // Filter logic
  const filteredArticles = articles.filter(e => {
    const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.summary && e.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (e.author || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <FileText className="w-6.5 h-6.5 mr-2 text-indigo-600" />
            文章管理
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">撰寫與管理您的部落格專欄、產業洞察報告與活動公告。</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition flex items-center cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 發表文章
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl font-bold text-xs flex items-start space-x-3 leading-relaxed animate-in fade-in duration-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-extrabold mb-1">提示：系統無法載入文章資料表</p>
            <p className="font-medium text-rose-500 mb-3">若這是您首次啟用此功能，請先在您的 Supabase SQL 編輯器中執行我們為您準備的 `db/add_articles_table.sql` 腳本建立對應資料表。</p>
            <button 
              onClick={fetchArticles}
              className="bg-white border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-rose-100/30 transition cursor-pointer"
            >
              重新載入
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold select-none">
            <span>
              篩選出 <span className="text-slate-700 font-extrabold">{filteredArticles.length}</span> 篇文章
            </span>
            {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button 
                onClick={handleResetFilters}
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
              >
                重設篩選條件
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="py-24 text-center text-slate-400 font-semibold text-xs select-none">
                文章資料載入中...
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 h-12 text-slate-500 font-bold select-none">
                      <th className="px-6 text-xs uppercase tracking-wider w-[42%]">文章標題</th>
                      <th className="px-6 text-xs uppercase tracking-wider w-[23%]">分類 / 作者</th>
                      <th className="px-6 text-xs uppercase tracking-wider w-[20%]">發佈時間 / 觀看數</th>
                      <th className="px-6 text-xs uppercase tracking-wider w-[15%] text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-slate-50/40 transition">
                        
                        {/* Article Title */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1 select-none">
                            {article.status === 'published' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-[9px] uppercase tracking-wider">
                                已發布
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 font-bold text-[9px] uppercase tracking-wider">
                                草稿
                              </span>
                            )}
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-400 font-bold text-[9px] select-none">
                              {article.category}
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => handleEdit(article)}
                            className="block font-black text-slate-800 hover:text-indigo-600 transition text-sm mt-2 text-left hover:underline truncate w-full"
                          >
                            {article.title}
                          </button>
                          
                          {article.summary && (
                            <p className="text-[11px] text-slate-400 truncate mt-1 max-w-sm font-semibold select-none leading-relaxed">
                              {article.summary}
                            </p>
                          )}
                        </td>

                        {/* Category & Author */}
                        <td className="px-6 py-4 space-y-1.5 text-slate-500 font-bold text-xs leading-relaxed select-none">
                          <div>{article.category}</div>
                          <div className="text-slate-400 font-semibold flex items-center">
                            <User className="w-3.5 h-3.5 mr-1 text-slate-300 flex-shrink-0" />
                            <span>由 {article.author} 撰寫</span>
                          </div>
                        </td>

                        {/* Date & Views */}
                        <td className="px-6 py-4 space-y-1.5 text-slate-400 font-semibold text-xs leading-relaxed select-none">
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-300 flex-shrink-0" />
                            <span>{formatTaiwanDate(article.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-3.5 h-3.5 mr-1 text-slate-300 flex-shrink-0" />
                            <span>
                              觀看量: <strong className="text-slate-600 font-black ml-1">{article.views ?? 0}次</strong>
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEdit(article)}
                              title="編輯文章"
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Copy ID Button */}
                            <button
                              onClick={() => handleCopyId(article.id)}
                              title="複製文章 ID"
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer relative"
                            >
                              {copiedId === article.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(article.id, article.title)}
                              title="刪除文章"
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 italic text-xs select-none">
                找不到符合搜尋與篩選條件的文章。
              </div>
            )}
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1 lg:order-first space-y-4 select-none">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            
            <h3 className="font-extrabold text-slate-800 text-xs pb-3 border-b border-slate-50 uppercase tracking-wider flex items-center">
              <Filter className="w-4 h-4 mr-1.5 text-indigo-600" />
              文章篩選
            </h3>

            <div className="space-y-4">
              
              {/* Search input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">關鍵字搜尋</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="搜尋文章標題、簡介、作者"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">發布狀態</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                >
                  <option value="all">所有狀態</option>
                  <option value="published">已發布</option>
                  <option value="draft">草稿</option>
                </select>
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">文章分類</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                >
                  <option value="all">所有分類</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Modal structure */}
      <ArticleModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchArticles();
        }} 
        article={editingArticle} 
      />

    </div>
  );
}
