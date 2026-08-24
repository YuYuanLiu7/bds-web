import { supabase } from "@/lib/supabase";
import { SEED_PLANS } from "@/lib/membership-plans";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('status', 'active')
      .order('price', { ascending: true });

    if (error) {
      console.warn("Supabase query for active membership_plans failed, using local seed data:", error);
      return NextResponse.json(SEED_PLANS);
    }

    if (!data || data.length === 0) {
      return NextResponse.json(SEED_PLANS);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
