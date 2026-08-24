import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { checkCourseAccess } from "@/lib/courses";
import { hasActiveMembership } from "@/lib/users";
import { NextResponse } from "next/server";

export const revalidate = 0;

// 資料庫 course_reviews 資料列
interface ReviewRow {
  id: string;
  course_id: string;
  student_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

// 將 timestamp 格式化為前端顯示用的 "YYYY-MM-DD HH:mm"
function fmt(ts: string): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// GET：取得某課程的公開評價列表
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: "缺少 courseId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviews = ((data || []) as ReviewRow[]).map((r) => ({
      id: r.id,
      courseId: r.course_id,
      studentName: r.student_name,
      rating: r.rating,
      comment: r.comment,
      date: fmt(r.created_at),
    }));
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// POST：發佈評價（需登入，且須為管理員 / 已購買 / 有效付費會員）
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUser | undefined;
    const userId = sessionUser?.id;
    if (!userId) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { courseId, rating, comment } = await req.json();
    if (!courseId || !comment?.trim()) {
      return NextResponse.json({ error: "缺少課程或評價內容" }, { status: 400 });
    }

    const isAdmin = sessionUser?.role === 'admin';
    const hasAccess =
      isAdmin ||
      (await checkCourseAccess(userId, courseId)) ||
      (await hasActiveMembership(userId));
    if (!hasAccess) {
      return NextResponse.json({ error: "只有已購買或具看課權限的學員才能撰寫評價" }, { status: 403 });
    }

    const safeRating = Math.min(5, Math.max(1, parseInt(rating) || 5));
    const studentName = sessionUser?.name || sessionUser?.email?.split('@')[0] || '匿名學員';

    const { data, error } = await supabase
      .from('course_reviews')
      .insert({
        course_id: courseId,
        user_id: userId,
        student_name: studentName,
        rating: safeRating,
        comment: comment.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    const review = data as ReviewRow;
    return NextResponse.json({
      id: review.id,
      courseId: review.course_id,
      studentName: review.student_name,
      rating: review.rating,
      comment: review.comment,
      date: fmt(review.created_at),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
