import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

// 文章詳情頁為 client component 無法 export metadata，
// 改由此 server layout 依文章標題動態產生 SEO metadata（per-article 標題）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const query = supabase.from("articles").select("title, summary").limit(1);
    const { data } = await (isUUID ? query.eq("id", id) : query.eq("slug", id));
    const article = data?.[0];
    if (article?.title) {
      return {
        title: article.title,
        description: article.summary || `${article.title} — BDS 產業觀察專欄。`,
      };
    }
  } catch {
    // 查詢失敗時退回通用標題
  }
  return { title: "專欄文章" };
}

export default function ArticleDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
