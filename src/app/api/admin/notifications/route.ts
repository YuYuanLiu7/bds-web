import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// 後台通知鈴鐺的資料來源：回傳「需要管理員處理」的真實待辦事項。
// 目前兩類：① 已付款但尚未開通的訂單（fulfilled_at 為 null）② 待審核的課程留言。
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  try {
    // ① 已付款但未開通的訂單（需人工補開通）
    const { data: orders } = await supabase
      .from("orders")
      .select("id, amount, created_at")
      .eq("status", "paid")
      .is("fulfilled_at", null)
      .order("created_at", { ascending: false })
      .limit(5);
    const { count: unfulfilledOrders } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .is("fulfilled_at", null);

    // ② 待審核的課程留言
    const { data: comments } = await supabase
      .from("course_comments")
      .select("id, student_name, text, course_title, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);
    const { count: pendingComments } = await supabase
      .from("course_comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const items = [
      ...(orders || []).map((o) => ({
        type: "order" as const,
        title: `待開通訂單 NT$${o.amount}`,
        detail: `訂單 ${o.id}（已付款、尚未開通）`,
        time: o.created_at,
        href: "/admin/finance",
      })),
      ...(comments || []).map((c) => ({
        type: "comment" as const,
        title: `待審留言：${c.student_name}`,
        detail: `${c.course_title ? `[${c.course_title}] ` : ""}${(c.text || "").slice(0, 40)}`,
        time: c.created_at,
        href: "/admin/comments",
      })),
    ];

    const counts = {
      unfulfilledOrders: unfulfilledOrders || 0,
      pendingComments: pendingComments || 0,
    };
    const total = counts.unfulfilledOrders + counts.pendingComments;

    return NextResponse.json({ total, counts, items });
  } catch (error) {
    console.error("通知 API 錯誤：", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
