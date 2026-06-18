import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// 登入會話使用者（補上本專案的 id 欄位）
interface SessionUser {
  id?: string;
}

// user_courses 資料列
interface UserCourseRow {
  course_id: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;

    const { data, error } = await supabase
      .from('user_courses')
      .select('course_id')
      .eq('user_id', userId);

    if (error) throw error;

    const courseIds = ((data || []) as UserCourseRow[]).map((e) => e.course_id);
    return NextResponse.json(courseIds);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
