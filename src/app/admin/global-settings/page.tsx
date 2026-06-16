'use client';

import { useState, useEffect } from 'react';
import { Sliders, Save, SlidersHorizontal, Globe, Mail, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminGlobalSettingsPage() {
  const [success, setSuccess] = useState(false);
  const [customDomain, setCustomDomain] = useState('bds.fu-notes.com');
  const [emailFromName, setEmailFromName] = useState('BDS By Doing So');
  const [emailFromAddress, setEmailFromAddress] = useState('no-reply@bds.fu-notes.com');

  useEffect(() => {
    fetch('/api/admin/general-settings')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const g = data?.global;
        if (g) {
          setCustomDomain(g.customDomain ?? 'bds.fu-notes.com');
          setEmailFromName(g.emailFromName ?? 'BDS By Doing So');
          setEmailFromAddress(g.emailFromAddress ?? 'no-reply@bds.fu-notes.com');
        }
      })
      .catch(err => console.warn('Failed to load global settings:', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/general-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'global', value: { customDomain, emailFromName, emailFromAddress } }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('儲存失敗，請稍後再試');
      }
    } catch (err) {
      console.error('Save global settings error:', err);
      alert('連線錯誤，儲存失敗');
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Sliders className="w-6.5 h-6.5 mr-2 text-indigo-600" />
            全站設定
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">自訂您的網站網域、Email 寄件服務、頁尾聲明及全站基礎防護機制。</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-xl font-bold animate-in fade-in duration-200">
          ✨ 全站設定儲存成功！
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Body */}
        <div className="lg:col-span-2 space-y-6">
          {/* Domain Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center">
              <Globe className="w-4.5 h-4.5 mr-2 text-slate-400" />
              網域與品牌網址
            </h2>
            <div className="border-t border-slate-50 my-1"></div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">自訂網域</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">預設二級子網域</label>
                <input 
                  type="text" 
                  defaultValue="outliersadmin38.kaik.io" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-400 outline-none"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center">
              <Mail className="w-4.5 h-4.5 mr-2 text-slate-400" />
              Email 寄件者與服務設定
            </h2>
            <div className="border-t border-slate-50 my-1"></div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">寄件人顯示名稱</label>
                  <input
                    type="text"
                    value={emailFromName}
                    onChange={(e) => setEmailFromName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">系統發信電子信箱</label>
                  <input
                    type="email"
                    value={emailFromAddress}
                    onChange={(e) => setEmailFromAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save aside */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">存檔設定</h3>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              這些為全站基礎連線設定，變更將會影響整個系統發信機制與 DNS 解析跳轉。
            </p>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4 mr-2" />
              儲存全站設定
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
