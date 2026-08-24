import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// 由 user_courses 關聯帶出的使用者資料
interface JoinedUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  membership_plan_id?: string | null;
  membership_expires_at?: string | null;
  created_at?: string;
}

// 課程學員名冊單筆資料（合併單堂購買與訂閱會員）
interface CourseStudent {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  purchased_at?: string;
  auth_type: 'single' | 'subscription';
  membership_plan_id?: string | null;
  membership_expires_at?: string | null;
}

// 1. GET：取得可觀看特定課程的學員名冊 (包含單堂與訂閱會員，以及淨銷售總額)
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: "缺少課程 ID" }, { status: 400 });
    }

    // A. 查詢此課程的基本資訊
    const { data: courseInfo, error: courseError } = await supabase
      .from('courses')
      .select('id, title, thumbnail_url, price, category')
      .eq('id', courseId)
      .single();

    if (courseError) {
      return NextResponse.json({ error: "查無此課程或課程 ID 無效" }, { status: 404 });
    }

    // B. 查詢「直接單堂購買/授權」此課程的學員名單
    const { data: singleAccessData, error: singleError } = await supabase
      .from('user_courses')
      .select('purchased_at, users(id, email, name, phone, role)')
      .eq('course_id', courseId);

    if (singleError) throw singleError;

    const directStudents: CourseStudent[] = singleAccessData?.map(item => {
      // Supabase 關聯查詢可能回傳物件或陣列，統一取出單一使用者
      const user = (Array.isArray(item.users) ? item.users[0] : item.users) as JoinedUser | null;
      return {
        id: user?.id as string,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        role: user?.role,
        purchased_at: item.purchased_at,
        auth_type: 'single' as const
      };
    }).filter(s => s.id) || [];

    // C. 查詢「具備有效訂閱會員資格」的學員名單 (訂閱會員暢看全站所有課)
    let subscriptionStudents: CourseStudent[] = [];
    try {
      const { data: subUsers, error: subError } = await supabase
        .from('users')
        .select('id, email, name, phone, role, membership_plan_id, membership_expires_at, created_at')
        .not('membership_plan_id', 'is', null);

      if (!subError && Array.isArray(subUsers)) {
        // 過濾未過期的訂閱會員 (expires_at 為空代表無限期，或 expires_at 大於當前時間)
        const now = new Date();
        subscriptionStudents = subUsers.filter(u => {
          if (!u.membership_expires_at) return true;
          return new Date(u.membership_expires_at) > now;
        }).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          purchased_at: u.created_at, // 以加入日期作為開始時間
          auth_type: 'subscription' as const,
          membership_plan_id: u.membership_plan_id,
          membership_expires_at: u.membership_expires_at
        }));
      }
    } catch (err) {
      console.warn("Failed to select subscription users, table might not be migrated yet:", err);
    }

    // D. 名冊去重合併：若學員既買了單堂又是訂閱會員，以「訂閱會員」為優先展示，因為權限涵蓋範圍更廣
    const studentMap = new Map<string, CourseStudent>();

    // 1. 先置入直接購買者
    directStudents.forEach(s => studentMap.set(s.id, s));

    // 2. 再置入/覆蓋訂閱會員 (訂閱會員暢看，優先權較高)
    subscriptionStudents.forEach(s => {
      studentMap.set(s.id, s);
    });

    const allStudents = Array.from(studentMap.values());

    // E. 查詢此課程的所有「已付款」訂單以加總淨銷售額 (Net Sales)
    let netSales = 0;
    try {
      const { data: paidOrders, error: ordersError } = await supabase
        .from('orders')
        .select('amount')
        .eq('course_id', courseId)
        .eq('status', 'paid');
      
      if (!ordersError && Array.isArray(paidOrders)) {
        netSales = paidOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
      }
    } catch (err) {
      console.warn("Failed to select paid orders, table schema might differ:", err);
    }

    return NextResponse.json({
      course: courseInfo,
      students: allStudents,
      netSales: netSales
    });

  } catch (error) {
    console.error("GET course students error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 2. POST：在課程內手動新增單堂學員授權
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { courseId, userId } = body;

    if (!courseId || !userId) {
      return NextResponse.json({ error: "缺少必要參數 (courseId, userId)" }, { status: 400 });
    }

    // 檢查是否已擁有授權
    const { data: existing } = await supabase
      .from('user_courses')
      .select('user_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "此學員已擁有該課程之觀看權限" }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_courses')
      .insert([{
        user_id: userId,
        course_id: courseId,
        purchased_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, message: "已成功為學員開通此課程觀看權限" });
  } catch (error) {
    console.error("POST course student error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 3. DELETE：在課程內取消學員的單堂授權
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    if (!courseId || !userId) {
      return NextResponse.json({ error: "缺少必要參數 (courseId, userId)" }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_courses')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "已成功取消該學員之單堂課程觀看權限" });
  } catch (error) {
    console.error("DELETE course student error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
