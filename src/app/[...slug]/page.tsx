import { getJsonSetting, SETTINGS_DEFAULTS } from "@/lib/site-settings";
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import type { Metadata } from "next";

export const revalidate = 0;

interface PageRecord {
  path: string;
  status?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
}

// 後台「頁面管理」建立的自訂頁面（存於 site_settings 的 pages）會在此 catch-all 路由渲染，
// 讓管理員新增的路徑（例如 /faq、/news）在前台真的打得開；僅渲染「已發佈」狀態，草稿回 404。
// 既有的具體路由（/about、/courses 等）優先級高於 catch-all，不受影響。
async function findPage(slug: string[]): Promise<PageRecord | null> {
  const path = "/" + (slug || []).join("/");
  const pages = await getJsonSetting<PageRecord[]>("pages", SETTINGS_DEFAULTS.pages as PageRecord[]);
  return (pages || []).find((p) => p.path === path) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page || (page.status ?? "published") !== "published") return { title: "找不到頁面" };
  return { title: page.title || page.path, description: page.subtitle || undefined };
}

export default async function DynamicCmsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page || (page.status ?? "published") !== "published") {
    notFound();
  }

  // 內容可能以字面 \n 儲存，正規化為真換行後以 whitespace-pre-line 呈現
  const content = (page!.content || "").replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-20 font-sans">
      <section className="py-12 md:py-20 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4 whitespace-pre-line">
          {page!.title || ""}
        </h1>
        {page!.subtitle && (
          <p className="text-slate-500 text-sm md:text-base font-semibold max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
            {page!.subtitle}
          </p>
        )}
      </section>

      <section className="max-w-3xl mx-auto px-6 space-y-8">
        {page!.imageUrl && (
          <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs">
            <SafeImage src={page!.imageUrl} alt={page!.title || ""} className="w-full h-full object-cover" />
          </div>
        )}
        {content && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-10 shadow-xs">
            <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
