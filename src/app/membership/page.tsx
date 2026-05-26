import { getSiteSettingsServer } from "@/lib/site-settings";
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

export const revalidate = 0;

export default async function MembershipPage() {
  const settings = await getSiteSettingsServer();
  const primaryColor = settings.primaryColor || '#21448e';

  // Synchronized with admin mock data
  const plans = [
    { 
      id: '1', 
      title: 'BDS 產業升級訂閱制 - 月費方案', 
      price: '990', 
      period: '月繳',
      desc: '適合想要按月體驗與小步快跑學習的業務新手。',
      popular: false,
      features: [
        '暢讀所有產業觀察專欄文章',
        '每月解鎖 1 門新技術/產業講座課程',
        '專屬學員 Discord 行動社群交流',
        '享有數位模板 8 折專屬優惠'
      ]
    },
    { 
      id: '2', 
      title: 'BDS 產業升級訂閱制 - 年費極致方案', 
      price: '9,500', 
      period: '年繳',
      desc: '高性價比黃金選擇，最受中高階銷售 BD 與經理歡迎。',
      popular: true,
      features: [
        '暢讀所有產業觀察專欄文章',
        '無限暢看全站所有線上產業/新手村課程',
        'VIP 線下沙龍實體小聚免費入場',
        '享數位模板 & 白皮書 5 折專屬折扣',
        '與業界前輩 1對1 生意談判諮詢 1 次'
      ]
    },
    { 
      id: '3', 
      title: 'BDS VIP 創始永久會員專案', 
      price: '25,000', 
      period: '一次性',
      desc: '專屬產業頂尖領袖與創始支持者的永久尊榮席次。',
      popular: false,
      features: [
        '終身免費學習全站所有既有與未來新課程',
        '創始永久 VIP 社群核心通道',
        '所有數位資源、模板、白皮書終身免費下載',
        '與創辦團隊進行 1對1 生涯發展/談判輔導 3 次',
        '線下 VIP 晚宴尊崇受邀資格'
      ]
    }
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen pb-16 font-sans">
      
      {/* Header */}
      <div 
        style={{ backgroundColor: primaryColor }}
        className="w-full text-white py-16 px-6 relative overflow-hidden select-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto space-y-4 relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 回首頁
          </Link>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">專屬學習訂閱制方案</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">會員方案</h1>
            <p className="text-white/70 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
              選擇適合您的學習與訂閱方案，解鎖全站精選硬體、半導體與醫材產業實戰課程，為您的職涯躍升持續賦能。
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
        
        {/* Title */}
        <div className="max-w-2xl mx-auto space-y-3 mb-16 select-none">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800">開啟您的產業黃金職涯</h2>
          <p className="text-xs md:text-sm text-slate-400 font-semibold leading-relaxed">
            我們提供彈性的付費訂閱與單次買斷方案。無論您是業務新手，還是資深商務開發專家，都能在這裡找到為您量身打造的專屬解法。
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`bg-white rounded-3xl p-8 border flex flex-col justify-between relative transition duration-300 text-left ${
                plan.popular 
                  ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20 scale-100 lg:scale-[1.03] z-10' 
                  : 'border-slate-100 hover:border-slate-200 shadow-xs'
              }`}
            >
              {plan.popular && (
                <span 
                  style={{ backgroundColor: primaryColor }}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center shadow-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> 最受歡迎方案
                </span>
              )}

              <div className="space-y-6">
                {/* Plan Header */}
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-800">{plan.title}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{plan.desc}</p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline py-4 border-t border-b border-slate-50 select-none">
                  <span className="text-sm font-black text-slate-400 mr-1.5">NT$</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tight">{plan.price}</span>
                  <span className="text-xs font-extrabold text-slate-400 ml-1.5">/ {plan.period}</span>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">方案包含權益：</h4>
                  <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                    {plan.features.map((feat, fIdx) => (
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
                  style={{ 
                    backgroundColor: plan.popular ? primaryColor : '#F8FAFC',
                    color: plan.popular ? '#ffffff' : '#475569',
                    borderColor: plan.popular ? 'transparent' : '#E2E8F0'
                  }}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition duration-200 border text-center shadow-xs active:scale-95 cursor-pointer`}
                >
                  立即選購該方案
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
