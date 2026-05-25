'use client';

import { Gift, Copy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminRewardsPage() {
  const referralLink = "https://bydoingso.com/signup?ref=admin";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert("推薦連結已複製到剪貼簿！");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none font-sans text-slate-700 pt-6">
      <div className="flex items-center space-x-2">
        <Link href="/admin" className="text-slate-400 hover:text-slate-600 transition flex items-center text-xs font-bold">
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回儀表板
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
          <Gift className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-800">推薦獎勵計劃</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            分享 BDS 給您的合作夥伴與朋友！當他們透過您的推薦連結註冊並升級方案時，您與您的朋友都將獲得為期一個月的免費額外進階功能。
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-w-md mx-auto flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 truncate mr-4">{referralLink}</span>
          <button 
            onClick={copyToClipboard}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 mr-1" /> 複製
          </button>
        </div>

        <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl font-black text-slate-800">0</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">成功推薦人數</div>
          </div>
          <div className="text-center p-4 border-l border-slate-100">
            <div className="text-2xl font-black text-slate-800">0 元</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">累計賺取獎金</div>
          </div>
        </div>
      </div>
    </div>
  );
}
