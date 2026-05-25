import { supabase } from "@/lib/supabase";
import DashboardClient from "@/components/admin/DashboardClient";

export const revalidate = 0; // Disable caching to ensure fresh metrics

export default async function AdminDashboardPage() {
  let initialCoursesCount = 0;
  let initialUsersCount = 0;
  let initialRevenue = 0;

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
  } catch (error) {
    console.error("Failed to fetch dashboard initial statistics:", error);
  }

  return (
    <DashboardClient 
      initialCoursesCount={initialCoursesCount}
      initialUsersCount={initialUsersCount}
      initialRevenue={initialRevenue}
    />
  );
}
