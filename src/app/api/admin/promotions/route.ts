import { supabase } from "@/lib/supabase";
import { parsePrice } from "@/lib/validate";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// 行銷促銷方案 CRUD API
// 對應資料表：promotions（見 db/add_promotions.sql）
// 全部端點皆需管理員權限，並且不觸及金流結帳與 membership_plans。

// 取得所有促銷方案清單
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("查詢 promotions 失敗：", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 新增一筆促銷方案
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { title, price, period, description, status } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "方案名稱為必填欄位" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('promotions')
      .insert([{
        title: String(title).trim(),
        price: parsePrice(price),
        period: period || '限時',
        description: description ?? '',
        status: status || 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 更新一筆促銷方案
export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { id, title, price, period, description, status } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少方案 ID" }, { status: 400 });
    }
    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "方案名稱為必填欄位" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('promotions')
      .update({
        title: String(title).trim(),
        price: parsePrice(price),
        period: period || '限時',
        description: description ?? '',
        status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 刪除一筆促銷方案
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "缺少方案 ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "促銷方案已成功刪除" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
