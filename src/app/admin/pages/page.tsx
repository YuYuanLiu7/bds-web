'use client';

import { useState } from 'react';
import { FileCode, Search, Plus, ExternalLink, RefreshCw, Trash2, X, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function AdminPagesPage() {
  const [pages, setPages] = useState([
    { id: '1', name: '首頁 (首頁核心展示)', path: '/', type: 'system', status: 'published', lastUpdated: '2026-05-20 18:30' },
    { id: '2', name: '所有課程列表', path: '/courses', type: 'system', status: 'published', lastUpdated: '2026-05-18 12:45' },
    { id: '3', name: '關於我們 / BDS 理念介紹', path: '/about', type: 'custom', status: 'published', lastUpdated: '2026-05-12 14:00' },
    { id: '4', name: '隱私權與服務條款條約', path: '/privacy', type: 'custom', status: 'published', lastUpdated: '2026-04-30 09:15' },
    { id: '5', name: '聯絡我們 / 商務諮詢', path: '/contact', type: 'custom', status: 'draft', lastUpdated: '2026-03-22 17:00' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    status: 'draft' as 'published' | 'draft'
  });

  const filteredPages = pages.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setEditingPage(null);
    setFormData({
      name: '',
      path: '/',
      status: 'draft'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (page: any) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      path: page.path,
      status: page.status
    });
    setIsModalOpen(true);
  };

  const handleDeletePage = (id: string) => {
    if (confirm('確定要刪除此自訂頁面嗎？這將會從頁面清單中移除此紀錄。')) {
      setPages(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSavePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.path) return;

    let formattedPath = formData.path.trim();
    if (!formattedPath.startsWith('/')) {
      formattedPath = '/' + formattedPath;
    }

    const now = new Date();
    const lastUpdated = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (editingPage) {
      // Edit
      setPages(prev => prev.map(p => p.id === editingPage.id ? {
        ...p,
        name: formData.name,
        path: formattedPath,
        status: formData.status,
        lastUpdated
      } : p));
    } else {
      // Create
      const newPage = {
        id: String(Date.now()),
        name: formData.name,
        path: formattedPath,
        type: 'custom',
        status: formData.status,
        lastUpdated
      };
      setPages(prev => [...prev, newPage]);
    }
    setIsModalOpen(false);
  };

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
        <button 
          onClick={handleOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 建立自訂頁面
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold flex justify-between items-center">
            <div>
              共 <span className="text-slate-700 font-extrabold">{pages.length}</span> 項
              {searchQuery && (
                <>
                  ，篩選出 <span className="text-indigo-600 font-extrabold">{filteredPages.length}</span> 項
                </>
              )}
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center transition cursor-pointer"
              >
                <X className="w-3 h-3 mr-1" /> 清除搜尋
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 h-12">
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-4/12">頁面名稱</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-3/12">路徑</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-2/12">類型 / 狀態</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-2/12">最後更新</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/12 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPages.length > 0 ? (
                  filteredPages.map((p) => (
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
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2.5">
                          <button 
                            onClick={() => handleOpenEditModal(p)}
                            className="text-slate-400 hover:text-indigo-600 transition cursor-pointer p-1 rounded hover:bg-slate-50"
                            title="編輯頁面"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {p.type === 'custom' ? (
                            <button 
                              onClick={() => handleDeletePage(p.id)}
                              className="text-slate-400 hover:text-red-500 transition cursor-pointer p-1 rounded hover:bg-slate-50"
                              title="刪除頁面"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-5.5 h-5.5"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-semibold text-xs italic">
                      找不到相符的頁面...
                    </td>
                  </tr>
                )}
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋頁面名稱/路徑"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button 
                onClick={() => {}} // Dynamic search is instant on typing
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 mr-1" /> 搜尋頁面
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-extrabold text-slate-800 text-xs flex items-center">
                <FileCode className="w-4.5 h-4.5 mr-1.5 text-indigo-600" />
                {editingPage ? '編輯頁面資訊' : '建立全新自訂頁面'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <form onSubmit={handleSavePage} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">頁面名稱</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 關於我們 / BDS 理念介紹"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">頁面路徑</label>
                <input 
                  type="text" 
                  required
                  disabled={editingPage?.type === 'system'}
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="例如: /about"
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition ${editingPage?.type === 'system' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {editingPage?.type === 'system' && (
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">系統內建頁面的路徑無法修改。</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">發布狀態</label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${formData.status === 'published' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700' : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100/70'}`}>
                    <input 
                      type="radio" 
                      name="status"
                      value="published"
                      checked={formData.status === 'published'}
                      onChange={() => setFormData({ ...formData, status: 'published' })}
                      className="sr-only"
                    />
                    已發佈
                  </label>
                  <label className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${formData.status === 'draft' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700' : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100/70'}`}>
                    <input 
                      type="radio" 
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={() => setFormData({ ...formData, status: 'draft' })}
                      className="sr-only"
                    />
                    草稿
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 py-2.5 rounded-xl font-bold text-xs border border-slate-200 transition active:scale-98 cursor-pointer text-center"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-98 cursor-pointer text-center"
                >
                  儲存設定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
