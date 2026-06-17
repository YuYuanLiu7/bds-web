'use client';

import { useState } from 'react';
import {
  Gift,
  Copy,
  ArrowLeft,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Search,
  HelpCircle,
  Award,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface ReferralRecord {
  id: string;
  name: string;
  email: string;
  date: string;
  course: string;
  amount: number;
  commission: number;
  status: 'paid' | 'pending' | 'cancelled';
}

export default function AdminRewardsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const commissionRate = 5;

  // 推薦分潤功能尚未串接後端，暫以空資料呈現，避免顯示假明細
  const referrals: ReferralRecord[] = [];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert('複製失敗，請手動選取連結複製。');
    }
  };

  // 推廣連結功能開發中，暫以固定示意連結呈現
  const referralLink = 'https://bydoingso.com/signup?ref=（功能開發中）';

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans text-slate-700 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-2">
            <Link href="/admin" className="hover:text-indigo-600 transition flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 儀表板
            </Link>
            <span>/</span>
            <span className="text-slate-500">分潤與獎勵</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Award className="w-7 h-7 mr-2 text-indigo-600" />
            推薦與分潤獎勵
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">推廣 BDS 網站給其他創作者或學員，獲取高額現金分潤與權限獎勵。</p>
        </div>
      </div>

      {/* 開發中橫幅 */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-extrabold text-amber-800">推薦分潤功能開發中</p>
          <p className="text-xs font-semibold text-amber-700 mt-0.5">
            此頁面之推廣連結、分潤統計與推薦明細尚未串接後端，目前僅為介面預覽，所有數據暫不代表實際成效。
          </p>
        </div>
      </div>

      {/* Grid: 3 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Invited */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">推薦註冊人次</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-slate-800">0</span>
              <span className="text-xs text-slate-500 font-semibold">人</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block">尚未開放統計</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Pending Commission */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">審核中分潤</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-amber-600">—</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block">確認無退款後發放</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Paid Commission */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">已發放分潤</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-emerald-600">—</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center">
              <CheckCircle className="w-3 h-3 mr-0.5" /> 尚未開放撥付
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Layout: Link Sharing Left, Rules Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Columns: Sharing widget & List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Gradient Referral Banner */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-indigo-700/50">
            {/* Ambient glows inside card */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5 max-w-xl">
              <div className="inline-flex px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold items-center">
                <Gift className="w-3.5 h-3.5 mr-1" />
                活動進行中：{commissionRate}% 現金分潤
              </div>
              <h2 className="text-xl md:text-2xl font-black leading-tight">邀請合作夥伴加入 BDS<br />雙向贏取推薦福利！</h2>
              <p className="text-indigo-100 text-xs leading-relaxed font-semibold">
                分享您的專屬推薦連結給其他課程創作者或學員。當他們透過連結註冊並成功訂閱或購買課程，您即可享有該筆交易金額 {commissionRate}% 的推廣分潤，且被推薦人將獲得價值 NT$ 200 的購課折價券！
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-indigo-200 uppercase tracking-wider block">自訂推廣代碼（如講師姓名或代號）</label>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white">功能開發中</span>
                  </div>
                  <input
                    type="text"
                    value=""
                    disabled
                    readOnly
                    placeholder="推廣代碼功能即將推出"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-indigo-300/60 outline-none transition font-bold cursor-not-allowed opacity-60"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 flex items-center justify-between overflow-hidden">
                    <span className="text-xs font-bold font-sans text-indigo-50/70 truncate mr-3">{referralLink}</span>
                    {copied ? (
                      <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-2.5 py-1 rounded-md animate-pulse shrink-0">
                        已複製
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    disabled
                    className="bg-white/80 text-indigo-700/70 px-6 py-3 rounded-2xl text-xs font-black transition flex items-center justify-center shadow-md shrink-0 cursor-not-allowed opacity-60"
                  >
                    <Copy className="w-4 h-4 mr-1.5" /> 複製自訂連結
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Performance Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center">
                推薦明細與成效
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="搜尋學員姓名、課程..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                </div>
                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="all">所有狀態</option>
                  <option value="pending">⏳ 審核中</option>
                  <option value="paid">🟢 已撥款</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-50">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/40 text-slate-400 font-bold border-b border-slate-100">
                    <th className="p-4">學員</th>
                    <th className="p-4">註冊/推廣時間</th>
                    <th className="p-4">購買課程</th>
                    <th className="p-4 text-right">訂單金額</th>
                    <th className="p-4 text-right">預計分潤 ({commissionRate}%)</th>
                    <th className="p-4 text-center">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReferrals.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 font-semibold text-slate-600">
                      <td className="p-4">
                        <div>
                          <div className="font-extrabold text-slate-800">{record.name}</div>
                          <div className="text-[10px] text-slate-400">{record.email}</div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{record.date}</td>
                      <td className="p-4 font-bold text-slate-700">{record.course}</td>
                      <td className="p-4 text-right font-extrabold">NT$ {record.amount.toLocaleString()}</td>
                      <td className="p-4 text-right text-indigo-600 font-extrabold">NT$ {Math.round(record.amount * (commissionRate / 100)).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide ${
                          record.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {record.status === 'paid' ? '已撥款' : '審核中'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredReferrals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                        目前尚無推薦紀錄
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Right 1 Column: Guidelines & Rules */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h3 className="font-extrabold text-slate-800 text-sm pb-3 border-b border-slate-50 flex items-center">
              <HelpCircle className="w-4 h-4 mr-1.5 text-indigo-600" />
              推薦分潤細則
            </h3>

            <div className="space-y-4 text-xs leading-relaxed font-semibold text-slate-500">
              
              <div className="space-y-1">
                <div className="text-slate-800 font-bold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                  {commissionRate}% 現金分潤是如何計算的？
                </div>
                <p className="pl-3.5">
                  只要新創作者或學員透過您的連結購買平台上的單堂課程，或是完成付費方案訂閱，系統將依實際收到的付款金額（扣除折價券等促銷折扣）計算出 {commissionRate}% 作為您的推廣佣金。
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-slate-800 font-bold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                  累積的佣金何時會撥付？
                </div>
                <p className="pl-3.5">
                  因有消保法猶豫期（退款期），推薦訂單完成後的 7 天內會呈現「審核中」。確認訂單無退款紀錄後，系統會於<strong className="text-slate-800">每月 25 日</strong>前自動撥付累積已審核通過的款項至您的設定帳戶。
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-slate-800 font-bold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                  如何設定提領的銀行帳戶？
                </div>
                <p className="pl-3.5">
                  您可以前往後台「系統主設定」中的「金流與帳務」頁面填寫您的銀行代碼、帳號與戶名。完成設定後系統即會準時自動撥款，不收提領手續費。
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
