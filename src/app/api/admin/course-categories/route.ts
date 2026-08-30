import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// 課程分類寫入欄位型別
interface CategoryWriteData {
  name?: string;
  slug?: string | null;
  sort_order?: number;
}

// GET：列出所有課程分類（依 sort_order 升冪，其次以建立時間）
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { data, error } = await supabase
      .from('course_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      // 相容處理：資料表尚未建立時回傳空陣列，避免整個後台壞掉
      if (error.message.includes('does not exist')) {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// POST：新增課程分類（name 必填，slug 選填）
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: "請輸入分類名稱" }, { status: 400 });
    }

    const insertData: CategoryWriteData = {
      name,
      slug: (typeof body.slug === 'string' && body.slug.trim()) ? body.slug.trim() : null,
    };
    if (typeof body.sort_order === 'number') {
      insertData.sort_order = body.sort_order;
    }

    const { data, error } = await supabase
      .from('course_categories')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: "課程分類資料表尚未建立，請先執行 db/add_course_categories.sql" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// PATCH：更新分類（改名 / 改 slug / 改排序）
// 支援兩種格式：
//   1. 單筆：{ id, name?, slug?, sort_order? }
//   2. 批次排序：[{ id, sort_order }, ...]
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();

    // 批次排序模式
    if (Array.isArray(body)) {
      const items = body
        .filter((it): it is { id: string; sort_order: number } =>
          !!it && typeof (it as { id?: unknown }).id === 'string' &&
          typeof (it as { sort_order?: unknown }).sort_order === 'number')
        .map(it => ({ id: it.id, sort_order: it.sort_order }));

      if (items.length === 0) {
        return NextResponse.json({ error: "沒有可更新的有效排序項目" }, { status: 400 });
      }

      for (const item of items) {
        const { error } = await supabase
          .from('course_categories')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);
        if (error) throw error;
      }

      return NextResponse.json({ message: "分類排序已更新", count: items.length });
    }

    // 單筆更新模式
    const { id } = body;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: "缺少分類 ID" }, { status: 400 });
    }

    const updateData: CategoryWriteData = {};
    if (typeof body.name === 'string') updateData.name = body.name.trim();
    if ('slug' in body) {
      updateData.slug = (typeof body.slug === 'string' && body.slug.trim()) ? body.slug.trim() : null;
    }
    if (typeof body.sort_order === 'number') updateData.sort_order = body.sort_order;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('course_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// DELETE：刪除分類（?id=）
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "缺少分類 ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from('course_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "分類已刪除" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
