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

// 1. GET：取得該課程的所有公告列表
export async function GET(req: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: "缺少課程 ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('course_announcements')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("查詢課程公告失敗：", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("GET course announcement error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST：建立新公告
export async function POST(req: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { course_id, title, content } = body;

    if (!course_id || !title || !content) {
      return NextResponse.json({ error: "缺少必要欄位 (課程ID、標題、內容)" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('course_announcements')
      .insert([{
        course_id,
        title,
        content,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST course announcement error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE：刪除公告
export async function DELETE(req: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "缺少公告 ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from('course_announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "公告已成功刪除" });
  } catch (error: any) {
    console.error("DELETE course announcement error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
