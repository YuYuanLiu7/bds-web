import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  // 直接從資料庫抓取最新的 Role，避免 Session 同步延遲
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single();

  if (!userData || userData.role !== 'admin') {
    console.log("Access denied: User is not an admin", session.user.email);
    redirect('/');
  }

  const userName = userData.name || session.user.name || "BDS Admin";
  const userEmail = userData.email || session.user.email || "";

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans antialiased text-slate-800">
      {/* Dynamic Teachify-style Sidebar */}
      <AdminSidebar userName={userName} userEmail={userEmail} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Teachify-style Top Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between pl-16 pr-4 lg:px-8 z-20 flex-shrink-0 select-none">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-slate-400 font-medium">管理後台</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">儀表板</span>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-4 lg:space-x-6 text-sm">
            <Link href="/admin/rewards" className="hidden lg:inline text-slate-500 hover:text-slate-900 font-medium transition">
              推薦獎勵
            </Link>
            <Link href="/admin/help" className="hidden lg:inline text-slate-500 hover:text-slate-900 font-medium transition">
              幫助中心
            </Link>
            <Link href="/admin/news" className="hidden lg:inline text-slate-500 hover:text-slate-900 font-medium transition">
              產品新訊
            </Link>
            
            {/* Separator */}
            <div className="h-4 w-px bg-slate-200"></div>

            {/* Website Frontend Link */}
            <Link 
              href="/"
              target="_blank"
              className="text-slate-600 hover:text-slate-950 font-bold hover:underline transition"
            >
              網站前台 ↗
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
