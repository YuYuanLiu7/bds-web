'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, FileText, Download, DollarSign, Tag, Globe, Settings, Eye } from 'lucide-react';

interface DownloadProduct {
  id?: string;
  title: string;
  price: number;
  type: string;
  description: string;
  downloads_count: number;
  status: 'published' | 'draft';
  file_url?: string;
}

interface DownloadModalProps {
  product?: DownloadProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DownloadModal({ product, isOpen, onClose, onSuccess }: DownloadModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<DownloadProduct>({
    title: '',
    price: 0,
    type: 'PDF 文件',
    description: '',
    downloads_count: 0,
    status: 'published',
    file_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          ...product,
          title: product.title || '',
          price: product.price ?? 0,
          type: product.type || 'PDF 文件',
          description: product.description || '',
          downloads_count: product.downloads_count ?? 0,
          status: product.status || 'published',
          file_url: product.file_url || ''
        });
      } else {
        setFormData({
          title: '',
          price: 0,
          type: 'PDF 文件',
          description: '',
          downloads_count: 0,
          status: 'published',
          file_url: ''
        });
      }
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上傳失敗');

      if (data.url) {
        setFormData(prev => ({ ...prev, file_url: data.url }));
      }
    } catch (err: any) {
      console.error(err);
      alert('檔案上傳失敗：' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/admin/downloads';
      const method = formData.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '儲存失敗');
      }

      onSuccess();
      onClose();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert('儲存數位商品出錯：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans text-slate-700">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 select-none">
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center">
              <Download className="w-5 h-5 mr-2 text-indigo-600" />
              {formData.id ? '編輯數位商品' : '新增數位商品'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              設定數位下載商品的銷售價格、檔案格式與初始銷量統計。
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition text-gray-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
          
          <div className="p-8 space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">商品名稱</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-sm font-bold text-slate-800 placeholder:text-slate-300"
                placeholder="例如：BDS 獨家：半導體高階業務求職信與履歷模板"
              />
            </div>

            {/* Price & Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Price */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                  <DollarSign className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  商品定價 (NT$)
                </label>
                <input 
                  type="number" 
                  min={0}
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-700"
                  placeholder="0"
                />
              </div>

              {/* Format Type */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  商品格式
                </label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold text-slate-700"
                >
                  <option>PDF 文件</option>
                  <option>PDF/PPT 簡報</option>
                  <option>PDF 電子書</option>
                  <option>Excel 試算表</option>
                  <option>ZIP 壓縮檔</option>
                  <option>MP4 影音課程</option>
                </select>
              </div>

            </div>

            {/* Net Sales Volume & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Simulated Net Sales Volume */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                  <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  淨銷售量 / 下載量 (次)
                </label>
                <input 
                  type="number" 
                  min={0}
                  required
                  value={formData.downloads_count}
                  onChange={e => setFormData({...formData, downloads_count: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-700"
                  placeholder="0"
                />
                <p className="text-[9px] text-slate-400 mt-1 font-medium">手動填寫此欄位，可用來做初始銷售量 / 下載量的展示。</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  發布狀態
                </label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold text-slate-700"
                >
                  <option value="published">🟢 立即公開上架</option>
                  <option value="draft">🟡 儲存為草稿</option>
                </select>
              </div>

            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                商品大綱簡介
              </label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition min-h-[80px] text-xs font-semibold leading-relaxed text-slate-600 placeholder:text-slate-300"
                placeholder="請輸入數位下載商品的簡介，讓前台購買頁面能完整呈現其特色與價值..."
              />
            </div>

            {/* File URL & Upload */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center">
                  <Settings className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  數位商品檔案連結 (可上傳本機檔案)
                </span>
                <label className="text-[9px] text-indigo-600 hover:text-indigo-800 font-black cursor-pointer select-none">
                  {uploading ? '上傳中...' : '📸 上傳數位資源'}
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
              </label>
              <input 
                type="text" 
                value={formData.file_url || ''}
                onChange={e => setFormData({...formData, file_url: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-600 placeholder:text-slate-300"
                placeholder="選填本機檔案上傳，或是直接貼上雲端硬碟下載 URL 連結..."
              />
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-8 py-5 border-t border-slate-100 bg-slate-50/20 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition text-xs font-bold cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md active:scale-98 transition flex items-center cursor-pointer disabled:opacity-55"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {loading ? '儲存中...' : '儲存數位商品'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
