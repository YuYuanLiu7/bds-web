'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Receipt, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  Clock, 
  DollarSign, 
  BookOpen, 
  Award, 
  Loader2,
  FileCheck,
  HelpCircle,
  X
} from 'lucide-react';
import Image from 'next/image';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/finance/${orderId}`);
      const data = await res.json();

      if (res.ok) {
        setOrder(data);
      } else {
        setError(data.error || '無法取得訂單詳細資料');
      }
    } catch (err) {
      console.error(err);
      setError('連線發生錯誤，無法載入資料');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const formatTaiwanDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    const hr = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    return `${yr}年${mo}月${dy}日 ${hr}:${min}:${sec}`;
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700 max-w-4xl mx-auto">
      
      {/* Navigation Header */}
      <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
        <Link href="/admin/finance" className="hover:text-indigo-600 transition flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          返回交易紀錄
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-extrabold">訂單明細</span>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-slate-400 font-semibold text-sm">訂單明細載入中...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-6 rounded-2xl font-bold flex flex-col items-center justify-center space-y-2">
          <span className="text-lg">⚠️ 載入失敗</span>
          <span className="text-xs text-rose-500">{error}</span>
          <button 
            onClick={fetchOrderDetail} 
            className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-extrabold rounded-xl transition hover:bg-rose-700 shadow-sm"
          >
            重新嘗試
          </button>
        </div>
      ) : order ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Status Card Banner */}
          <div className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden ${
            order.status === 'paid' 
              ? 'bg-emerald-50/40 border-emerald-100 text-emerald-950' 
              : order.status === 'failed'
              ? 'bg-rose-50/40 border-rose-100 text-rose-950'
              : 'bg-amber-50/40 border-amber-100 text-amber-950'
          }`}>
            <div className="space-y-1 z-10">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">訂單流水號</div>
              <h2 className="text-base md:text-xl font-black font-mono uppercase">{order.id}</h2>
              <div className="text-xs text-slate-400 font-semibold mt-1">
                建立時間: {formatTaiwanDate(order.created_at)}
              </div>
            </div>

            <div className="flex items-center space-x-3 z-10">
              {order.status === 'paid' ? (
                <div className="flex items-center px-4 py-2 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20">
                  <FileCheck className="w-4 h-4 mr-1.5" />
                  已付款成功
                </div>
              ) : order.status === 'failed' ? (
                <div className="flex items-center px-4 py-2 rounded-2xl bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-500/20">
                  <X className="w-4 h-4 mr-1.5" />
                  交易失敗
                </div>
              ) : (
                <div className="flex items-center px-4 py-2 rounded-2xl bg-amber-500 text-white font-black text-xs shadow-md shadow-amber-500/20">
                  <Clock className="w-4 h-4 mr-1.5 animate-pulse" />
                  待付款中
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Main Billing Info */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Box 1: Purchased Items detail */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center border-b border-slate-50 pb-3">
                  <Receipt className="w-4 h-4 mr-1.5 text-slate-400" />
                  訂購項目 (Item Details)
                </h3>

                {order.courses ? (
                  /* Course Product Display */
                  <div className="flex items-start space-x-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="relative w-28 h-16.5 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                      <Image 
                        src={order.courses.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"}
                        alt={order.courses.title}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 font-extrabold text-[9px]">
                        付費線上課程
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug truncate">{order.courses.title}</h4>
                      <div className="text-[11px] text-slate-400 font-semibold">課程定價: NT$ {order.courses.price?.toLocaleString()}</div>
                    </div>
                  </div>
                ) : order.membershipPlan ? (
                  /* Membership Plan Product Display */
                  <div className="flex items-start space-x-4 p-4 bg-violet-50/40 rounded-2xl border border-violet-100">
                    <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="inline-flex px-2 py-0.5 rounded bg-violet-100 border border-violet-200 text-violet-700 font-extrabold text-[9px]">
                        會員方案：{order.membershipPlan.period}
                      </span>
                      <h4 className="font-black text-slate-800 text-sm leading-snug">{order.membershipPlan.title}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold line-clamp-1">{order.membershipPlan.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-bold">
                    無法獲取項目細節（可能課程/方案已於後台被移除）
                  </div>
                )}

                {/* Billing Summary rows */}
                <div className="space-y-3 pt-2 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>商品小計 (Subtotal)</span>
                    <span className="text-slate-800 font-bold">NT$ {order.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>優惠代碼折扣 (Discount)</span>
                    <span className="text-slate-400">- NT$ 0</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-slate-800">
                    <span className="flex items-center text-slate-600">
                      實收實付金額 (Total Paid)
                    </span>
                    <span className="text-emerald-600 text-base font-black">
                      NT$ {order.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Payment Details (PayUni parameters) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center border-b border-slate-50 pb-3">
                  <CreditCard className="w-4 h-4 mr-1.5 text-slate-400" />
                  金流交易明細 (PayUni Gateway)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400">唯一指定金流系統</div>
                    <div className="text-slate-800 font-black flex items-center">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 mr-1.5"></span>
                      PayUni (唯一金流)
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400">付款管道 (Payment Type)</div>
                    <div className="text-slate-800 font-black uppercase">
                      {order.payment_type === 'SIMULATED_TEST' ? '模拟支付 (SIMULATED TEST)' : (order.payment_type || '—')}
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-slate-50 pt-2 sm:border-0 sm:pt-0">
                    <div className="text-[10px] text-slate-400">交易流水號 (PayUni Trade No)</div>
                    <div className="text-slate-800 font-mono font-bold truncate">
                      {order.id}
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-slate-50 pt-2 sm:border-0 sm:pt-0">
                    <div className="text-[10px] text-slate-400">最後狀態更新時間 (Updated At)</div>
                    <div className="text-slate-800 font-semibold">
                      {formatTaiwanDate(order.updated_at)}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Column 3: Customer Details & Help Column */}
            <div className="space-y-6">
              
              {/* Box 3: Customer profile info */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center border-b border-slate-50 pb-3">
                  <User className="w-4 h-4 mr-1.5 text-slate-400" />
                  訂購學員資訊 (Customer)
                </h3>

                {order.users ? (
                  <div className="space-y-4 text-xs font-semibold text-slate-600">
                    {/* Customer name */}
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 font-bold">
                        {order.users.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">真實姓名</div>
                        <div className="text-slate-800 font-extrabold">{order.users.name || '學員'}</div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-slate-400">電子信箱</div>
                        <div className="text-slate-800 font-extrabold truncate">{order.users.email}</div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">聯絡電話</div>
                        <div className="text-slate-800 font-extrabold">{order.users.phone || '未填寫'}</div>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">後台角色</div>
                        <div className="text-slate-800 font-extrabold uppercase">{order.users.role || 'user'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-bold">
                    學員資料查無紀錄（可能該帳號已被刪除）
                  </div>
                )}
              </div>

              {/* Box 4: Administrative Help guidelines */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-2.5 flex items-center">
                  <HelpCircle className="w-4 h-4 mr-1.5 text-indigo-400 animate-pulse" />
                  管理員小指南
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  本筆訂單已完成付款驗證，學員目前應已成功獲得本項線上課程或會員訂閱的完整觀看權限。
                  您可以在**學員名冊**中搜尋該學員信箱以隨時核對其詳細存取權限。如有任何退款或爭議，請至 PayUni 測試平台進行後續退款註銷操作。
                </p>
              </div>

            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
}
