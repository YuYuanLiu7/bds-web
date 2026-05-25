'use client';

import { useState } from 'react';
import { Award, Search, Plus, Users, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminMembershipPage() {
  const [plans, setPlans] = useState([
    { id: '1', title: 'BDS 產業升級訂閱制 - 月費方案', price: 'NT$ 990 / 月', subscribers: 35, status: 'active', period: '月繳' },
    { id: '2', title: 'BDS 產業升級訂閱制 - 年費極致方案', price: 'NT$ 9,500 / 年', subscribers: 120, status: 'active', period: '年繳' },
    { id: '3', title: 'BDS VIP 創始永久會員專案', price: 'NT$ 25,000 / 一次性', subscribers: 18, status: 'active', period: '一次性' }
  ]);

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <span className="material-symbols-outlined mr-2 text-indigo-600" style={{ fontSize: '26px' }}>award</span>
            會員方案
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">設計與管理不同層級的 VIP 會員方案、年繳/月費訂閱制服務。</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98">
          <Plus className="w-4 h-4 mr-1.5" /> 建立方案
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold">
            共 <span className="text-slate-700 font-extrabold">{plans.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{plans.length}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 h-12">
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">方案名稱</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">費用結構</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">付款週期 / 訂閱會員</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                          已啟動
                        </span>
                      </div>
                      <Link href={`/admin/membership/${plan.id}`} className="block font-bold text-blue-600 hover:text-blue-800 transition text-sm mt-1.5 leading-snug">
                        {plan.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-indigo-600 font-extrabold text-sm">
                      {plan.price}
                    </td>
                    <td className="px-6 py-4 space-y-1 text-slate-400 font-semibold text-xs">
                      <div className="flex items-center text-slate-500">
                        {plan.period}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        已加入會員: <span className="text-slate-600 font-bold ml-1">{plan.subscribers} 人</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1 lg:order-first">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2.5 border-b border-slate-50">方案篩選</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">方案名稱</label>
                <input 
                  type="text" 
                  placeholder="搜尋方案名稱"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer">
                <Search className="w-3.5 h-3.5 mr-1" /> 搜尋方案
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
