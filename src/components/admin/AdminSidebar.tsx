'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { 
  Gauge, 
  BookOpen, 
  Calendar, 
  FileText, 
  Download, 
  Award, 
  Megaphone, 
  Users, 
  MessageSquare, 
  Receipt, 
  FileCode, 
  Settings, 
  FolderOpen,
  Sliders,
  Grid,
  Code,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
}

export default function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menuGroups = [
    {
      items: [
        { name: '儀表板', href: '/admin', icon: Gauge }
      ]
    },
    {
      title: '產品',
      items: [
        { name: '課程', href: '/admin/courses', icon: BookOpen },
        { name: '活動', href: '/admin/events', icon: Calendar },
        { name: '文章', href: '/admin/articles', icon: FileText },
        { name: '數位下載', href: '/admin/downloads', icon: Download },
        { name: '會員方案', href: '/admin/membership', icon: Award }
      ]
    },
    {
      title: '營運',
      items: [
        { name: '行銷', href: '/admin/marketing', icon: Megaphone },
        { name: '成員', href: '/admin/students', icon: Users },
        { name: '留言', href: '/admin/comments', icon: MessageSquare },
        { name: '財務 & 訂單', href: '/admin/finance', icon: Receipt }
      ]
    },
    {
      title: '網站',
      items: [
        { name: '頁面', href: '/admin/pages', icon: FileCode },
        { name: '設定', href: '/admin/settings', icon: Settings }
      ]
    },
    {
      title: '資源',
      items: [
        { name: '媒體素材庫', href: '/admin/assets', icon: FolderOpen }
      ]
    }
  ];

  const bottomItems = [
    { name: '全站設定', href: '/admin/global-settings', icon: Sliders },
    { name: '第三方整合', href: '/admin/integrations', icon: Grid },
    { name: '開發者', href: '/admin/developer', icon: Code }
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white flex flex-col h-screen border-r border-slate-100 select-none z-30">
      {/* Brand Header / Workspace Switcher */}
      <div className="relative">
        <div 
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="h-16 px-5 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-extrabold text-white text-base">
              B
            </div>
            <span className="font-bold text-slate-800 text-[15px]">BDS</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        {showWorkspaceMenu && (
          <div className="absolute top-14 left-4 right-4 bg-white border border-slate-100 rounded-xl shadow-lg p-2 z-50">
            <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase">切換工作區</div>
            <button className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg">
              BDS By Doing So
            </button>
            <div className="border-t border-slate-100 my-1.5"></div>
            <button className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg">
              + 建立新工作區
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.title && (
              <div className="text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider pb-1">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition group ${
                      active 
                        ? 'bg-slate-100 text-slate-900 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`w-4.5 h-4.5 mr-3 transition ${
                      active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-slate-100 my-4"></div>

        {/* Bottom items inside navigation scrollable area */}
        <div className="space-y-0.5">
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition group ${
                  active 
                    ? 'bg-slate-100 text-slate-900 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 mr-3 transition ${
                  active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Profile Dropdown */}
      <div className="relative border-t border-slate-100 p-4 bg-white">
        <div 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-slate-50 rounded-xl transition"
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-[14px] flex-shrink-0">
              {userName?.charAt(0) || 'B'}
            </div>
            <div className="text-left overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate">{userName || 'BDS Admin'}</div>
              <div className="text-[10px] text-slate-400 truncate">學員 / 講師 / 網站擁...</div>
            </div>
          </div>
          <ChevronDown className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
        </div>

        {showProfileMenu && (
          <div className="absolute bottom-16 left-4 right-4 bg-white border border-slate-100 rounded-xl shadow-lg p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2">
              <div className="text-xs font-bold text-slate-800">{userName}</div>
              <div className="text-[10px] text-slate-500 truncate">{userEmail}</div>
            </div>
            <div className="border-t border-slate-100 my-1"></div>
            <Link 
              href="/" 
              className="flex items-center w-full px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition"
            >
              返回網站前台
            </Link>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              安全登出後台
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
