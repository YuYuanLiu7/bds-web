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
    // 對外只回制式訊息，詳細錯誤（可能含資料表/欄位名）只記伺服器日誌
    console.error("API GET downloads error:", error);
    return NextResponse.json({ error: "伺服器忙碌，請稍後再試" }, { status: 500 });
  }
}
