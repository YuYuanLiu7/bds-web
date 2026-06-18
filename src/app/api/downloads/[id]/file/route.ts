import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// 登入會話使用者（補上本專案的 id 與 role 欄位）
interface SessionUser {
  id?: string;
  role?: string;
}

// 安全下載端點：只有「管理員」「已購買者」或「免費商品」才會拿到 file_url。
// 付費商品的 file_url 不放在公開列表回應中，必須經此端點逐筆驗證權限後才取得，
// 避免在 HTML/DOM 或列表 API 中外洩付費下載連結。
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data: download, error } = await supabase
      .from('downloads')
      .select('file_url, price, status')
      .eq('id', id)
      .single();

    if (error || !download) {
      return NextResponse.json({ error: "找不到指定的數位下載商品" }, { status: 404 });
    }
    if (download.status !== 'published') {
      return NextResponse.json({ error: "此商品尚未上架" }, { status: 404 });
    }

    const isFree = (download.price || 0) <= 0;
    const session = await getServerSession(authOptions);
    const isAdmin = !!session && (session.user as SessionUser | undefined)?.role === 'admin';

    // 付費商品需驗證擁有權（管理員除外）
    if (!isFree && !isAdmin) {
      const userId = (session?.user as SessionUser | undefined)?.id;
      if (!userId) {
        return NextResponse.json({ error: "請先登入" }, { status: 401 });
      }
      const { data: owned } = await supabase
        .from('user_downloads')
        .select('download_id')
        .eq('user_id', userId)
        .eq('download_id', id)
        .single();
      if (!owned) {
        return NextResponse.json({ error: "您尚未購買此資源" }, { status: 403 });
      }
    }

    if (!download.file_url) {
      return NextResponse.json({ error: "此資源尚未配置下載檔案連結" }, { status: 404 });
    }

    return NextResponse.json({ file_url: download.file_url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "下載連結取得失敗" }, { status: 500 });
  }
}
