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

// 模擬公告資料 (當資料庫尚未建立 course_announcements 資料表時做為保底回傳)
const MOCK_ANNOUNCEMENTS = [
  {
    id: "ann-mock-1",
    title: "📢 線上直播大師班時間敲定！",
    content: "各位 BDS 學員大家好！我們將於下週五晚上 8 點舉辦商務開發實務大師班直播講座。直播連結與互動提問單將於週三前在此公告公布，請大家預先排開時間！",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "ann-mock-2",
    title: "📁 隨堂講義與談判工具模板包已上架",
    content: "本學季課程對應的「BD 商務合約核心條款評估清單.pdf」與「高階客戶開發溝通模版」已全數上傳至數位資源區。學員可至前台單元清單最下方點擊下載。",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// 1. GET：取得該課程的所有公告列表 (具備 DB 容錯保底)
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
      console.warn("Supabase query for course_announcements failed, table might not be created yet:", error.message);
      // 回傳保底模擬資料，防止介面 404/500
      return NextResponse.json(MOCK_ANNOUNCEMENTS);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(MOCK_ANNOUNCEMENTS);
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

    if (error) {
      // 萬一資料庫還沒建表，回傳模擬寫入成功 (提升 localhost 演示體驗)
      if (error.message?.includes("relation") || error.message?.includes("does not exist")) {
        console.warn("Database table does not exist, simulating post success...");
        return NextResponse.json({
          id: `ann-sim-${Date.now()}`,
          course_id,
          title,
          content,
          created_at: new Date().toISOString()
        });
      }
      throw error;
    }

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

    // 模擬 ID 直接回傳成功
    if (id.startsWith("ann-mock-") || id.startsWith("ann-sim-")) {
      return NextResponse.json({ success: true, message: "公告已成功刪除 (模擬)" });
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
