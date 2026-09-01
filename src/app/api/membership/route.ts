import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// 公開會員方案清單。務必回傳「資料庫真實方案」——
// 不再以寫死的 SEED_PLANS 保底，避免出現「看得到卻買不了」的假方案
// （結帳是以方案 id 查 membership_plans，假方案的 id 在 DB 不存在會結帳失敗）。
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('status', 'active')
      .order('price', { ascending: true });

    if (error) {
      console.error("讀取 membership_plans 失敗：", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 查無資料就回空陣列，讓前台顯示「目前無可購買方案」，而非假方案
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
