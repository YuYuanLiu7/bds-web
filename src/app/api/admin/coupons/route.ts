import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { normalizeCouponCode, CouponDiscountType } from '@/lib/coupons';
import { NextResponse } from 'next/server';

// 後台折扣碼管理 API（僅限管理員）：對 coupons 資料表進行 CRUD。
// code 一律以「大寫、去空白」正規化後存入，避免大小寫/空白造成查不到。

// 允許的折扣類型
const VALID_TYPES: CouponDiscountType[] = ['percent', 'fixed'];

// 將前端傳入的欄位轉為可寫入資料庫的安全值
function normalizeType(value: unknown): CouponDiscountType {
  return VALID_TYPES.includes(value as CouponDiscountType)
    ? (value as CouponDiscountType)
    : 'percent';
}

function toInt(value: unknown, fallback = 0): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

// 到期時間：空字串/未填 → null（表示不限期）
function toTimestampOrNull(value: unknown): string | null {
  if (!value || String(value).trim() === '') return null;
  return String(value);
}

// 使用次數上限：空字串/未填 → null（表示不限次）
function toLimitOrNull(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const code = normalizeCouponCode(body.code || '');
    if (!code) {
      return NextResponse.json({ error: '請輸入折扣碼' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        code,
        discount_type: normalizeType(body.discount_type),
        discount_value: toInt(body.discount_value, 0),
        active: body.active !== false,
        expires_at: toTimestampOrNull(body.expires_at),
        usage_limit: toLimitOrNull(body.usage_limit),
        min_amount: toInt(body.min_amount, 0),
      }])
      .select()
      .single();

    if (error) {
      // 唯一鍵衝突：折扣碼重複
      if (error.code === '23505') {
        return NextResponse.json({ error: '此折扣碼已存在，請換一組' }, { status: 400 });
      }
      throw error;
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: '缺少折扣碼 ID' }, { status: 400 });
    }

    // 僅更新有提供的欄位；used_count 不開放後台任意改動（由結帳流程維護）
    const patch: Record<string, unknown> = {};
    if (body.code !== undefined) {
      const code = normalizeCouponCode(body.code);
      if (!code) return NextResponse.json({ error: '折扣碼不可為空' }, { status: 400 });
      patch.code = code;
    }
    if (body.discount_type !== undefined) patch.discount_type = normalizeType(body.discount_type);
    if (body.discount_value !== undefined) patch.discount_value = toInt(body.discount_value, 0);
    if (body.active !== undefined) patch.active = body.active !== false;
    if (body.expires_at !== undefined) patch.expires_at = toTimestampOrNull(body.expires_at);
    if (body.usage_limit !== undefined) patch.usage_limit = toLimitOrNull(body.usage_limit);
    if (body.min_amount !== undefined) patch.min_amount = toInt(body.min_amount, 0);

    const { data, error } = await supabase
      .from('coupons')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '此折扣碼已存在，請換一組' }, { status: 400 });
      }
      throw error;
    }
    return NextResponse.json(data);
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
    if (!id) {
      return NextResponse.json({ error: '缺少折扣碼 ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: '折扣碼已刪除' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
