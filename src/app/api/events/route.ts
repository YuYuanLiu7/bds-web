import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

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
  } catch (error: any) {
    console.error("Public API GET events error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events", code: error.code },
      { status: 500 }
    );
  }
}
