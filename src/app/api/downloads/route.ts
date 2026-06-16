import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 🔒 付費商品的 file_url 不可外洩給未授權者；僅管理員可取得付費檔案連結
    const session = await getServerSession(authOptions);
    const isAdmin = !!session && (session.user as any)?.role === 'admin';
    const sanitized = (data || []).map((d: any) => {
      if (!isAdmin && (d.price || 0) > 0) {
        const { file_url, ...rest } = d;
        return rest;
      }
      return d;
    });
    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
