import { NextResponse } from 'next/server';
import { resolvePurchasable, PurchaseType } from '@/lib/purchases';
import { validateCoupon } from '@/lib/coupons';

// 公開折扣碼驗證 API：供前台顯示「折後金額」用。
// 🔒 原價由伺服器端以 resolvePurchasable 取得，折抵與最終金額一律伺服器端計算，
//    不信任前端傳入的任何金額。此端點僅為顯示用，真正的金額仍以結帳 API 為準。

interface ValidateBody {
  code?: string;
  type?: PurchaseType;
  id?: string;
}

export async function POST(req: Request) {
  try {
    const body: ValidateBody = await req.json();
    const { code, type = 'course', id } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { valid: false, discountAmount: 0, finalAmount: 0, message: '請輸入折扣碼' },
        { status: 400 }
      );
    }

    // 以伺服器端取得品項原價（防止前端竄改價格）
    const resolved = await resolvePurchasable(type, id);
    if (!resolved.ok) {
      return NextResponse.json(
        { valid: false, discountAmount: 0, finalAmount: 0, message: resolved.error },
        { status: 400 }
      );
    }

    const price = resolved.item.amount;
    const result = await validateCoupon(code, price);

    // 只回傳前端需要的欄位（不外洩折扣碼內部設定如 usage_limit/used_count）
    return NextResponse.json({
      valid: result.valid,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      message: result.message,
    });
  } catch (error) {
    console.error('Coupon validate error:', error);
    return NextResponse.json(
      { valid: false, discountAmount: 0, finalAmount: 0, message: '折扣碼驗證失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
