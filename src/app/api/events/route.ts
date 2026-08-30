import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Supabase 錯誤（可能帶有 code 欄位）
interface SupabaseLikeError {
  message?: string;
  code?: string;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      // If table doesn't exist yet, we can let the frontend handle the fallback
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    const err = error as SupabaseLikeError;
    // 對外只回制式訊息，不洩漏資料庫錯誤/欄位名；詳細只寫伺服器日誌
    console.error("Public API GET events error:", err?.message, err?.code);
    return NextResponse.json({ error: "伺服器忙碌，請稍後再試" }, { status: 500 });
  }
}
