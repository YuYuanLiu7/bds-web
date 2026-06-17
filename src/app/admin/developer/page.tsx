'use client';

import { useState, useEffect } from 'react';
import { Code, Save, Plus, Copy, Check, Terminal, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminDeveloperPage() {
  // 尚未串接後端金鑰產生 API，故暫無可用的正式金鑰
  const apiKey = '';
  const [copiedKey, setCopiedKey] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // 每秒更新系統當前時間，避免顯示固定的過期時間
  useEffect(() => {
    const formatTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };
    setCurrentTime(formatTime());
    const timer = setInterval(() => setCurrentTime(formatTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* 開發中提示橫幅 */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
        本頁部分開發者功能仍在開發中，所顯示的設定與狀態尚未正式啟用。
      </div>

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
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center justify-between">
              <span className="flex items-center">
                <Shield className="w-4.5 h-4.5 mr-2 text-slate-400" />
                BDS 系統 API 授權金鑰 (API Key)
              </span>
              <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">即將推出</span>
            </h2>
            <div className="border-t border-slate-50 my-1"></div>
            <div className="space-y-4">
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                這是您的系統 API 金鑰，可用於自訂系統整合，例如串接第三方 CRM、Line 機器人或自動化工具。請妥善保存，切勿公開。
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500">正式 API 金鑰</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1.5 items-center">
                  <input
                    type={apiKey ? 'password' : 'text'}
                    value={apiKey || '尚未產生金鑰'}
                    className="bg-transparent flex-1 text-xs px-2 text-slate-500 font-mono outline-none select-all"
                    readOnly
                  />
                  <button
                    onClick={handleCopy}
                    disabled={!apiKey}
                    className="p-2 bg-white text-slate-500 hover:text-slate-800 rounded-lg shadow-sm border border-slate-100 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                  placeholder="功能開發中"
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Aside */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">系統狀態</h3>
            <div className="border-t border-slate-50 pt-3 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>資料庫連接狀況</span>
                <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">尚未啟用監測</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>PayUni 閘道器連線</span>
                <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">尚未啟用監測</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>系統當前時間</span>
                <span className="text-[10px] text-slate-400 font-mono font-semibold">{currentTime || '載入中…'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
