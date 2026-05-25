'use client';

import { useState, useEffect } from 'react';
import { Receipt, DollarSign, Clock, CheckCircle, XCircle, ArrowLeft, Search, Download } from 'lucide-react';
import Link from 'next/link';

export default function AdminFinancePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search Filters State
  const [searchTradeNo, setSearchTradeNo] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchAffiliate, setSearchAffiliate] = useState('');
  const [statusPaid, setStatusPaid] = useState(true);
  const [statusUnpaid, setStatusUnpaid] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/finance');
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setOrders(data);
        setFilteredOrders(data);
      } else {
        setError(data.error || '無法取得財務訂單資料');
      }
    } catch (err) {
      console.error(err);
      setError('連線發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let result = [...orders];

    if (searchTradeNo.trim()) {
      result = result.filter(o => o.id?.toLowerCase().includes(searchTradeNo.toLowerCase()));
    }
    if (searchCustomer.trim()) {
      const query = searchCustomer.toLowerCase();
      result = result.filter(o => 
        o.users?.name?.toLowerCase().includes(query) || 
        o.users?.email?.toLowerCase().includes(query)
      );
    }
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(o => new Date(o.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.created_at) <= end);
    }
    if (searchAffiliate.trim()) {
      // If affiliate system is modeled, otherwise ignore
    }

    // Status Filter
    result = result.filter(o => {
      if (o.status === 'paid' && statusPaid) return true;
      if (o.status === 'pending' && statusUnpaid) return true;
      if (o.status === 'failed') return true; // Failures are displayed
      return false;
    });

    setFilteredOrders(result);
  };

  const handleReset = () => {
    setSearchTradeNo('');
    setSearchCustomer('');
    setStartDate('');
    setEndDate('');
    setSearchAffiliate('');
    setStatusPaid(true);
    setStatusUnpaid(true);
    setFilteredOrders(orders);
  };

  const formatTaiwanDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    const hr = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yr}年${mo}月${dy}日 ${hr}:${min}`;
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <span className="material-symbols-outlined mr-2 text-indigo-600" style={{ fontSize: '26px' }}>payments</span>
            交易紀錄
          </h1>
        </div>
        
        {/* Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 bg-white text-xs font-bold transition shadow-sm">
            <span className="material-symbols-outlined mr-1.5" style={{ fontSize: '16px' }}>download</span>
            匯出所有訂單 (CSV)
          </button>
          <button className="flex items-center px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 bg-white text-xs font-bold transition shadow-sm">
            <span className="material-symbols-outlined mr-1.5" style={{ fontSize: '16px' }}>download</span>
            Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-xl font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* Advanced Filter Form - Horizontal layout at top */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">進階篩選</h3>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Trade No */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">訂單編號</label>
              <input 
                type="text" 
                value={searchTradeNo}
                onChange={(e) => setSearchTradeNo(e.target.value)}
                placeholder="搜尋訂單編號"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </div>

            {/* Customer info */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">客戶信箱/姓名</label>
              <input 
                type="text" 
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                placeholder="example@teachify.net"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">付款時間-開始日期</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">付款時間-結束日期</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </div>

            {/* Affiliate Code */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">導購代碼</label>
              <input 
                type="text" 
                value={searchAffiliate}
                onChange={(e) => setSearchAffiliate(e.target.value)}
                placeholder="輸入導購代碼"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-4 border-t border-slate-50">
            {/* Status Checkboxes */}
            <div className="flex items-center space-x-6">
              <span className="text-xs font-bold text-slate-500">付款狀態</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={statusUnpaid}
                    onChange={(e) => setStatusUnpaid(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mr-2"
                  />
                  未付款
                </label>
                <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={statusPaid}
                    onChange={(e) => setStatusPaid(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mr-2"
                  />
                  已付款
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button 
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 font-bold text-xs transition cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                重設篩選
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer active:scale-95 w-full sm:w-auto flex items-center justify-center"
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                套用篩選
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Item Count row */}
      <div className="text-xs text-slate-400 font-bold">
        共 <span className="text-slate-700 font-extrabold">{filteredOrders.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{Math.min(25, filteredOrders.length)}</span>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 h-12">
                <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">狀態</th>
                <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">訂單編號</th>
                <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">付款時間</th>
                <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">顧客名稱 / 帳號</th>
                <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/5">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400 font-semibold text-sm">
                    訂單資料載入中...
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition odd:bg-white even:bg-slate-50/20">
                    <td className="px-6 py-4 text-center">
                      {order.status === 'paid' ? (
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[11px]">
                          已付款
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-400 font-bold text-[11px]">
                          未付款
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/admin/finance/${order.id}`}
                        className="font-bold text-blue-600 hover:text-blue-800 transition text-[13px] font-mono uppercase"
                      >
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold text-xs">
                      {formatTaiwanDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm">
                        {order.users?.name || '未知學員'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {order.users?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-800 text-sm">
                      NT$ {order.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400 italic text-sm">
                    查無符合篩選條件的交易訂單。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
