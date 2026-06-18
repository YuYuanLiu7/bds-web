'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/components/SettingsProvider';
import {
  ChevronDown,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { visual, announcements } = useSettings();
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileCourseDropdown, setShowMobileCourseDropdown] = useState(false);

  // 視覺設定與公告改由 Context（root layout 伺服器端取一次）提供，不再每頁各自 fetch
  const logoUrl = visual.logoUrl || '';
  const primaryColor = visual.primaryColor || '#21448e';
  const slogan = visual.slogan || '業務不是超人，卻有超能力！';
  const announcement = announcements.find((a) => a.status === 'published') || null;

  const [dismissed, setDismissed] = useState(false);

  // 後台路徑不渲染前台 Navbar；置於所有 hooks 之後以符合 React Hooks 規則
  // （避免 admin↔前台切換時 hooks 數量改變而擲出執行期錯誤）
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'BDS 會員';
  // next-auth 預設 user 型別不含 role，於此以擴充型別讀取（後端已於 session callback 注入）
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';

  return (
    <>
      {announcement && !dismissed && (
        <div 
          style={{ backgroundColor: primaryColor }}
          className="text-white text-[11px] md:text-xs font-bold py-2 px-6 flex items-center justify-between select-none relative z-[1001] animate-in slide-in-from-top duration-200"
        >
          <div className="flex-1 text-center truncate pr-6">
            {announcement.url ? (
              <Link href={announcement.url} className="hover:underline flex items-center justify-center space-x-1.5">
                <span>{announcement.content}</span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-black">點此查看 ↗</span>
              </Link>
            ) : (
              <span>{announcement.content}</span>
            )}
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-4 p-1 hover:bg-white/10 rounded transition cursor-pointer"
            title="關閉公告"
            aria-label="關閉公告"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <nav className="sticky top-0 bg-white border-b border-slate-100 z-[1000] shadow-xs select-none">
        <div className="max-w-[1200px] mx-auto h-16 md:h-20 px-6 flex items-center justify-between">
        
        {/* Left: Brand Logo & Slogan */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="BDS" 
                className="h-10 md:h-12 w-auto object-contain"
              />
            ) : (
              <span className="text-xl md:text-2xl font-black tracking-wider text-[var(--brand)]">BDS</span>
            )}
          </Link>
          <div className="hidden lg:block h-4 w-px bg-slate-200"></div>
          <span className="hidden lg:block text-xs font-semibold text-slate-400">
            {slogan}
          </span>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold">
          <Link href="/courses" className="text-slate-500 hover:text-slate-900 transition">
            所有課程
          </Link>
          
          {/* Courses Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setShowCourseDropdown(true)}
            onMouseLeave={() => setShowCourseDropdown(false)}
          >
            <button className="text-slate-500 hover:text-slate-900 transition flex items-center focus:outline-none">
              課程 <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </button>
            {showCourseDropdown && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white border border-slate-100 rounded-xl shadow-lg p-2 w-48 z-[2000] animate-in fade-in slide-in-from-top-1 duration-150">
                <Link href="/categories/novice" className="block px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
                  業務新手村
                </Link>
                <Link href="/categories/industry" className="block px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
                  線上產業講座
                </Link>
                <Link href="/categories/job" className="block px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
                  職場升級三部曲
                </Link>
                <Link href="/categories/bookclub" className="block px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
                  讀書會
                </Link>
                <Link href="/categories/fireside" className="block px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
                  爐邊對談
                </Link>
              </div>
            )}
          </div>

          <Link href="/events" className="text-slate-500 hover:text-slate-900 transition">
            活動
          </Link>
          <Link href="/articles" className="text-slate-500 hover:text-slate-900 transition">
            文章
          </Link>
          <Link href="/downloads" className="text-slate-500 hover:text-slate-900 transition">
            資源
          </Link>
          <Link href="/membership" className="text-slate-500 hover:text-slate-900 transition">
            會員方案
          </Link>
          <Link href="/help" className="text-slate-500 hover:text-slate-900 transition">
            常見問答
          </Link>
        </nav>

        {/* Right: Desktop Auth Actions (Dynamic Session Handling) */}
        <div className="hidden md:flex items-center space-x-3 text-sm">
          {session ? (
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-slate-500 flex items-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Hi, {userName}
              </span>
              <Link 
                href={isAdmin ? "/admin" : "/courses"} 
                style={{ background: primaryColor }}
                className="text-white px-5 py-2.5 rounded-xl font-bold transition shadow-xs hover:opacity-90 active:scale-95 flex items-center"
              >
                <User className="w-4 h-4 mr-1.5" /> 
                {isAdmin ? "管理後台 ↗" : "我的學習"}
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-slate-400 hover:text-red-500 font-bold transition flex items-center cursor-pointer border border-transparent hover:border-red-100 rounded-lg px-2 py-1.5"
              >
                <LogOut className="w-4 h-4 mr-1" /> 登出
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link 
                href="/login" 
                className="text-slate-500 hover:text-slate-900 font-bold px-4 py-2.5 rounded-xl transition hover:bg-slate-50"
              >
                登入
              </Link>
              <Link 
                href="/signup" 
                style={{ background: primaryColor }}
                className="text-white px-6 py-2.5 rounded-xl font-bold transition shadow-xs hover:opacity-90 active:scale-95 text-center block"
              >
                註冊
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Icon Toggle */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 transition focus:outline-none"
          aria-label={showMobileMenu ? '關閉選單' : '開啟選單'}
          aria-expanded={showMobileMenu}
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Sidebar/Drawer Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          <Link href="/courses" className="block text-slate-600 hover:text-slate-900 font-bold">
            所有課程
          </Link>
          
          <div className="space-y-2">
            <button 
              onClick={() => setShowMobileCourseDropdown(!showMobileCourseDropdown)}
              className="w-full text-left text-slate-600 hover:text-slate-900 font-bold flex items-center justify-between focus:outline-none"
            >
              課程 <ChevronDown className={`w-4 h-4 transform transition ${showMobileCourseDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showMobileCourseDropdown && (
              <div className="pl-4 space-y-2 border-l border-slate-100">
                <Link href="/categories/novice" className="block text-xs font-semibold text-slate-500 hover:text-slate-900 py-1">業務新手村</Link>
                <Link href="/categories/industry" className="block text-xs font-semibold text-slate-500 hover:text-slate-900 py-1">線上產業講座</Link>
                <Link href="/categories/job" className="block text-xs font-semibold text-slate-500 hover:text-slate-900 py-1">職場升級三部曲</Link>
                <Link href="/categories/bookclub" className="block text-xs font-semibold text-slate-500 hover:text-slate-900 py-1">讀書會</Link>
                <Link href="/categories/fireside" className="block text-xs font-semibold text-slate-500 hover:text-slate-900 py-1">爐邊對談</Link>
              </div>
            )}
          </div>

          <Link href="/events" className="block text-slate-600 hover:text-slate-900 font-bold">活動</Link>
          <Link href="/articles" className="block text-slate-600 hover:text-slate-900 font-bold">文章</Link>
          <Link href="/downloads" className="block text-slate-600 hover:text-slate-900 font-bold">資源</Link>
          <Link href="/membership" className="block text-slate-600 hover:text-slate-900 font-bold">會員方案</Link>
          <Link href="/help" className="block text-slate-600 hover:text-slate-900 font-bold">常見問答</Link>
          <Link href="/about" className="block text-slate-600 hover:text-slate-900 font-bold">關於我們</Link>
          <Link href="/contact" className="block text-slate-600 hover:text-slate-900 font-bold">聯絡我們</Link>

          <div className="pt-4 border-t border-slate-100">
            {session ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 py-1 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                  目前登入：{userName}
                </div>
                <Link 
                  href={isAdmin ? "/admin" : "/courses"}
                  style={{ background: primaryColor }}
                  className="w-full text-white py-3 rounded-xl font-bold block text-center shadow-xs"
                >
                  {isAdmin ? "管理後台 ↗" : "我的學習"}
                </Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-center text-slate-500 hover:text-slate-800 font-bold py-2 border border-slate-200 rounded-xl block cursor-pointer"
                >
                  登出帳戶
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  href="/login"
                  className="text-slate-600 border border-slate-200 py-3 rounded-xl font-bold block text-center"
                >
                  登入
                </Link>
                <Link 
                  href="/signup"
                  style={{ background: primaryColor }}
                  className="text-white py-3 rounded-xl font-bold block text-center"
                >
                  註冊
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
