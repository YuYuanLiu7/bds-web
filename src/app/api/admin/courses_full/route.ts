import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*, chapters(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 對每個課程的章節進行排序
    const sortedData = data.map(course => ({
      ...course,
      chapters: course.chapters.sort((a: any, b: any) => a.order_index - b.order_index)
    }));

    return NextResponse.json(sortedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
