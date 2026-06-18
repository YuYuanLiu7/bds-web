import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const revalidate = 0;

function fmt(ts: string | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 資料庫 course_comments 資料列型別
interface CommentRow {
  id: string | number;
  student_name: string | null;
  course_title: string | null;
  chapter_title: string | null;
  text: string | null;
  created_at: string | null;
  status: string | null;
  reply: string | null;
  reply_date: string | null;
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

// 管理員身分驗證（以資料庫 role 為準）
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false as const, status: 401, error: "Unauthorized: Please log in." };
  }
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single();
  if (error || !userData || userData.role !== 'admin') {
    return { ok: false as const, status: 403, error: "Forbidden: Admin access required." };
  }
  return { ok: true as const };
}

// GET：取得所有留言供後台管理
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { data, error } = await supabase
      .from('course_comments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json((data || []).map(toClient));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PUT：審核通過或回覆留言。body: { id, action: 'approve' | 'reply', reply? }
export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id, action, reply } = await req.json();
    if (!id) return NextResponse.json({ error: "缺少留言 id" }, { status: 400 });

    let update: { status: string; reply?: string; reply_date?: string };
    if (action === 'approve') {
      update = { status: 'approved' };
    } else if (action === 'reply') {
      if (!reply?.trim()) return NextResponse.json({ error: "回覆內容不可為空" }, { status: 400 });
      // 回覆同時自動核准該留言
      update = { reply: reply.trim(), reply_date: new Date().toISOString(), status: 'approved' };
    } else {
      return NextResponse.json({ error: "未知的操作" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('course_comments')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(toClient(data));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// DELETE：刪除留言。?id=
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "缺少留言 id" }, { status: 400 });

    const { error } = await supabase.from('course_comments').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: "已刪除" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
