'use client';

import { Grid, Cpu, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AdminIntegrationsPage() {
  // 目前為未串接的示範資料，皆顯示為未連接狀態（功能開發中）
  const integrations = [
    { id: '1', name: 'Google Analytics 4', description: '監測網站流量、使用者行為、轉換率與行銷成效。', key: '尚未綁定', status: 'disconnected', type: '數據分析' },
    { id: '2', name: 'Rewardful', description: 'BDS 聯盟行銷與推廣夥伴追蹤工具，促進社交銷售。', key: '尚未綁定', status: 'disconnected', type: '行銷推廣' },
    { id: '3', name: 'Meta Pixel (Facebook Pixel)', description: '追蹤 Facebook 廣告投放成效與自訂廣告受眾。', key: '尚未綁定', status: 'disconnected', type: '廣告追蹤' }
  ];

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">

      {/* 返回後台首頁 */}
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" />
        返回後台首頁
      </Link>

      {/* 開發中橫幅 */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-4 py-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-xs font-bold leading-relaxed">第三方整合功能開發中，敬請期待。</p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Grid className="w-6 h-6 mr-2 text-indigo-600" />
            第三方整合
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">快速連結與管理 GA4 數據追蹤、Meta 像素與聯盟行銷工具。</p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <div key={item.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between p-6 hover:shadow-md transition">
            <div className="space-y-4">
              {/* Header inside card */}
              <div className="flex justify-between items-start gap-2">
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
                {item.status === 'connected' ? (
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                    已連接
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold text-[10px]">
                    未連接
                  </span>
                )}
              </div>

              {/* Title & info */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-sm">{item.name}</h3>
                <span className="inline-block text-slate-400 font-bold text-[9px] px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">{item.type}</span>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed font-semibold">{item.description}</p>
              </div>

              {/* Key display */}
              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold text-slate-400">整合識別碼 (ID/Key)</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 font-mono truncate">
                  {item.key}
                </div>
              </div>
            </div>

            {/* Toggle Button（功能開發中，暫時停用） */}
            <div className="pt-5 border-t border-slate-50 mt-5">
              <button
                type="button"
                disabled
                className="w-full py-2 rounded-xl font-bold text-xs bg-slate-100 text-slate-400 cursor-not-allowed"
              >
                即將推出
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
