import { supabase } from "@/lib/supabase";
import { parsePrice } from "@/lib/validate";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// 課程寫入欄位型別（部分欄位視資料庫遷移狀態而定，故皆為選填）
interface CourseWriteData {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  thumbnail_url?: string;
  instructor?: string;
  is_published?: boolean;
  is_hidden?: boolean;
  allow_comments?: boolean;
  allow_ratings?: boolean;
  file_url?: string | null;
  video_url?: string | null;
  // 新增課程欄位（銷售 / SEO / 排序）
  subtitle?: string | null;
  slug?: string | null;
  points?: string | null;
  total_hours?: string | null;
  start_date?: string | null;
  course_type?: string;
  is_featured?: boolean;
  show_student_count?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_no_index?: boolean;
  sort_order?: number;
  membership_included?: boolean;
}

// 依請求內容組出完整寫入 payload（含新欄位）
function buildFullData(body: Record<string, unknown>): CourseWriteData {
  const data: CourseWriteData = {
    title: body.title as string,
    description: body.description as string,
    price: parsePrice(body.price),
    category: body.category as string,
    thumbnail_url: body.thumbnail_url as string,
    is_published: body.is_published !== false,
    is_hidden: !!body.is_hidden,
    allow_comments: body.allow_comments !== false,
    allow_ratings: body.allow_ratings !== false,
    file_url: (body.file_url as string) || null,
    video_url: (body.video_url as string) || null,
    // 新欄位
    subtitle: (body.subtitle as string) || null,
    slug: (body.slug as string) || null,
    points: (body.points as string) || null,
    total_hours: (body.total_hours as string) || null,
    start_date: (body.start_date as string) || null, // 空字串轉 null，避免 DATE 欄位解析錯誤
    course_type: body.course_type === 'free' ? 'free' : 'paid',
    is_featured: !!body.is_featured,
    show_student_count: !!body.show_student_count,
    membership_included: !!body.membership_included,
    seo_title: (body.seo_title as string) || null,
    seo_description: (body.seo_description as string) || null,
    seo_no_index: !!body.seo_no_index,
  };
  if (body.instructor) {
    data.instructor = body.instructor as string;
  }
  if (typeof body.sort_order === 'number') {
    data.sort_order = body.sort_order;
  }
  return data;
}

// 資料庫尚未遷移（缺欄位）時的最小相容 payload
function buildMinimalData(body: Record<string, unknown>, withInstructor: boolean): CourseWriteData {
  const data: CourseWriteData = {
    title: body.title as string,
    description: body.description as string,
    price: parsePrice(body.price),
    category: body.category as string,
    thumbnail_url: body.thumbnail_url as string,
    is_published: body.is_published !== false,
  };
  if (withInstructor && body.instructor) {
    data.instructor = body.instructor as string;
  }
  return data;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();

    const insertData = buildFullData(body);

    let { data, error } = await supabase
      .from('courses')
      .insert([insertData])
      .select()
      .single();

    if (error && error.message.includes('does not exist')) {
      // 有欄位尚未遷移：改以最小欄位集合重試（先帶 instructor）
      let retry = await supabase
        .from('courses')
        .insert([buildMinimalData(body, true)])
        .select()
        .single();

      // 第二層相容：若連 instructor 欄位也不存在，去除後再試
      if (retry.error && retry.error.message.includes('does not exist')) {
        retry = await supabase
          .from('courses')
          .insert([buildMinimalData(body, false)])
          .select()
          .single();
      }

      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { id } = body;

    const updateData = buildFullData(body);

    let { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error && error.message.includes('does not exist')) {
      // 有欄位尚未遷移：改以最小欄位集合重試（先帶 instructor）
      let retry = await supabase
        .from('courses')
        .update(buildMinimalData(body, true))
        .eq('id', id)
        .select()
        .single();

      // 第二層相容：若連 instructor 欄位也不存在，去除後再試
      if (retry.error && retry.error.message.includes('does not exist')) {
        retry = await supabase
          .from('courses')
          .update(buildMinimalData(body, false))
          .eq('id', id)
          .select()
          .single();
      }

      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PATCH：批次更新課程顯示順序（sort_order）
// 接收格式：直接傳陣列 [{ id, sort_order }]，或 { items: [{ id, sort_order }] }
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const rawItems: unknown = Array.isArray(body) ? body : (body?.items ?? []);

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "缺少排序資料（需為 [{ id, sort_order }] 陣列）" }, { status: 400 });
    }

    // 過濾出合法項目（id 為字串、sort_order 為數字）
    const items = rawItems
      .filter((it): it is { id: string; sort_order: number } =>
        !!it && typeof (it as { id?: unknown }).id === 'string' &&
        typeof (it as { sort_order?: unknown }).sort_order === 'number')
      .map(it => ({ id: it.id, sort_order: it.sort_order }));

    if (items.length === 0) {
      return NextResponse.json({ error: "沒有可更新的有效排序項目" }, { status: 400 });
    }

    // 逐筆更新（項目數量有限，逐筆即可；並偵測欄位是否存在）
    for (const item of items) {
      const { error } = await supabase
        .from('courses')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);

      if (error) {
        // 欄位尚未遷移：明確回報，讓前端知道需先執行 db/add_course_fields.sql
        if (error.message.includes('does not exist')) {
          return NextResponse.json(
            { error: "課程尚未建立 sort_order 欄位，請先執行 db/add_course_fields.sql" },
            { status: 409 }
          );
        }
        throw error;
      }
    }

    return NextResponse.json({ message: "課程排序已更新", count: items.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
