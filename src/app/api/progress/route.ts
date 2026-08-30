import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions, type SessionUser } from "@/lib/auth";
import { canAccess } from "@/lib/entitlements";
import { NextResponse } from "next/server";

export const revalidate = 0;

// GET：回傳目前登入者在此課程「已完成」的章節 ID 陣列
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ error: "缺少 courseId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("course_progress")
      .select("chapter_id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("completed", true);
    if (error) throw error;

    const completedChapterIds = (data || []).map(
      (r: { chapter_id: string }) => r.chapter_id
    );
    return NextResponse.json({ completedChapterIds });
  } catch (error) {
    console.error("API GET progress error:", error);
    return NextResponse.json({ error: "伺服器忙碌，請稍後再試" }, { status: 500 });
  }
}

// POST：標記/取消標記某章節完成（需登入且具課程觀看權限）
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUser | undefined;
    const userId = sessionUser?.id;
    if (!userId) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { courseId, chapterId, completed } = await req.json();
    if (!courseId || !chapterId) {
      return NextResponse.json({ error: "缺少課程或章節" }, { status: 400 });
    }

    // 先驗證此使用者是否具備該課程觀看權限，通過才允許記錄進度，
    // 避免未購課者對任意課程寫入進度資料
    const allowed = await canAccess(sessionUser, { kind: "course", id: courseId });
    if (!allowed) {
      return NextResponse.json(
        { error: "只有具看課權限的學員才能記錄進度" },
        { status: 403 }
      );
    }

    // upsert：同一學員同一章節僅一筆（onConflict user_id,chapter_id），更新完成狀態與時間
    const { error } = await supabase
      .from("course_progress")
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          chapter_id: chapterId,
          completed: completed !== false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,chapter_id" }
      );
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("API POST progress error:", error);
    return NextResponse.json({ error: "伺服器忙碌，請稍後再試" }, { status: 500 });
  }
}
