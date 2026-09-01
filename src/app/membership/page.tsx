import { getSiteSettingsServer } from "@/lib/site-settings";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { getMembershipStatus } from "@/lib/entitlements";
import { supabase } from "@/lib/supabase";
import MembershipList from "@/components/MembershipList";
import HeroSheen from "@/components/HeroSheen";

export const revalidate = 0;

export const metadata = {
  title: "會員方案",
  description: "訂閱 BDS 會員方案，暢讀產業觀察專欄、解鎖線上課程與專屬社群資源。",
};

export default async function MembershipPage() {
  const settings = await getSiteSettingsServer();
  const primaryColor = settings.primaryColor || '#21448e';

  // 1. Get current user session
  const session = await getServerSession(authOptions);

  // 2. 查詢使用者的會員狀態：只有「未過期」的方案才視為目前方案
  //    （修正：先前只看 membership_plan_id、未檢查到期日，導致過期會員仍被當作有效）
  let currentUserPlanId: string | null = null;
  const sessionUserId = (session?.user as SessionUser | undefined)?.id;
  if (sessionUserId) {
    try {
      const status = await getMembershipStatus(sessionUserId);
      currentUserPlanId = status.active ? status.planId : null;
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
    }
    // 查無資料時維持空陣列，改顯示「目前尚無開放中的方案」，不以無法購買的種子方案冒充可訂閱方案
  } catch (err) {
    console.error("查詢會員方案失敗：", err);
    plans = [];
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16 font-sans relative overflow-hidden">

      {/* Header */}
      <div
        style={{ backgroundColor: primaryColor }}
        className="w-full text-white py-16 px-6 relative overflow-hidden select-none"
      >
        <HeroSheen />
        <div className="max-w-[1200px] mx-auto space-y-4 relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg transition duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 回首頁
          </Link>
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-white/50 block">專屬學習訂閱制方案</span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">會員方案</h1>
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
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">開啟您的產業黃金職涯</h2>
          <p className="text-xs md:text-sm text-slate-600 font-bold leading-relaxed">
            我們提供彈性的付費訂閱與單次買斷方案。無論您是業務新手，還是資深商務開發專家，都能在這裡找到為您量身打造的專屬解法。
          </p>
        </div>

        {/* Dynamic Client-Side Subscription pricing table */}
        {plans.length > 0 ? (
          <MembershipList
            plans={plans}
            primaryColor={primaryColor}
            session={session}
            currentUserPlanId={currentUserPlanId}
          />
        ) : (
          <div className="max-w-xl mx-auto py-20 text-center text-slate-400 italic font-semibold select-none bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
            目前尚無開放中的方案，敬請期待！
          </div>
        )}
      </div>

    </div>
  );
}
