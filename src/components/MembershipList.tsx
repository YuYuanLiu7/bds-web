'use client';

import { useState } from 'react';
import { Check, Sparkles, CreditCard, X, ShieldCheck, AlertCircle, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MembershipPlan {
  id: string;
  title: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  is_popular: boolean;
  status: 'active' | 'draft';
}

interface MembershipListProps {
  plans: MembershipPlan[];
  primaryColor: string;
  session: any;
  currentUserPlanId: string | null;
}

export default function MembershipList({ plans, primaryColor, session, currentUserPlanId }: MembershipListProps) {
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  // 測試金流模擬器狀態
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simulatingPlan, setSimulatingPlan] = useState<MembershipPlan | null>(null);
  const [simulateLoading, setSimulateLoading] = useState(false);

  const handleSubscribe = async (plan: MembershipPlan) => {
    // 1. 檢查使用者登入狀態
    if (!session || !session.user) {
      alert('🔒 請先登入會員以訂閱此方案！');
      router.push(`/login?callbackUrl=/membership`);
      return;
    }

    // 正式環境不提供模擬付款，直接走真實金流；僅開發/測試環境顯示沙盒選擇視窗
    if (process.env.NODE_ENV === 'production') {
      executeRealPayUni(plan);
      return;
    }

    // 啟動測試沙盒選擇視窗，提供模擬一鍵支付或真實 Sandbox 跳轉
    setSimulatingPlan(plan);
    setShowSimulateModal(true);
  };

  // 執行真實金流跳轉 (PayUni Sandbox Mode)
  const executeRealPayUni = async (plan: MembershipPlan) => {
    setLoadingPlanId(plan.id);
    setShowSimulateModal(false);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.title,
          amount: plan.price,
          type: 'membership'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch checkout parameters');
      }

      const params = await response.json();

      // Create a hidden form and submit it to PayUni (UPP)
      const form = document.createElement('form');
      form.method = 'POST';
      // UPP 端點由環境變數決定，正式上線設定 NEXT_PUBLIC_PAYUNI_UPP_URL 即可，無需改程式碼
      form.action = process.env.NEXT_PUBLIC_PAYUNI_UPP_URL || 'https://sandbox-api.payuni.com.tw/api/upp';

      Object.keys(params).forEach((key) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Membership checkout failed:', error);
      alert('❌ 結帳金流初始化失敗，請確保您的 .env.local 已填入正確的 PayUni 測試密鑰。');
    } finally {
      setLoadingPlanId(null);
    }
  };

  // 執行一鍵支付模擬 (繞過金流，直接在後台安全開通權限)
  const executeSimulatedPayment = async (plan: MembershipPlan) => {
    setSimulateLoading(true);
    try {
      const response = await fetch('/api/checkout/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.title,
          price: plan.price,
          period: plan.period
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert(data.message || '🎉 方案模擬支付成功！');
        setShowSimulateModal(false);
        // 刷新頁面，讓 React Server Component 重新讀取最新的訂閱狀態
        window.location.reload();
      } else {
        alert(`❌ 模擬支付失敗：${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ 模擬支付發生錯誤：${error.message}`);
    } finally {
      setSimulateLoading(false);
    }
  };

  // 模擬付款失敗
  const executeFailedPayment = () => {
    alert('❌ 模擬交易失敗（錯誤碼: E0048，卡片餘額不足或授權遭拒）。已取消訂閱。');
    setShowSimulateModal(false);
  };

  return (
    <div 
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch"
      style={{ '--primary-color': primaryColor } as React.CSSProperties}
    >
      {plans.map((plan) => {
        const isCurrentPlan = currentUserPlanId === plan.id;
        const isLoading = loadingPlanId === plan.id;

        // Dynamic price font color/gradient based on price level
        let priceStyleClass = "text-slate-950"; // default
        if (plan.price >= 20000) {
          // Extremely premium gold gradient for the lifetime plan (NT$ 25,000+)
          priceStyleClass = "bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-500 bg-clip-text text-transparent";
        } else if (plan.price >= 5000) {
          // High-end brand-indigo gradient for the annual plan (NT$ 9,500)
          priceStyleClass = "bg-gradient-to-r from-[var(--primary-color,#21448e)] to-indigo-600 bg-clip-text text-transparent";
        }

        return (
          <div 
            key={plan.id}
            className={`rounded-3xl p-8 border flex flex-col justify-between relative transition-all duration-300 text-left hover:-translate-y-1.5 ${
              plan.is_popular 
                ? 'border-indigo-500/80 bg-white/95 backdrop-blur-md shadow-lg hover:shadow-2xl ring-1 ring-indigo-500/20 scale-100 lg:scale-[1.03] z-10' 
                : 'border-slate-200/70 bg-white/90 backdrop-blur-md shadow-sm hover:shadow-xl hover:border-slate-300'
            }`}
          >
            {plan.is_popular && (
              <span 
                style={{ backgroundColor: primaryColor }}
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center shadow-xs select-none"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> 最受歡迎方案
              </span>
            )}

            <div className="space-y-6">
              {/* Plan Header */}
              <div className="space-y-1.5 select-none">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{plan.title}</h3>
                <p className="text-xs text-slate-700 font-bold leading-relaxed">{plan.description}</p>
              </div>

              {/* Price Display */}
              <div className="flex items-baseline py-4 border-t border-b border-slate-100 select-none">
                <span className="text-sm font-black text-slate-500 mr-1.5">NT$</span>
                <span className={`text-4xl font-black tracking-tight ${priceStyleClass}`}>
                  {plan.price.toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-slate-500 ml-1.5">/ {plan.period}</span>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest select-none">方案包含權益：</h4>
                <ul className="space-y-2.5 text-xs text-slate-700 font-bold leading-relaxed">
                  {plan.features && plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start">
                      <Check className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-8 select-none">
              <button 
                disabled={isCurrentPlan || isLoading}
                onClick={() => handleSubscribe(plan)}
                style={{ 
                  backgroundColor: isCurrentPlan 
                    ? '#F1F5F9' 
                    : primaryColor,
                  color: isCurrentPlan 
                    ? '#94A3B8' 
                    : '#ffffff',
                  borderColor: isCurrentPlan 
                    ? '#E2E8F0' 
                    : 'transparent'
                }}
                className={`w-full py-3.5 rounded-2xl font-black text-xs transition duration-200 border text-center shadow-xs active:scale-95 cursor-pointer disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current mr-2"></span>
                    付款引導中...
                  </span>
                ) : (
                  isCurrentPlan ? '您的當前方案' : (session ? '立即訂閱此方案' : '登入以訂閱方案')
                )}
              </button>
            </div>

          </div>
        );
      })}

      {/* BDS 測試沙盒金流模擬器彈窗 */}
      {showSimulateModal && simulatingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 mr-1" /> BDS 金流測試沙盒 (Sandbox)
              </span>
              <button 
                onClick={() => setShowSimulateModal(false)} 
                className="p-1.5 hover:bg-slate-200 rounded-full transition text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              
              <div className="space-y-1 select-none">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">您正在訂閱會員方案：</span>
                <h3 className="text-base font-black text-slate-900 leading-snug">{simulatingPlan.title}</h3>
                <div className="text-sm font-black text-indigo-600 mt-1">NT$ {simulatingPlan.price.toLocaleString()} / {simulatingPlan.period}</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2 select-none">
                <div className="text-xs font-black text-slate-800 flex items-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1.5 shrink-0" />
                  目前偵測為開發測試環境
                </div>
                <p className="text-[10px] font-semibold text-slate-400 leading-normal">
                  系統偵測到您在開發環境。您可以點選下方按鈕進行「一鍵模擬支付」秒速開通，或是嘗試呼叫 PayUni 真實沙盒跳轉網頁。
                </p>
              </div>

              {/* Simulation Options */}
              <div className="space-y-2.5">
                <button
                  disabled={simulateLoading}
                  onClick={() => executeSimulatedPayment(simulatingPlan)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {simulateLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></span>
                      正在開通帳戶權限...
                    </span>
                  ) : (
                    '🟢 模擬一鍵刷卡成功 (推薦)'
                  )}
                </button>

                <button
                  disabled={simulateLoading}
                  onClick={() => executeRealPayUni(simulatingPlan)}
                  className="w-full py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition flex items-center justify-center cursor-pointer active:scale-98"
                >
                  🔵 嘗試呼叫 PayUni 金流跳轉 (需配置密鑰)
                </button>

                <button
                  disabled={simulateLoading}
                  onClick={executeFailedPayment}
                  className="w-full py-3 border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-xl font-bold text-xs transition flex items-center justify-center cursor-pointer active:scale-98"
                >
                  🔴 模擬刷卡失敗
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end select-none">
              <button
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                關閉
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
