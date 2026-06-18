'use client';

import { useState } from 'react';
import { Download, ArrowRight, ShieldCheck, FileText, Layout, FileSpreadsheet, Archive, PlayCircle, X, ExternalLink, Sparkles, CheckCircle2, Crown, AlertCircle } from 'lucide-react';

interface DownloadProduct {
  id: string;
  title: string;
  price: number;
  type: string;
  description: string;
  downloads_count: number;
  status: 'published' | 'draft';
  file_url?: string;
}

interface DownloadsListProps {
  downloads: DownloadProduct[];
  primaryColor: string;
  isAdmin?: boolean;
  ownedIds?: string[];
  isLoggedIn?: boolean;
}

export default function DownloadsList({ downloads, primaryColor, isAdmin = false, ownedIds = [], isLoggedIn = false }: DownloadsListProps) {
  const [selectedProduct, setSelectedProduct] = useState<DownloadProduct | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 判斷某商品目前使用者是否可直接下載：管理員、免費商品、或已購買者
  const canDownload = (product: DownloadProduct) => {
    const isPaid = (product.price || 0) > 0;
    return isAdmin || !isPaid || ownedIds.includes(product.id);
  };

  // Helper to map icons based on type
  const getIconForType = (type: string) => {
    const lowerType = (type || '').toLowerCase();
    if (lowerType.includes('簡報') || lowerType.includes('ppt') || lowerType.includes('keynote')) {
      return Layout;
    }
    if (lowerType.includes('試算表') || lowerType.includes('excel') || lowerType.includes('csv')) {
      return FileSpreadsheet;
    }
    if (lowerType.includes('壓縮') || lowerType.includes('zip') || lowerType.includes('rar')) {
      return Archive;
    }
    if (lowerType.includes('影音') || lowerType.includes('影片') || lowerType.includes('mp4') || lowerType.includes('課程')) {
      return PlayCircle;
    }
    return FileText; // Default to document icon
  };

  const handleCardClick = (product: DownloadProduct) => {
    setSelectedProduct(product);
    setDownloadSuccess(false);
  };

  // 下載：付費商品的 file_url 不在列表中外洩，改向安全端點逐筆驗證權限後取得連結
  const handleDownload = async (product: DownloadProduct) => {
    if (!canDownload(product)) {
      handlePurchase(product);
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/downloads/${product.id}/file`);
      const data = await res.json();

      if (!res.ok || !data.file_url) {
        alert(data.error || '此資源尚未配置下載檔案連結，請稍後再試或聯絡客服。');
        return;
      }

      setDownloadSuccess(true);
      setTimeout(() => {
        window.open(data.file_url, '_blank');
        setDownloadSuccess(false);
      }, 1200);
    } catch (err) {
      console.error('Download error:', err);
      alert('下載連結取得失敗，請稍後再試。');
    } finally {
      setProcessing(false);
    }
  };

  // 購買：未登入先導向登入；已登入則建立訂單並導向 PayUni 金流
  const handlePurchase = async (product: DownloadProduct) => {
    if (!isLoggedIn) {
      window.location.href = `/login?callbackUrl=/downloads`;
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadId: product.id, type: 'download' }),
      });
      const params = await response.json();

      if (!response.ok) {
        alert(params.error || '結帳失敗，請稍後再試。');
        return;
      }

      // 建立隱藏表單並 POST 至 PayUni（UPP）；端點由環境變數決定
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = process.env.NEXT_PUBLIC_PAYUNI_UPP_URL || 'https://sandbox-api.payuni.com.tw/api/upp';
      Object.keys(params).forEach((key) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('結帳失敗，請稍後再試。');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 select-none" style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      {/* Card list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {downloads.map((item) => {
          const IconComponent = getIconForType(item.type);
          return (
            <div 
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-slate-300 transition-all duration-300 group text-left cursor-pointer transform hover:-translate-y-1.5"
            >
              <div className="space-y-4">
                {/* Visual Icon Header */}
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center transition group-hover:scale-105" style={{ backgroundColor: `${primaryColor}08`, color: primaryColor }}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center">
                      <Download className="w-3 h-3 mr-0.5" /> 已下載 {item.downloads_count} 次
                    </span>
                  </div>
                  {/* High contrast, deep black title */}
                  <h3 className="text-lg font-black text-slate-950 leading-snug group-hover:text-[var(--primary-color)] transition duration-200">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Pricing & Checkout Actions */}
              <div className="border-t border-slate-50 pt-5 mt-6 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-900">
                    NT$ {item.price.toLocaleString()}
                  </span>
                  {isAdmin ? (
                    <span className="text-[9px] font-bold text-indigo-600 flex items-center mt-0.5">
                      <Crown className="w-3 h-3 mr-0.5" /> 管理員可直接下載
                    </span>
                  ) : ownedIds.includes(item.id) && (item.price || 0) > 0 ? (
                    <span className="text-[9px] font-bold text-emerald-600 flex items-center mt-0.5">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> 已購買
                    </span>
                  ) : null}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click trigger
                    handleCardClick(item);
                  }}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:opacity-90 active:scale-95 transition flex items-center cursor-pointer"
                >
                  {isAdmin ? '管理員查看' : canDownload(item) ? '立即下載' : ((item.price || 0) > 0 ? '立即選購' : '免費下載')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans text-slate-700">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-wider">
                {selectedProduct.type}
              </span>
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="關閉視窗"
                className="p-1 hover:bg-slate-200 rounded-full transition text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Admin Privileges Badge */}
              {isAdmin && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start space-x-2 text-indigo-700 select-none">
                  <Crown className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-black">👑 管理員尊榮特權已啟用</div>
                    <p className="text-[9px] font-semibold text-indigo-500/90 leading-normal">
                      系統已偵測到您的最高權限！您可以繞過任何購買限制，直接免付費下載或查看本數位資源。
                    </p>
                  </div>
                </div>
              )}

              {/* Product Info */}
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}08`, color: primaryColor }}>
                  {(() => {
                    const Icon = getIconForType(selectedProduct.type);
                    return <Icon className="w-7 h-7" />;
                  })()}
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-950 leading-snug">
                    {selectedProduct.title}
                  </h2>
                  <div className="text-xs text-slate-400 font-semibold flex items-center">
                    <Download className="w-3.5 h-3.5 mr-1" />
                    已累計下載：<span className="text-slate-600 font-bold">{selectedProduct.downloads_count} 次</span>
                  </div>
                </div>
              </div>

              {/* Price & Value Proposition */}
              <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">商品售價</span>
                  <div className="text-xl font-black text-slate-900">
                    NT$ {selectedProduct.price.toLocaleString()}
                  </div>
                </div>
                <span className="inline-flex items-center text-[10px] text-indigo-600 font-black bg-indigo-50 px-2.5 py-1 rounded-lg">
                  <Sparkles className="w-3 h-3 mr-1" /> 付款後可永久下載
                </span>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">數位資源簡介</h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-line bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
                  {selectedProduct.description || '暫無詳細描述，此商品為 BDS 精選商務開發實戰資源。'}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/30 flex flex-col space-y-2">
              {downloadSuccess ? (
                <div className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span>驗證成功，正在為您開啟下載連結…</span>
                </div>
              ) : (
                <button
                  onClick={() => (canDownload(selectedProduct) ? handleDownload(selectedProduct) : handlePurchase(selectedProduct))}
                  disabled={processing}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-3 text-white rounded-xl font-black text-xs shadow-md hover:opacity-90 active:scale-98 transition flex items-center justify-center cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {processing
                    ? '處理中...'
                    : isAdmin
                      ? '👑 管理員直接下載'
                      : (selectedProduct.price || 0) <= 0
                        ? '免費下載資源'
                        : ownedIds.includes(selectedProduct.id)
                          ? '立即下載（已購買）'
                          : '立即購買解鎖資源'}
                </button>
              )}
              
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer text-center"
              >
                關閉視窗
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
