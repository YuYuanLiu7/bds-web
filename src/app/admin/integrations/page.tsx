'use client';

import { useState } from 'react';
import { Grid, Cpu, Save, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    { id: '1', name: 'Google Analytics 4', description: '監測網站流量、使用者行為、轉換率與行銷成效。', key: 'G-64BBZQXXRZ', status: 'connected', type: '數據分析' },
    { id: '2', name: 'Rewardful', description: 'BDS 學校聯盟行銷與推廣夥伴追蹤工具，促進社交銷售。', key: 'e80386', status: 'connected', type: '行銷推廣' },
    { id: '3', name: 'Meta Pixel (Facebook Pixel)', description: '追蹤 Facebook 廣告投放成效與自訂廣告受眾。', key: '未綁定', status: 'disconnected', type: '廣告追蹤' }
  ]);

  const handleToggle = (id: string) => {
    setIntegrations(integrations.map(item => 
      item.id === id 
        ? { ...item, status: item.status === 'connected' ? 'disconnected' : 'connected' }
        : item
    ));
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Grid className="w-6.5 h-6.5 mr-2 text-indigo-600" />
            第三方整合
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">快速連結與管理 GA4 數據追蹤、Meta 像素、LINE 登入與聯盟行銷工具。</p>
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

            {/* Toggle Button */}
            <div className="pt-5 border-t border-slate-50 mt-5">
              <button 
                onClick={() => handleToggle(item.id)}
                className={`w-full py-2 rounded-xl font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer ${
                  item.status === 'connected'
                    ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {item.status === 'connected' ? '中斷連線' : '開始連接'}
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
