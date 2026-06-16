import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasActiveMembership } from "@/lib/users";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch a single article by ID or custom Slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const query = supabase.from('articles').select('*');
      const { data, error } = await (isUUID ? query.eq('id', id) : query.eq('slug', id)).single();

      if (error) throw error;

      // 🔒 後端強制付費牆：依文章 visibility 決定是否回傳付費內容，
      //    避免前端鎖被繞過（直接打 API / 看 network response 即可拿到全文）
      const visibility = data.visibility || 'public';
      const session = await getServerSession(authOptions);
      const isAdmin = !!session && (session.user as any)?.role === 'admin';
      let hasAccess = isAdmin || visibility === 'public';

      if (!hasAccess && visibility === 'members') {
        // 會員限定文章需為「有效付費會員」（含到期日判斷），僅登入不足以解鎖
        const userId = (session?.user as any)?.id;
        hasAccess = userId ? await hasActiveMembership(userId) : false;
      }
      if (!hasAccess && visibility === 'course_purchasers') {
        const userId = (session?.user as any)?.id;
        const requiredIds = (data.required_course_ids || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (userId && requiredIds.length > 0) {
          const { data: owned } = await supabase
            .from('user_courses')
            .select('course_id')
            .eq('user_id', userId)
            .in('course_id', requiredIds);
          hasAccess = !!(owned && owned.length > 0);
        }
      }

      if (!hasAccess) {
        // 不外洩付費正文；保留標題/摘要/解鎖所需的 required_course_ids 供前端顯示鎖卡
        data.content = '';
        data.locked = true;
        data.lockType = visibility;
      }
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
