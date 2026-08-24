import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// 章節單元排序所需的最小欄位
interface ChapterOrder {
  order_index: number;
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

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

    // 計算每門課程的統計數據
    const enrichedCourses = courses.map(course => {
      // 僅計算該課程於 user_courses 對應的實際購買人數，避免將全站訂閱數灌入每門課
      const directStudentCount = studentCountMap[course.id] || 0;
      const netSales = netSalesMap[course.id] || 0;

      return {
        ...course,
        chapters: (course.chapters || []).sort((a: ChapterOrder, b: ChapterOrder) => a.order_index - b.order_index),
        studentCount: directStudentCount,
        directStudentCount,
        netSales
      };
    });

    return NextResponse.json(enrichedCourses);
  } catch (error) {
    console.error("GET courses_full error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
