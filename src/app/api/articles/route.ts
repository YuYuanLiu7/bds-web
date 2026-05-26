import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch a single article by ID
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Fetch all published articles
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('date', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data || []);
    }
  } catch (error: any) {
    console.error("Public API GET articles error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch articles", code: error.code },
      { status: 500 }
    );
  }
}
