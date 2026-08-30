'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  FileText,
  Box,
  Tag,
  Copy,
  Check,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import Link from 'next/link';

// 單一統計指標的時序與彙總資料
export interface MetricSeries {
  key: string;
  title: string;
  kind: 'currency' | 'count';
  color: string;
  total: number;      // 本期彙總值
  prevTotal: number;  // 前一個等長期間彙總值
  values: number[];   // 本期每日時序（長度 = dayCount）
  disabled?: boolean; // 功能未啟用（例如退款）
  note?: string;      // 說明文字（例如「未啟用退款功能」）
}

interface DashboardClientProps {
  initialCoursesCount: number;
  initialUsersCount: number;
  initialRevenue: number;
  metrics: MetricSeries[];
  labels: string[];
  rangeMode: '30' | 'custom';
  fromLabel: string;
  toLabel: string;
  dayCount: number;
}

// 依指標型別格式化數值
function formatValue(v: number, kind: 'currency' | 'count'): string {
  if (kind === 'currency') return `NT$ ${Math.round(v).toLocaleString()}`;
  return `${Math.round(v).toLocaleString()} 筆`;
}

// 折線圖（inline SVG 自繪）：非等比縮放但以 vector-effect 保持線寬一致，深/淺色相容
function LineChart({ values, color }: { values: number[]; color: string }) {
  const W = 300;
  const H = 120;
  const padY = 12;
  const n = values.length;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const usable = H - padY * 2;

  const xAt = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const yAt = (v: number) => H - padY - ((v - min) / range) * usable;

  const linePts = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
  const areaPts =
    n > 0
      ? `${xAt(0)},${H - padY} ${linePts} ${xAt(n - 1)},${H - padY}`
      : '';
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-32"
      role="img"
      aria-label="折線圖"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 基準線 */}
      <line
        x1="0"
        y1={H - padY}
        x2={W}
        y2={H - padY}
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        className="text-slate-400"
      />
      {n > 1 && (
        <polygon points={areaPts} fill={`url(#${gradId})`} stroke="none" />
      )}
      {n > 1 ? (
        <polyline
          points={linePts}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        n === 1 && (
          <circle cx={xAt(0)} cy={yAt(values[0])} r="3" fill={color} />
        )
      )}
    </svg>
  );
}

// 與前期比較的百分比徽章
function DeltaBadge({ total, prevTotal }: { total: number; prevTotal: number }) {
  if (prevTotal === 0) {
    // 前期無資料，無法計算百分比
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
        <Minus className="w-3 h-3" /> 無前期資料
      </span>
    );
  }
  const pct = ((total - prevTotal) / prevTotal) * 100;
  const up = pct >= 0;
  const cls = up ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
  const sign = up ? '+' : '';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${cls}`}
      title="與前一個等長期間相比"
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {sign}
      {pct.toFixed(1)}%
    </span>
  );
}

export default function DashboardClient({
  initialCoursesCount,
  initialUsersCount,
  initialRevenue,
  metrics,
  labels,
  rangeMode,
  fromLabel,
  toLabel,
  dayCount,
}: DashboardClientProps) {
  const router = useRouter();

  // 直接採用資料庫提供的真實統計值，無資料時顯示 0，避免呈現假數據
  const coursesCount = initialCoursesCount ?? 0;
  const usersCount = initialUsersCount ?? 0;
  const revenueAmount = initialRevenue ?? 0;

  // 自訂區間輸入狀態（預設帶入目前區間）
  const [customFrom, setCustomFrom] = useState(fromLabel);
  const [customTo, setCustomTo] = useState(toLabel);
  const [showCustom, setShowCustom] = useState(rangeMode === 'custom');

  const [copiedLink, setCopiedLink] = useState<'frontend' | 'backend' | null>(null);

  const handleCopy = (text: string, type: 'frontend' | 'backend') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // 切換至近 30 天
  const applyLast30 = () => {
    setShowCustom(false);
    router.push('/admin?range=30');
  };

  // 套用自訂區間
  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    if (customFrom > customTo) return; // 起訖日不合法則忽略
    router.push(`/admin?range=custom&from=${customFrom}&to=${customTo}`);
  };

  const rangeText =
    rangeMode === 'custom'
      ? `${fromLabel} ～ ${toLabel}`
      : `近 30 天（${labels[0] ?? ''} – ${labels[labels.length - 1] ?? ''}）`;

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

        {/* Card 3: 累計淨營業額 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="text-[13px] font-bold text-slate-400 mb-2">累計淨營業額</div>
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

            {/* Inner Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">儀表板</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">{rangeText}</p>
              </div>
            </div>

            {/* 統計區間選擇 */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={applyLast30}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    rangeMode === '30'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> 近 30 天
                </button>
                <button
                  onClick={() => setShowCustom((v) => !v)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    rangeMode === 'custom'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> 自訂區間
                </button>
                <span className="text-slate-400 font-semibold text-xs ml-1">
                  共 {dayCount} 天
                </span>
              </div>

              {showCustom && (
                <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500">起始日</label>
                    <input
                      type="date"
                      value={customFrom}
                      max={customTo || undefined}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-indigo-400 font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500">結束日</label>
                    <input
                      type="date"
                      value={customTo}
                      min={customFrom || undefined}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-indigo-400 font-semibold"
                    />
                  </div>
                  <button
                    onClick={applyCustom}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition active:scale-95"
                  >
                    套用區間
                  </button>
                </div>
              )}
            </div>

            {/* 指標折線圖網格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
              {metrics.map((m) => (
                <div
                  key={m.key}
                  className="border border-slate-100 rounded-2xl p-5 space-y-3 hover:shadow-sm transition bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-bold text-slate-400">{m.title}</div>
                      <div className="text-lg font-extrabold text-slate-800 tracking-tight mt-0.5">
                        {formatValue(m.total, m.kind)}
                      </div>
                    </div>
                    <div className="pt-0.5">
                      {m.disabled ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {m.note ?? '未啟用'}
                        </span>
                      ) : (
                        <DeltaBadge total={m.total} prevTotal={m.prevTotal} />
                      )}
                    </div>
                  </div>

                  <div
                    className={m.disabled ? 'opacity-40 text-slate-400' : 'text-slate-400'}
                  >
                    <LineChart values={m.values} color={m.color} />
                  </div>

                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>{labels[0] ?? ''}</span>
                    <span>{labels[labels.length - 1] ?? ''}</span>
                  </div>
                </div>
              ))}
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

              {/* 行銷工具（建立功能尚未開放，文案誠實標示即將推出） */}
              <Link
                href="/admin/marketing"
                className="flex items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition text-left group"
              >
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <div className="text-[13px] font-bold text-slate-800">行銷工具（即將推出）</div>
                  <div className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">優惠券等行銷功能開發中</div>
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
