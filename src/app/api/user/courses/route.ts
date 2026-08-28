import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

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
    console.error("API GET user/courses error:", error);
    return NextResponse.json({ error: "伺服器忙碌，請稍後再試" }, { status: 500 });
  }
}
