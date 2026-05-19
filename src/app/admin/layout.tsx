import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, Settings, LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // 安全檢查：只有管理員可以進入
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link href="/admin" className="text-xl font-bold text-blue-600 flex items-center">
            BDS <span className="ml-2 text-gray-900 text-sm">管理後台</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition group">
            <LayoutDashboard className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600" />
            總覽
          </Link>
          <Link href="/admin/courses" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition group">
            <BookOpen className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600" />
            課程管理
          </Link>
          <Link href="/admin/users" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition group">
            <Users className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600" />
            會員清單
          </Link>
          <Link href="/admin/settings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition group">
            <Settings className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600" />
            系統設定
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Link href="/" className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition">
            <LogOut className="w-5 h-5 mr-3" />
            返回前台
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
