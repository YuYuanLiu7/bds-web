'use client';

import { useState, useEffect } from 'react';
import { Download, Search, Plus, Edit3, Trash2, Copy, Check, ShoppingBag, Activity, Filter } from 'lucide-react';
import DownloadModal from '@/components/admin/DownloadModal';

interface DownloadProduct {
  id: string;
  title: string;
  price: number;
  type: string;
  description: string;
  downloads_count: number;
  status: 'published' | 'draft';
  file_url?: string;
  created_at?: string;
}

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadProduct[]>([]);
  const [filteredDownloads, setFilteredDownloads] = useState<DownloadProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('All');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DownloadProduct | null>(null);
  
  // Actions
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDownloads = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/admin/downloads');
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setDownloads(data);
      } else {
        // 空資料時呈現空狀態，不以假商品魚目混珠
        setDownloads([]);
      }
    } catch (err) {
      // API 失敗時標記載入失敗，與「無資料」空狀態做區分
      console.warn('讀取數位商品失敗：', err);
      setDownloads([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    let result = [...downloads];
    
    if (searchQuery.trim() !== '') {
      result = result.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFormat !== 'All') {
      result = result.filter(item => item.type === selectedFormat);
    }

    setFilteredDownloads(result);
  }, [downloads, searchQuery, selectedFormat]);

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: DownloadProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此數位商品嗎？')) return;
    try {
      // 一律呼叫刪除 API，確保刪除行為與畫面一致
      const res = await fetch(`/api/admin/downloads?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('刪除失敗');

      setDownloads(prev => prev.filter(item => item.id !== id));
    } catch {
      alert('刪除失敗');
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculations for KPI cards
  const totalProducts = downloads.length;
  const totalDownloads = downloads.reduce((acc, curr) => acc + (curr.downloads_count || 0), 0);
  const averagePrice = totalProducts > 0 ? Math.round(downloads.reduce((acc, curr) => acc + (curr.price || 0), 0) / totalProducts) : 0;

  // Extract all available formats for filter dropdown
  const uniqueFormats = Array.from(new Set(downloads.map(item => item.type)));

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Download className="w-6 h-6 mr-2 text-indigo-600" />
            數位下載商品管理
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            統計並管理可供學員單獨購買或下載的 PDF 電子書、求職履歷模板與實戰白皮書。
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 上架新數位商品
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">上架數位商品</span>
            <div className="text-xl font-black text-slate-800">{totalProducts} <span className="text-xs font-semibold text-slate-400">項</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Total Downloads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">累計下載次數</span>
            <div className="text-xl font-black text-emerald-600">{totalDownloads.toLocaleString()} <span className="text-xs font-semibold text-emerald-400">次</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Download className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Average Order Price */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">商品平均單價</span>
            <div className="text-xl font-black text-slate-800">NT$ {averagePrice.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
            <Activity className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold px-1">
            <div>
              共 <span className="text-slate-700 font-extrabold">{filteredDownloads.length}</span> 項數位資源
            </div>
            {loading && <span className="text-indigo-600 animate-pulse">連線更新中...</span>}
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 h-12 select-none">
                    <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3 w-[40%]">商品名稱</th>
                    <th className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3 text-center">發布狀態</th>
                    <th className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3">定價</th>
                    <th className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3">累計下載次數</th>
                    <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDownloads.length > 0 ? (
                    filteredDownloads.map((item) => {
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/40 transition duration-150 group">
                          
                          {/* Title & Format */}
                          <td className="px-6 py-4.5">
                            <div className="space-y-1">
                              <span 
                                onClick={() => handleEdit(item)}
                                className="font-extrabold text-slate-800 text-sm hover:text-indigo-600 transition cursor-pointer leading-snug block"
                              >
                                {item.title}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider select-none">
                                {item.type}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4.5 text-center select-none">
                            {item.status === 'published' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                已上架
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-black text-[9px] border border-amber-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                                草稿
                              </span>
                            )}
                          </td>

                          {/* Original Price */}
                          <td className="px-5 py-4.5 text-slate-700 font-bold text-xs select-none">
                            NT$ {(item.price ?? 0).toLocaleString()}
                          </td>

                          {/* Total Downloads */}
                          <td className="px-5 py-4.5 text-slate-800 font-extrabold text-xs select-none">
                            <div className="flex items-center space-x-1">
                              <Download className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{(item.downloads_count ?? 0)}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4.5 text-right select-none">
                            <div className="flex items-center justify-end space-x-1.5 opacity-90 group-hover:opacity-100 transition">
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => handleEdit(item)}
                                title="編輯商品"
                                className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 rounded-lg transition cursor-pointer flex items-center justify-center"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Copy ID Button */}
                              <button
                                onClick={() => handleCopyId(item.id)}
                                title="複製商品 ID"
                                className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 rounded-lg transition cursor-pointer flex items-center justify-center"
                              >
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDelete(item.id)}
                                title="刪除商品"
                                className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-rose-500 font-semibold text-xs">
                        資料載入失敗，請重新整理或確認登入狀態。
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-xs">
                        目前尚無上架商品。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Filter Aside (lg:col-span-1) */}
        <div className="lg:col-span-1 lg:order-first">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center pb-2.5 border-b border-slate-100">
              <Filter className="w-4 h-4 mr-2 text-indigo-500 shrink-0" />
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">商品篩選</h3>
            </div>
            
            <div className="space-y-4">
              
              {/* Search Title/Desc */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">商品搜尋</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 focus-within:bg-white transition">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜尋關鍵字..."
                    className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Format Filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">檔案格式</label>
                <select 
                  value={selectedFormat}
                  onChange={e => setSelectedFormat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                >
                  <option value="All">🌐 顯示全部格式</option>
                  {uniqueFormats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
              </div>

              {/* Reset Filters button */}
              {(searchQuery !== '' || selectedFormat !== 'All') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFormat('All');
                  }}
                  className="w-full py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-500 font-bold text-[10px] rounded-xl transition cursor-pointer"
                >
                  清除所有篩選
                </button>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* Product Edit / Create Modal */}
      <DownloadModal 
        isOpen={isModalOpen}
        product={editingProduct}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDownloads}
      />

    </div>
  );
}
