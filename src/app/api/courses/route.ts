import { getPublishedCourses } from "@/lib/courses";
import { NextResponse } from "next/server";

export const revalidate = 0;

// 公開課程清單：供文章「指定課程解鎖卡」等前台元件將 course_id 轉成標題顯示
export async function GET() {
  try {
    const courses = await getPublishedCourses();
    return NextResponse.json(courses);
  } catch (error: any) {
    console.error("Public API GET courses error:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed to fetch courses" }, { status: 500 });
  }
}
