import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { ownsCourse, hasActiveMembership } from "@/lib/entitlements";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const revalidate = 0;

// 資料庫 course_comments 資料列
interface CommentRow {
  id: string;
  student_name: string | null;
  course_title: string | null;
  chapter_title: string | null;
  text: string | null;
  created_at: string | null;
  status: string | null;
  reply: string | null;
  reply_date: string | null;
  user_id: string | null;
}

function fmt(ts: string | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function toClient(c: CommentRow) {
  return {
    id: c.id,
    student: c.student_name,
    course: c.course_title,
    chapter: c.chapter_title,
    text: c.text,
    date: fmt(c.created_at),
    status: c.status,
    reply: c.reply,
    replyDate: fmt(c.reply_date),
  };
}

// GET：取得某章節的留言（已核准的 + 目前登入者自己的待審留言）
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const chapterId = searchParams.get('chapterId');
    if (!courseId) {
      return NextResponse.json({ error: "缺少 courseId" }, { status: 400 });
    }

    let query = supabase
      .from('course_comments')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (chapterId) query = query.eq('chapter_id', chapterId);

    const { data, error } = await query;
    if (error) throw error;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as SessionUser | undefined)?.id;

    // 僅回傳已核准留言；待審留言只回給留言者本人，避免他人看到未審內容
    const visible = ((data || []) as CommentRow[]).filter(
      (c) => c.status === 'approved' || (userId && c.user_id === userId)
    );
    return NextResponse.json(visible.map(toClient));
  } catch (error) {
    console.error("API GET comments error:", error);
    return NextResponse.json({ error: "伺服器忙碌，請稍後再試" }, { status: 500 });
  }
}

// POST：送出留言（需登入，預設待審核）
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUser | undefined;
    const userId = sessionUser?.id;
    if (!userId) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    // 速率限制：同一使用者每 10 分鐘最多 20 則留言，防止洗待審留言
    if (!(await rateLimit(`comment:${userId}`, 20, 600))) {
      return NextResponse.json({ error: "留言過於頻繁，請稍後再試" }, { status: 429 });
    }

    const { courseId, chapterId, text } = await req.json();
    if (!courseId || !text?.trim()) {
      return NextResponse.json({ error: "缺少課程或留言內容" }, { status: 400 });
    }

    // 權限檢查（比照評價）：僅管理員 / 已購課 / 有效付費會員可留言，避免未購課者灌留言
    const isAdmin = sessionUser?.role === 'admin';
    const hasAccess =
      isAdmin ||
      (await ownsCourse(userId, courseId)) ||
      (await hasActiveMembership(userId));
    if (!hasAccess) {
      return NextResponse.json({ error: "只有已購買或具看課權限的學員才能留言" }, { status: 403 });
    }

    // 課程/章節標題一律由資料庫反查，不採信前端傳入值（避免偽造標示到任意課程）
    const { data: courseRow } = await supabase
      .from('courses').select('title').eq('id', courseId).maybeSingle();
    let chapterTitle: string | null = null;
    if (chapterId) {
      const { data: chapterRow } = await supabase
        .from('chapters').select('title').eq('id', chapterId).maybeSingle();
      chapterTitle = chapterRow?.title ?? null;
    }

    const studentName = sessionUser?.name || sessionUser?.email?.split('@')[0] || '匿名學員';

    const { data, error } = await supabase
      .from('course_comments')
      .insert({
        course_id: courseId,
        chapter_id: chapterId || null,
        course_title: courseRow?.title ?? null,
        chapter_title: chapterTitle,
        user_id: userId,
        student_name: studentName,
        text: text.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(toClient(data as CommentRow));
  } catch (error) {
    console.error("API POST comments error:", error);
    return NextResponse.json({ error: "伺服器忙碌，請稍後再試" }, { status: 500 });
  }
}
