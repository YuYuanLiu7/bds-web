import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// 驗證管理員身分
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return false;
  }
  return true;
}

// 1. GET：取得特定學員已被授權的課程 ID 列表
export async function GET(req: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "缺少學員 ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_courses')
      .select('course_id')
      .eq('user_id', userId);

    if (error) throw error;

    const courseIds = data?.map(item => item.course_id) || [];
    return NextResponse.json(courseIds);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST：批次更新學員授權的課程
export async function POST(req: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, courseIds } = body;

    if (!userId || !Array.isArray(courseIds)) {
      return NextResponse.json({ error: "缺少必要參數 (userId, courseIds)" }, { status: 400 });
    }

    // A. 先刪除該學員現有的所有課程授權
    const { error: deleteError } = await supabase
      .from('user_courses')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // B. 如果有勾選任何課程，進行批次寫入
    if (courseIds.length > 0) {
      const insertRows = courseIds.map(courseId => ({
        user_id: userId,
        course_id: courseId,
        purchased_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('user_courses')
        .insert(insertRows);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, message: "課程授權更新完成" });
  } catch (error: any) {
    console.error("POST admin student courses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
