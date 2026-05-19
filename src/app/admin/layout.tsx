import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Bell,
  Search,
  User
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // 直接從資料庫抓取最新的 Role，避免 Session 同步延遲
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single();

  if (!userData || userData.role !== 'admin') {
    console.log("Access denied: User is not an admin", session.user.email);
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar - Same as before but with verified access */}
      <aside className="w-64 bg-[#1E293B] flex flex-col shadow-xl z-20">
        <div className="p-6">
          <Link href="/admin" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">B</div>
            <span className="text-xl font-bold text-white tracking-tight">BDS Admin</span>
          </Link>
        </div>
        
        <div className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          主要功能
        </div>
        
        <nav className="flex-1 px-2 space-y-1">
          <Link href="/admin" className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition group">
            <LayoutDashboard className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100" />
            首頁總覽
          </Link>
          <Link href="/admin/courses" className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition group">
            <BookOpen className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100" />
            課程管理
          </Link>
          <Link href="/admin/users" className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition group">
            <Users className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100" />
            學員管理
          </Link>
          <Link href="/admin/orders" className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition group">
            <CreditCard className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100" />
            訂單與金流
          </Link>
        </nav>

        <div className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          系統設定
        </div>
        
        <nav className="px-2 pb-6 space-y-1">
          <Link href="/admin/settings" className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition group">
            <Settings className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100" />
            網站設定
          </Link>
          <Link href="/" className="flex items-center px-4 py-3 text-slate-400 hover:text-white transition group">
            <LogOut className="w-5 h-5 mr-3" />
            返回前台
          </Link>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="relative w-96">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input 
              type="text" 
              placeholder="搜尋課程、訂單或學員..." 
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{session?.user?.name || 'Admin'}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-tighter">系統管理員</div>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <User className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
