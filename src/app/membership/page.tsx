import { getSiteSettingsServer } from "@/lib/site-settings";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import MembershipList from "@/components/MembershipList";

export const revalidate = 0;

// Seed/Mock fallback data in case database is empty or not yet migrated
const SEED_PLANS = [
  { 
    id: '182000da-6fcd-4748-86df-e1f3b122a8c1', 
    title: 'BDS 產業升級訂閱制 - 月費方案', 
    price: 990, 
    period: '月繳',
    description: '適合想要按月體驗與小步快跑學習的業務新手。',
    is_popular: false,
    status: 'active' as const,
    features: [
      '暢讀所有產業觀察專欄文章',
      '每月解鎖 1 門新技術/產業講座課程',
      '專屬學員 Discord 行動社群交流',
      '享有數位模板 8 折專屬優惠'
    ]
  },
  { 
    id: '182000da-6fcd-4748-86df-e1f3b122a8c2', 
    title: 'BDS 產業升級訂閱制 - 年費極致方案', 
    price: 9500, 
    period: '年繳',
    description: '高性價比黃金選擇，最受中高階銷售 BD 與經理歡迎。',
    is_popular: true,
    status: 'active' as const,
    features: [
      '暢讀所有產業觀察專欄文章',
      '無限暢看全站所有線上產業/新手村課程',
      'VIP 線下沙龍實體小聚免費入場',
      '享數位模板 & 白皮書 5 折專屬折扣',
      '與業界前輩 1對1 生意談判諮詢 1 次'
    ]
  },
  { 
    id: '182000da-6fcd-4748-86df-e1f3b122a8c3', 
    title: 'BDS VIP 創始永久會員專案', 
    price: 25000, 
    period: '一次性',
    description: '專屬產業頂尖領袖與創始支持者的永久尊榮席次。',
    is_popular: false,
    status: 'active' as const,
    features: [
      '終身免費學習全站所有既有與未來新課程',
      '創始永久 VIP 社群核心通道',
      '所有數位資源、模板、白皮書終身免費下載',
      '與創辦團隊進行 1對1 生涯發展/談判輔導 3 次',
      '線下 VIP 晚宴尊崇受邀資格'
    ]
  }
];

export default async function MembershipPage() {
  const settings = await getSiteSettingsServer();
  const primaryColor = settings.primaryColor || '#21448e';

  // 1. Get current user session
  const session = await getServerSession(authOptions);

  // 2. Fetch the user's active membership details from DB
  let currentUserPlanId: string | null = null;
  if (session?.user?.email) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('membership_plan_id')
        .eq('email', session.user.email)
        .single();
      
      if (userData) {
        currentUserPlanId = userData.membership_plan_id;
      }
    } catch (err) {
      console.warn("Failed to query user membership status (DB columns might not be migrated yet):", err);
    }
  }

  // 3. Fetch active membership plans from Supabase
  let plans = [];
  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('status', 'active')
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      plans = data;
    } else {
      plans = SEED_PLANS;
    }
  } catch (err) {
    console.warn("Failed to query membership plans from DB, using fallback seeds:", err);
    plans = SEED_PLANS;
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-16 font-sans relative overflow-hidden">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[320px] left-[5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[580px] right-[5%] w-[550px] h-[550px] bg-amber-100/25 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      
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
      <div className="max-w-[1200px] mx-auto px-6 py-16 text-center relative z-10">
        
        {/* Title */}
        <div className="max-w-2xl mx-auto space-y-3 mb-16 select-none">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">開啟您的產業黃金職涯</h2>
          <p className="text-xs md:text-sm text-slate-600 font-bold leading-relaxed">
            我們提供彈性的付費訂閱與單次買斷方案。無論您是業務新手，還是資深商務開發專家，都能在這裡找到為您量身打造的專屬解法。
          </p>
        </div>

        {/* Dynamic Client-Side Subscription pricing table */}
        <MembershipList 
          plans={plans} 
          primaryColor={primaryColor} 
          session={session} 
          currentUserPlanId={currentUserPlanId} 
        />
      </div>

    </div>
  );
}
