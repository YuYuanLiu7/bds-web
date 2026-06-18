import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const revalidate = 0;

// 登入會話使用者（補上本專案的 id 與 role 欄位）
interface SessionUser {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
}

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
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
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

    const { courseId, chapterId, courseTitle, chapterTitle, text } = await req.json();
    if (!courseId || !text?.trim()) {
      return NextResponse.json({ error: "缺少課程或留言內容" }, { status: 400 });
    }

    const studentName = sessionUser?.name || sessionUser?.email?.split('@')[0] || '匿名學員';

    const { data, error } = await supabase
      .from('course_comments')
      .insert({
        course_id: courseId,
        chapter_id: chapterId || null,
        course_title: courseTitle || null,
        chapter_title: chapterTitle || null,
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
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
