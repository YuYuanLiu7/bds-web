'use client';

import { useState } from 'react';
import { Tag, Search, Plus, Ticket } from 'lucide-react';

// 於模組載入時取一次時間戳作為「今天」基準（避免在 render 期間呼叫 Date.now 造成非純粹渲染）
const PAGE_LOAD_TS = Date.now();

export default function AdminMarketingPage() {
  const [coupons] = useState([
    { id: '1', name: 'BDS 新生見面禮', code: 'BDSNEW500', discount: '折價 NT$ 500', limit: '無限次數', used: 45, status: 'active', end: '無期限' },
    { id: '2', name: '半導體實戰營早鳥優惠', code: 'EARLYBIRD88', discount: '全單打 88 折', limit: '限量 50 張', used: 32, status: 'active', end: '2026-06-10' },
    { id: '3', name: '醫材沙龍推廣促銷', code: 'SALON100', discount: '折價 NT$ 100', limit: '限量 100 張', used: 15, status: 'active', end: '2026-05-30' }
  ]);

  // 依優惠券狀態與到期日判斷顯示文字與樣式（避免將已過期券標示為發送中）
  const getCouponStatus = (coupon: { status: string; end: string }) => {
    if (coupon.status !== 'active') {
      return { label: '已停用', className: 'bg-slate-100 text-slate-500' };
    }
    // 到期日為實際日期且早於今日時，視為已過期
    if (coupon.end && coupon.end !== '無期限') {
      const endDate = new Date(coupon.end);
      if (!isNaN(endDate.getTime()) && endDate.getTime() < PAGE_LOAD_TS) {
        return { label: '已過期', className: 'bg-slate-100 text-slate-500' };
      }
    }
    return { label: '發送中', className: 'bg-emerald-50 text-emerald-600' };
  };

  // 行銷篩選（針對示範清單做即時關鍵字過濾）
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const filteredCoupons = activeQuery
    ? coupons.filter(
        (c) =>
          c.name.toLowerCase().includes(activeQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(activeQuery.toLowerCase())
      )
    : coupons;

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Tag className="w-6 h-6 mr-2 text-indigo-600" />
            行銷
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">建立促銷折扣代碼、行銷優惠券以提高學員的轉單與購買意願。</p>
        </div>
        <button
          disabled
          title="完整優惠券系統開發中"
          className="bg-slate-200 text-slate-400 px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 新增優惠券（即將推出）
        </button>
      </div>

      {/* 示範資料提示 */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-semibold text-amber-700 leading-relaxed">
        ⚠️ 以下優惠券為示範資料，完整的折扣碼建立與套用系統尚在開發中，目前僅供版面展示與搜尋示範。
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold">
            共 <span className="text-slate-700 font-extrabold">{filteredCoupons.length}</span> 項
            {filteredCoupons.length > 0 && (
              <>，顯示 <span className="text-slate-700 font-extrabold">1-{filteredCoupons.length}</span></>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 h-12">
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">優惠券名稱 / 代碼</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">折扣詳情</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">限制 / 已使用次數</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => {
                  const couponStatus = getCouponStatus(coupon);
                  return (
                  <tr key={coupon.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${couponStatus.className}`}>
                          {couponStatus.label}
                        </span>
                      </div>
                      <div className="block font-bold text-slate-700 text-sm mt-1.5 leading-snug">
                        {coupon.name}
                      </div>
                      <div className="text-slate-400 text-xs font-semibold font-mono uppercase mt-1">代碼: {coupon.code}</div>
                    </td>
                    <td className="px-6 py-4 text-rose-600 font-extrabold text-sm">
                      {coupon.discount}
                    </td>
                    <td className="px-6 py-4 space-y-1 text-slate-400 font-semibold text-xs">
                      <div className="flex items-center text-slate-500">
                        {coupon.limit} (到期: {coupon.end})
                      </div>
                      <div className="flex items-center">
                        <Ticket className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        已折抵使用: <span className="text-slate-600 font-bold ml-1">{coupon.used} 次</span>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1 lg:order-first">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2.5 border-b border-slate-50">行銷篩選</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">優惠券名稱</label>
                <input
                  type="text"
                  placeholder="搜尋優惠券名稱或代碼"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setActiveQuery(query); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button
                onClick={() => setActiveQuery(query)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 mr-1" /> 搜尋行銷
              </button>
              {activeQuery && (
                <button
                  onClick={() => { setQuery(''); setActiveQuery(''); }}
                  className="w-full text-slate-400 hover:text-slate-600 py-1.5 text-xs font-bold transition cursor-pointer"
                >
                  清除搜尋
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
