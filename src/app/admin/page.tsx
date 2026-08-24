import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";
import DashboardClient from "@/components/admin/DashboardClient";

export const revalidate = 0; // Disable caching to ensure fresh metrics

export default async function AdminDashboardPage() {
  // 授權檢查靠近資料來源再做一次：本頁為 Server Component，會直接以 service 權限
  // 查詢全站營收/使用者數等營運數據；不可只依賴 layout 守衛（RSC 部分渲染時 layout 可能不執行）。
  const sessionUser = await getSessionUser();
  if (sessionUser?.role !== 'admin') {
    redirect('/');
  }

  let initialCoursesCount = 0;
  let initialUsersCount = 0;
  let initialRevenue = 0;
  // 近 30 天每日營收/成交筆數時序（接真實 orders 資料）
  const revenueSeries: { date: string; label: string; revenue: number; count: number }[] = [];

  try {
    // 1. Fetch courses count
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (coursesCount !== null) {
      initialCoursesCount = coursesCount;
    }

    // 2. Fetch users count (excluding potential admins or total users)
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersCount !== null) {
      initialUsersCount = usersCount;
    }

    // 3. Fetch total revenue from paid orders
    const { data: paidOrders, error: ordersError } = await supabase
      .from('orders')
      .select('amount')
      .eq('status', 'paid');

    if (!ordersError && paidOrders) {
      initialRevenue = paidOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    }

    // 4. 近 30 天每日營收與成交筆數（以已付款訂單的建立日分桶）
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 29);
    const buckets: Record<string, { date: string; label: string; revenue: number; count: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      buckets[key] = { date: key, label: `${d.getMonth() + 1}/${d.getDate()}`, revenue: 0, count: 0 };
    }
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('amount, created_at')
      .eq('status', 'paid')
      .gte('created_at', since.toISOString());
    (recentOrders || []).forEach((o: { amount: number | null; created_at: string | null }) => {
      const key = (o.created_at || '').slice(0, 10);
      if (buckets[key]) {
        buckets[key].revenue += o.amount || 0;
        buckets[key].count += 1;
      }
    });
    revenueSeries.push(...Object.values(buckets));
  } catch (error) {
    console.error("Failed to fetch dashboard initial statistics:", error);
  }

  return (
    <DashboardClient
      initialCoursesCount={initialCoursesCount}
      initialUsersCount={initialUsersCount}
      initialRevenue={initialRevenue}
      revenueSeries={revenueSeries}
    />
  );
}
