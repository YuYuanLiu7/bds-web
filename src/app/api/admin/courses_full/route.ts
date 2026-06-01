import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parallel fetch for optimal database performance
    const [coursesRes, userCoursesRes, ordersRes] = await Promise.all([
      supabase
        .from('courses')
        .select('*, chapters(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('user_courses')
        .select('course_id'),
      supabase
        .from('orders')
        .select('course_id, amount')
        .eq('status', 'paid')
    ]);

    if (coursesRes.error) throw coursesRes.error;

    const courses = coursesRes.data || [];
    const userCourses = userCoursesRes.data || [];
    const paidOrders = ordersRes.data || [];

    // Map user_courses count per course_id
    const studentCountMap: { [key: string]: number } = {};
    userCourses.forEach(uc => {
      if (uc.course_id) {
        studentCountMap[uc.course_id] = (studentCountMap[uc.course_id] || 0) + 1;
      }
    });

    // Map paid orders sum (Net Sales) per course_id
    const netSalesMap: { [key: string]: number } = {};
    paidOrders.forEach(order => {
      if (order.course_id) {
        netSalesMap[order.course_id] = (netSalesMap[order.course_id] || 0) + (order.amount || 0);
      }
    });

    // Retrieve active subscribers count who have full access to all courses
    let activeSubscribersCount = 0;
    try {
      const { data: subUsers, error: subError } = await supabase
        .from('users')
        .select('id, membership_expires_at')
        .not('membership_plan_id', 'is', null);

      if (!subError && Array.isArray(subUsers)) {
        const now = new Date();
        const activeSubs = subUsers.filter(u => {
          if (!u.membership_expires_at) return true;
          return new Date(u.membership_expires_at) > now;
        });
        activeSubscribersCount = activeSubs.length;
      }
    } catch (e) {
      console.warn("Failed to retrieve active subscribers count:", e);
    }

    // Enrich courses with calculated stats
    const enrichedCourses = courses.map(course => {
      const directStudentCount = studentCountMap[course.id] || 0;
      // Total students authorized = direct buyers + active subscription members
      const totalStudentCount = directStudentCount + activeSubscribersCount;
      const netSales = netSalesMap[course.id] || 0;

      return {
        ...course,
        chapters: (course.chapters || []).sort((a: any, b: any) => a.order_index - b.order_index),
        studentCount: totalStudentCount,
        directStudentCount,
        netSales
      };
    });

    return NextResponse.json(enrichedCourses);
  } catch (error: any) {
    console.error("GET courses_full error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
