import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";
import DashboardClient, { type MetricSeries } from "@/components/admin/DashboardClient";

export const revalidate = 0; // 停用快取，確保營運數據即時

// orders 資料列的最小型別（僅取用彙總所需欄位）
interface OrderRow {
  amount: number | null;
  status: string | null;
  created_at: string | null;
}

// 將日期正規化為當天 00:00:00（本地時間）
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// 產生每日 key（YYYY-MM-DD，本地時間）
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 授權檢查靠近資料來源再做一次：本頁為 Server Component，會直接以 service 權限
  // 查詢全站營收/使用者數等營運數據；不可只依賴 layout 守衛（RSC 部分渲染時 layout 可能不執行）。
  const sessionUser = await getSessionUser();
  if (sessionUser?.role !== 'admin') {
    redirect('/');
  }

  const sp = await searchParams;
  const rawRange = typeof sp.range === 'string' ? sp.range : '30';
  const rawFrom = typeof sp.from === 'string' ? sp.from : '';
  const rawTo = typeof sp.to === 'string' ? sp.to : '';

  // 解析統計區間：預設近 30 天；自訂區間需同時提供合法的起訖日
  let mode: '30' | 'custom' = '30';
  let periodStart: Date;
  let periodEnd: Date; // 期間結束（不含）

  const parsedFrom = rawFrom ? new Date(`${rawFrom}T00:00:00`) : null;
  const parsedTo = rawTo ? new Date(`${rawTo}T00:00:00`) : null;
  const customValid =
    rawRange === 'custom' &&
    parsedFrom instanceof Date && !isNaN(parsedFrom.getTime()) &&
    parsedTo instanceof Date && !isNaN(parsedTo.getTime()) &&
    parsedFrom.getTime() <= parsedTo.getTime();

  if (customValid && parsedFrom && parsedTo) {
    mode = 'custom';
    periodStart = startOfDay(parsedFrom);
    // 結束日當天整日納入：結束（不含）= 結束日隔天 00:00
    periodEnd = new Date(startOfDay(parsedTo));
    periodEnd.setDate(periodEnd.getDate() + 1);
  } else {
    mode = '30';
    periodEnd = new Date(startOfDay(new Date()));
    periodEnd.setDate(periodEnd.getDate() + 1); // 含今天整日
    periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 30);
  }

  // 天數（每日一桶）
  const dayCount = Math.max(
    1,
    Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400000)
  );
  // 前一個等長期間 [prevStart, periodStart)
  const prevStart = new Date(periodStart);
  prevStart.setDate(prevStart.getDate() - dayCount);

  const fromLabel = dayKey(periodStart);
  const toEndInclusive = new Date(periodEnd);
  toEndInclusive.setDate(toEndInclusive.getDate() - 1);
  const toLabel = dayKey(toEndInclusive);

  let initialCoursesCount = 0;
  let initialUsersCount = 0;
  let initialRevenue = 0;

  // 每日桶：本期
  const labels: string[] = [];
  const dayKeys: string[] = [];
  const paidRevenueByDay: number[] = [];
  const paidCountByDay: number[] = [];
  const failedCountByDay: number[] = [];
  const bucketIndex: Record<string, number> = {};
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(periodStart);
    d.setDate(periodStart.getDate() + i);
    const key = dayKey(d);
    bucketIndex[key] = i;
    dayKeys.push(key);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    paidRevenueByDay.push(0);
    paidCountByDay.push(0);
    failedCountByDay.push(0);
  }

  // 本期彙總
  let paidRevenueTotal = 0;
  let paidCountTotal = 0;
  let failedCountTotal = 0;
  // 前期彙總
  let prevPaidRevenue = 0;
  let prevPaidCount = 0;
  let prevFailedCount = 0;

  try {
    // 1. 課程總數
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
    if (coursesCount !== null && coursesCount !== undefined) {
      initialCoursesCount = coursesCount;
    }

    // 2. 學員總數
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (usersCount !== null && usersCount !== undefined) {
      initialUsersCount = usersCount;
    }

    // 3. 累計淨營業額（歷來已付款訂單）
    const { data: paidOrders, error: ordersError } = await supabase
      .from('orders')
      .select('amount')
      .eq('status', 'paid');
    if (!ordersError && paidOrders) {
      initialRevenue = paidOrders.reduce(
        (sum, order: { amount: number | null }) => sum + (order.amount || 0),
        0
      );
    }

    // 4. 一次查出 [prevStart, periodEnd) 區間的訂單，於記憶體中分本期/前期彙總
    const { data: rangeOrders } = await supabase
      .from('orders')
      .select('amount, status, created_at')
      .gte('created_at', prevStart.toISOString())
      .lt('created_at', periodEnd.toISOString());

    (rangeOrders || []).forEach((o: OrderRow) => {
      if (!o.created_at) return;
      const t = new Date(o.created_at);
      const amount = o.amount || 0;
      const isPaid = o.status === 'paid';
      const isFailed = o.status === 'failed';
      if (t.getTime() >= periodStart.getTime() && t.getTime() < periodEnd.getTime()) {
        // 本期
        const idx = bucketIndex[dayKey(t)];
        if (isPaid) {
          paidRevenueTotal += amount;
          paidCountTotal += 1;
          if (idx !== undefined) {
            paidRevenueByDay[idx] += amount;
            paidCountByDay[idx] += 1;
          }
        } else if (isFailed) {
          failedCountTotal += 1;
          if (idx !== undefined) failedCountByDay[idx] += 1;
        }
      } else if (t.getTime() >= prevStart.getTime() && t.getTime() < periodStart.getTime()) {
        // 前一個等長期間
        if (isPaid) {
          prevPaidRevenue += amount;
          prevPaidCount += 1;
        } else if (isFailed) {
          prevFailedCount += 1;
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch dashboard initial statistics:", error);
  }

  const zeros = new Array(dayCount).fill(0);

  // 定義：退款金額/退款數目前恆為 0（本站尚無退款系統）
  // 淨營業額 = 成交營業額 − 退款金額；淨訂單數 = 成交訂單數 − 退款數
  const metrics: MetricSeries[] = [
    {
      key: 'netRevenue',
      title: '淨營業額',
      kind: 'currency',
      color: '#4f46e5',
      total: paidRevenueTotal, // − 0
      prevTotal: prevPaidRevenue,
      values: paidRevenueByDay,
    },
    {
      key: 'paidRevenue',
      title: '成交營業額',
      kind: 'currency',
      color: '#6366f1',
      total: paidRevenueTotal,
      prevTotal: prevPaidRevenue,
      values: paidRevenueByDay,
    },
    {
      key: 'refundAmount',
      title: '退款金額',
      kind: 'currency',
      color: '#94a3b8',
      total: 0,
      prevTotal: 0,
      values: zeros,
      disabled: true,
      note: '未啟用退款功能',
    },
    {
      key: 'netOrders',
      title: '淨訂單數',
      kind: 'count',
      color: '#0ea5e9',
      total: paidCountTotal, // − 0
      prevTotal: prevPaidCount,
      values: paidCountByDay,
    },
    {
      key: 'paidOrders',
      title: '成交訂單數',
      kind: 'count',
      color: '#06b6d4',
      total: paidCountTotal,
      prevTotal: prevPaidCount,
      values: paidCountByDay,
    },
    {
      key: 'cancelledOrders',
      title: '取消訂單數',
      kind: 'count',
      color: '#ef4444',
      total: failedCountTotal,
      prevTotal: prevFailedCount,
      values: failedCountByDay,
    },
  ];

  return (
    <DashboardClient
      initialCoursesCount={initialCoursesCount}
      initialUsersCount={initialUsersCount}
      initialRevenue={initialRevenue}
      metrics={metrics}
      labels={labels}
      rangeMode={mode}
      fromLabel={fromLabel}
      toLabel={toLabel}
      dayCount={dayCount}
    />
  );
}
