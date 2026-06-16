'use client';

import { useState } from 'react';
import { 
  DollarSign, 
  Users, 
  BookOpen, 
  HelpCircle, 
  GraduationCap, 
  FileText, 
  Box, 
  Tag, 
  Copy, 
  Check, 
  Calendar as CalendarIcon,
  ChevronDown
} from "lucide-react";
import Link from 'next/link';

interface DashboardClientProps {
  initialCoursesCount: number;
  initialUsersCount: number;
  initialRevenue: number;
}

export default function DashboardClient({ 
  initialCoursesCount, 
  initialUsersCount, 
  initialRevenue 
}: DashboardClientProps) {
  // 直接採用資料庫提供的真實統計值，無資料時顯示 0，避免呈現假數據
  const coursesCount = initialCoursesCount ?? 0;
  const usersCount = initialUsersCount ?? 0;
  const revenueAmount = initialRevenue ?? 0;

  const [activeTab, setActiveTab] = useState<'operating' | 'marketing'>('operating');
  const [copiedLink, setCopiedLink] = useState<'frontend' | 'backend' | null>(null);

  const handleCopy = (text: string, type: 'frontend' | 'backend') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-8 select-none">
      {/* 3-Column Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: 課程總數 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="text-[13px] font-bold text-slate-400 mb-2">課程總數</div>
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {coursesCount}
          </div>
        </div>

        {/* Card 2: 學員總數 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="text-[13px] font-bold text-slate-400 mb-2">學員總數</div>
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {usersCount}
          </div>
        </div>

        {/* Card 3: 淨營業額 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="text-[13px] font-bold text-slate-400 mb-2">淨營業額</div>
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
            NT$ {revenueAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Layout: Dashboard on Left, Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Columns (Dashboard Metrics & Charts) - Takes 9 columns */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            
            {/* Inner Header with Tabs */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">儀表板</h2>
              </div>
              <div className="flex space-x-6 text-sm font-semibold">
                <button 
                  onClick={() => setActiveTab('operating')}
                  className={`pb-4 -mb-[17px] border-b-2 transition ${
                    activeTab === 'operating' 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  網站營運
                </button>
                <button 
                  onClick={() => setActiveTab('marketing')}
                  className={`pb-4 -mb-[17px] border-b-2 transition ${
                    activeTab === 'marketing' 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  行銷
                </button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-4 py-2">
              <div className="relative">
                <select className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition cursor-pointer">
                  <option>最近 7 天</option>
                  <option>最近 30 天</option>
                  <option>本月</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
                <span className="font-semibold text-slate-600">資料區間</span>
                <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white">
                  <input
                    type="text"
                    placeholder="開始日期"
                    className="w-36 text-center outline-none text-slate-700 font-semibold text-xs"
                    readOnly
                  />
                  <span className="text-slate-300">~</span>
                  <input
                    type="text"
                    placeholder="結束日期"
                    className="w-36 text-center outline-none text-slate-700 font-semibold text-xs"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Twin Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              {/* 圖表 1：淨營業額（圖表資料尚未串接，暫不顯示假數據） */}
              <div className="border border-slate-100 rounded-2xl p-6 space-y-4 hover:shadow-sm transition bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[13px] font-bold text-slate-400">
                    <span>淨營業額</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-pointer hover:text-slate-400" />
                  </div>
                </div>

                {/* 圖表資料尚未串接，顯示資料準備中佔位 */}
                <div className="relative h-44 w-full flex items-center justify-center text-sm font-semibold text-slate-400">
                  資料準備中
                </div>
              </div>

              {/* 圖表 2：成交營業額（圖表資料尚未串接，暫不顯示假數據） */}
              <div className="border border-slate-100 rounded-2xl p-6 space-y-4 hover:shadow-sm transition bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[13px] font-bold text-slate-400">
                    <span>成交營業額</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-pointer hover:text-slate-400" />
                  </div>
                </div>

                {/* 圖表資料尚未串接，顯示資料準備中佔位 */}
                <div className="relative h-44 w-full flex items-center justify-center text-sm font-semibold text-slate-400">
                  資料準備中
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Right Column (Sidebar actions) - Takes 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Quick Actions (快速操作) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-800 text-[15px] flex items-center">
                <span className="mr-2">🚀</span> 快速操作
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-semibold">快速建立常用的內容和功能</p>
            </div>

            <div className="space-y-3.5">
              {/* 建立課程 */}
              <Link 
                href="/admin/courses" 
                className="flex items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition text-left group"
              >
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <div className="text-[13px] font-bold text-slate-800">建立課程</div>
                  <div className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">建立新的線上課程內容</div>
                </div>
              </Link>

              {/* 發表文章 */}
              <Link 
                href="/admin/articles" 
                className="flex items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition text-left group"
              >
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <div className="text-[13px] font-bold text-slate-800">發表文章</div>
                  <div className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">撰寫部落格文章或公告</div>
                </div>
              </Link>

              {/* 新增數位商品 */}
              <Link 
                href="/admin/downloads" 
                className="flex items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition text-left group"
              >
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <Box className="w-5 h-5" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <div className="text-[13px] font-bold text-slate-800">新增數位商品</div>
                  <div className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">新增可販售的數位商品</div>
                </div>
              </Link>

              {/* 新增優惠券 */}
              <Link 
                href="/admin/marketing" 
                className="flex items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition text-left group"
              >
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <div className="text-[13px] font-bold text-slate-800">新增優惠券</div>
                  <div className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">建立優惠券促進銷售</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Useful Links (常用連結) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-800 text-[15px] flex items-center">
                <span className="mr-2">🔗</span> 常用連結
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-semibold">快速複製您的網站連結</p>
            </div>

            <div className="space-y-4">
              {/* Frontend Link */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">網站前台網址</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1.5 items-center">
                  <input 
                    type="text" 
                    value="https://bds.fu-notes.com" 
                    className="bg-transparent flex-1 text-xs px-2 text-slate-500 outline-none select-all font-semibold"
                    readOnly
                  />
                  <button 
                    onClick={() => handleCopy('https://bds.fu-notes.com', 'frontend')}
                    className="p-2 bg-white text-slate-500 hover:text-slate-800 rounded-lg shadow-sm border border-slate-100 transition active:scale-95"
                  >
                    {copiedLink === 'frontend' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Backend Link */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">管理後台網址</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1.5 items-center">
                  <input
                    type="text"
                    value="https://bds.fu-notes.com/admin"
                    className="bg-transparent flex-1 text-xs px-2 text-slate-500 truncate outline-none select-all font-semibold"
                    readOnly
                  />
                  <button
                    onClick={() => handleCopy('https://bds.fu-notes.com/admin', 'backend')}
                    className="p-2 bg-white text-slate-500 hover:text-slate-800 rounded-lg shadow-sm border border-slate-100 transition active:scale-95"
                  >
                    {copiedLink === 'backend' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
