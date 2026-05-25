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
  TrendingDown,
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
  // Use DB data if populated, otherwise use exact values from screenshot
  const coursesCount = initialCoursesCount > 0 ? initialCoursesCount : 21;
  const usersCount = initialUsersCount > 0 ? initialUsersCount : 543;
  const revenueAmount = initialRevenue > 0 ? initialRevenue : 238835;

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
                  <option>Select...</option>
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
                    defaultValue="2026/05/01 00:00" 
                    className="w-36 text-center outline-none text-slate-700 font-semibold text-xs"
                    readOnly
                  />
                  <span className="text-slate-300">~</span>
                  <input 
                    type="text" 
                    defaultValue="2026/05/31 23:59" 
                    className="w-36 text-center outline-none text-slate-700 font-semibold text-xs"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Twin Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              
              {/* Chart 1: 淨營業額 */}
              <div className="border border-slate-100 rounded-2xl p-6 space-y-4 hover:shadow-sm transition bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[13px] font-bold text-slate-400">
                    <span>淨營業額</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-pointer hover:text-slate-400" />
                  </div>
                  {/* Badge: -36.92% */}
                  <div className="flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[11px] font-bold">
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                    -36.92%
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-800">
                  NT$ 32,020
                </div>

                {/* SVG Graph for Net Revenue */}
                <div className="relative h-44 w-full">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart1BlueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#F1F5F9" strokeWidth="1" />

                    {/* Gray Line (Previous period) */}
                    <path 
                      d="M 0 135 C 50 130, 100 120, 150 128 C 200 135, 250 80, 300 100 C 350 120, 400 30, 450 110 L 500 70" 
                      fill="none" 
                      stroke="#CBD5E1" 
                      strokeWidth="2.5" 
                    />

                    {/* Blue Line Gradient Fill */}
                    <path 
                      d="M 0 140 C 60 138, 120 135, 180 137 C 240 140, 290 85, 330 92 C 370 100, 420 40, 460 125 L 500 75 L 500 160 L 0 160 Z" 
                      fill="url(#chart1BlueGrad)" 
                    />

                    {/* Blue Line (Current period) */}
                    <path 
                      d="M 0 140 C 60 138, 120 135, 180 137 C 240 140, 290 85, 330 92 C 370 100, 420 40, 460 125 L 500 75" 
                      fill="none" 
                      stroke="#2563EB" 
                      strokeWidth="3" 
                    />

                    {/* Selected Highlight Marker */}
                    <circle cx="330" cy="92" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-sm" />
                  </svg>
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1">
                  <span>5/1/2026</span>
                  <span>5/17/2026</span>
                </div>

                {/* Legend */}
                <div className="flex justify-center space-x-6 text-xs font-bold pt-2">
                  <span className="flex items-center text-slate-500">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-2"></span>
                    淨營業額
                  </span>
                  <span className="flex items-center text-slate-400">
                    <span className="w-2.5 h-2.5 bg-slate-300 rounded-full mr-2"></span>
                    前一階段數據
                  </span>
                </div>
              </div>

              {/* Chart 2: 成交營業額 */}
              <div className="border border-slate-100 rounded-2xl p-6 space-y-4 hover:shadow-sm transition bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[13px] font-bold text-slate-400">
                    <span>成交營業額</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-pointer hover:text-slate-400" />
                  </div>
                  {/* Badge: -35.17% */}
                  <div className="flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[11px] font-bold">
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                    -35.17%
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-800">
                  NT$ 32,910
                </div>

                {/* SVG Graph for Gross GTV */}
                <div className="relative h-44 w-full">
                  <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart2BlueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#F1F5F9" strokeWidth="1" />

                    {/* Gray Line (Previous period) */}
                    <path 
                      d="M 0 130 C 60 120, 110 115, 160 122 C 210 130, 260 75, 310 95 C 360 115, 410 25, 460 105 L 500 65" 
                      fill="none" 
                      stroke="#CBD5E1" 
                      strokeWidth="2.5" 
                    />

                    {/* Blue Line Gradient Fill */}
                    <path 
                      d="M 0 138 C 65 135, 125 132, 185 134 C 245 137, 295 82, 335 88 C 375 95, 425 35, 465 120 L 500 70 L 500 160 L 0 160 Z" 
                      fill="url(#chart2BlueGrad)" 
                    />

                    {/* Blue Line (Current period) */}
                    <path 
                      d="M 0 138 C 65 135, 125 132, 185 134 C 245 137, 295 82, 335 88 C 375 95, 425 35, 465 120 L 500 70" 
                      fill="none" 
                      stroke="#2563EB" 
                      strokeWidth="3" 
                    />

                    {/* Selected Highlight Marker */}
                    <circle cx="335" cy="88" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-sm" />
                  </svg>
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1">
                  <span>5/1/2026</span>
                  <span>5/17/2026</span>
                </div>

                {/* Legend */}
                <div className="flex justify-center space-x-6 text-xs font-bold pt-2">
                  <span className="flex items-center text-slate-500">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-2"></span>
                    成交營業額
                  </span>
                  <span className="flex items-center text-slate-400">
                    <span className="w-2.5 h-2.5 bg-slate-300 rounded-full mr-2"></span>
                    前一階段數據
                  </span>
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
                    value="https://outliersadmin38.kaik.io/admin/dashboard" 
                    className="bg-transparent flex-1 text-xs px-2 text-slate-500 truncate outline-none select-all font-semibold"
                    readOnly
                  />
                  <button 
                    onClick={() => handleCopy('https://outliersadmin38.kaik.io/admin/dashboard', 'backend')}
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
