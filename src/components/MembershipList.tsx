'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
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

  const handleSubscribe = async (plan: MembershipPlan) => {
    // 1. 檢查使用者登入狀態
    if (!session || !session.user) {
      alert('🔒 請先登入會員以訂閱此方案！');
      router.push(`/login?callbackUrl=/membership`);
      return;
    }

    setLoadingPlanId(plan.id);

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
      form.action = 'https://sandbox-api.payuni.com.tw/api/upp'; // Sandbox URL

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
      alert('❌ 結帳金流初始化失敗，請聯絡客服人員。');
    } finally {
      setLoadingPlanId(null);
    }
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
            className={`bg-white rounded-3xl p-8 border flex flex-col justify-between relative transition duration-300 text-left ${
              plan.is_popular 
                ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20 scale-100 lg:scale-[1.03] z-10' 
                : 'border-slate-100 hover:border-slate-200 shadow-xs'
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
              <div className="space-y-1 select-none">
                <h3 className="text-lg font-black text-slate-950">{plan.title}</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">{plan.description}</p>
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
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">方案包含權益：</h4>
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
    </div>
  );
}
