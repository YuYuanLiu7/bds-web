import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

// 數位下載商品資料列（標註本路由使用到的欄位，其餘保留彈性）
interface DownloadRow {
  file_url?: string;
  price?: number;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 🔒 付費商品的 file_url 不可外洩給未授權者；僅管理員可取得付費檔案連結
    const session = await getServerSession(authOptions);
    const isAdmin = !!session && (session.user as SessionUser | undefined)?.role === 'admin';
    const sanitized = ((data || []) as DownloadRow[]).map((d) => {
      if (!isAdmin && (d.price || 0) > 0) {
        // 移除付費商品的 file_url，避免外洩下載連結
        const rest = { ...d };
        delete rest.file_url;
        return rest;
      }
      return d;
    });
    return NextResponse.json(sanitized);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
