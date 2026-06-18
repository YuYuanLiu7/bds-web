import { getPublishedCourses } from "@/lib/courses";
import { NextResponse } from "next/server";

// 公開、與登入無關的課程清單：快取 60 秒，降低高併發下對 DB 的重複查詢
// （管理員新增/編輯課程最多 60 秒後反映於此公開端點）
export const revalidate = 60;

// 公開課程清單：供文章「指定課程解鎖卡」等前台元件將 course_id 轉成標題顯示
export async function GET() {
  try {
    const courses = await getPublishedCourses();
    return NextResponse.json(courses);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Public API GET courses error:", message);
    return NextResponse.json({ error: message || "Failed to fetch courses" }, { status: 500 });
  }
}
