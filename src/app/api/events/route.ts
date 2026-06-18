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
    console.error("Public API GET events error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch events", code: err?.code },
      { status: 500 }
    );
  }
}
