import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { canAccess } from "@/lib/entitlements";
import { NextResponse } from "next/server";

// 文章資料列（僅標註本路由使用到的付費牆相關欄位，其餘以索引簽章保留彈性）
interface ArticleRow {
  content?: string;
  visibility?: string;
  required_course_ids?: string;
  locked?: boolean;
  lockType?: string;
  [key: string]: unknown;
}

// Supabase 錯誤（可能帶有 code 欄位）
interface SupabaseLikeError {
  message?: string;
  code?: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch a single article by ID or custom Slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const query = supabase.from('articles').select('*');
      const { data: article, error } = await (isUUID ? query.eq('id', id) : query.eq('slug', id)).single();

      if (error) throw error;
      const data = article as ArticleRow;

      const session = await getServerSession(authOptions);
      const isAdminSession = (session?.user as SessionUser | undefined)?.role === 'admin';

      // 🔒 未發佈（草稿/下架）文章僅管理員可讀，避免知道 id/slug 的訪客直接讀到草稿全文
      if (data.status !== 'published' && !isAdminSession) {
        return NextResponse.json({ error: '找不到文章' }, { status: 404 });
      }

      // 🔒 後端強制付費牆：依文章 visibility 決定是否回傳付費內容，
      //    避免前端鎖被繞過（直接打 API / 看 network response 即可拿到全文）
      const visibility = data.visibility || 'public';
      const hasAccess = await canAccess(session?.user as SessionUser | undefined, {
        kind: 'article',
        visibility,
        requiredCourseIds: data.required_course_ids,
      });

      if (!hasAccess) {
        // 不外洩付費正文；保留標題/摘要/解鎖所需的 required_course_ids 供前端顯示鎖卡
        data.content = '';
        data.locked = true;
        data.lockType = visibility;
      }
      return NextResponse.json(data);
    } else {
      // Fetch all published articles（清單僅取必要欄位，不抓大欄位 content：兼顧效能與不外洩付費正文）
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, author, date, views, category, summary, image_url, status, slug, tags, is_pinned, visibility, required_course_ids')
        .eq('status', 'published')
        .order('date', { ascending: false });

      if (error) throw error;

      // 🔒 列表不外洩付費文章正文：非公開（members/course_purchasers）文章清空 content，
      //    避免訪客直接打 /api/articles 就能讀到付費全文而繞過單篇付費牆。
      //    列表 UI 僅使用標題/摘要/中繼資料，不需要 content。
      const sanitized = ((data || []) as ArticleRow[]).map((a) => {
        if ((a.visibility || 'public') !== 'public') {
          return { ...a, content: '', locked: true, lockType: a.visibility };
        }
        return a;
      });
      return NextResponse.json(sanitized);
    }
  } catch (error) {
    const err = error as SupabaseLikeError;
    // 對外只回制式訊息，不洩漏資料庫錯誤/欄位名；詳細只寫伺服器日誌
    console.error("Public API GET articles error:", err?.message, err?.code);
    return NextResponse.json({ error: "伺服器忙碌，請稍後再試" }, { status: 500 });
  }
}
