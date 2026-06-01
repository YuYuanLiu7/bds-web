'use client';

import { useState } from 'react';
import { Code, Save, Plus, Copy, Check, Terminal, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminDeveloperPage() {
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('bds_live_api_key_849ab2e3d938ac47102e3b2e3f');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Code className="w-6.5 h-6.5 mr-2 text-indigo-600" />
            開發者專區
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">自訂與串接 Webhook 通知、管理 API 密鑰授權，進行進階系統設定與系統日誌監控。</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* API Keys */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center">
              <Shield className="w-4.5 h-4.5 mr-2 text-slate-400" />
              BDS 系統 API 授權金鑰 (API Key)
            </h2>
            <div className="border-t border-slate-50 my-1"></div>
            <div className="space-y-4">
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                這是您的系統 API 金鑰，可用於自訂系統整合，例如串接第三方 CRM、Line 機器人或自動化工具。請妥善保存，切勿公開。
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500">Live API Key</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1.5 items-center">
                  <input 
                    type="password" 
                    value="bds_live_api_key_849ab2e3d938ac47102e3b2e3f" 
                    className="bg-transparent flex-1 text-xs px-2 text-slate-500 font-mono outline-none select-all"
                    readOnly
                  />
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-white text-slate-500 hover:text-slate-800 rounded-lg shadow-sm border border-slate-100 transition active:scale-95 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center">
              <Terminal className="w-4.5 h-4.5 mr-2 text-slate-400" />
              即時事件 Webhook 通知
            </h2>
            <div className="border-t border-slate-50 my-1"></div>
            <div className="space-y-4">
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                當發生付款完成、學員註冊、新留言提問等事件時，系統將會向您設定的 URL 送出 JSON POST 請求通知。
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">接收 Webhook URL</label>
                <input 
                  type="text" 
                  defaultValue="https://your-crm-endpoint.com/webhooks/bds" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Aside */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">系統狀態 (Health Logs)</h3>
            <div className="border-t border-slate-50 pt-3 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>資料庫連接狀況</span>
                <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">健康</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>PayUni 閘道器連線</span>
                <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">健康</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>系統當前時間</span>
                <span className="text-[10px] text-slate-400 font-mono font-semibold">2026-05-25 21:55</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
