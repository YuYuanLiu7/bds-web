import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { resolvePurchasable, createOrder, buildPayuniCheckout, PurchaseType, OrderCouponFields } from '@/lib/purchases';
import { rateLimit } from '@/lib/rate-limit';
import { validateCoupon, normalizeCouponCode } from '@/lib/coupons';

// 結帳請求主體（金額一律以資料庫為準，此處僅用於指定品項與類型）
interface CheckoutBody {
  courseId?: string;
  planId?: string;
  downloadId?: string;
  type?: PurchaseType;
  // 選填折扣碼：有值才啟用折抵；折後金額一律於伺服器端重新計算
  couponCode?: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // 🔒 未登入不可發起結帳（避免產生無對應使用者的付款）
    if (!session?.user?.email) {
      return NextResponse.json({ error: '請先登入再進行結帳' }, { status: 401 });
    }

    // 速率限制：同一使用者每 10 分鐘最多 20 次結帳請求，避免大量產生 pending 髒訂單
    if (!(await rateLimit(`checkout:${session.user.email.toLowerCase()}`, 20, 600))) {
      return NextResponse.json({ error: '操作過於頻繁，請稍後再試' }, { status: 429 });
    }

    // 🔒 金流金鑰必須由環境變數提供；缺漏時直接拒絕（fail-fast），
    //    避免以無效預設金鑰送出交易、產生髒訂單或可被偽造的簽章
    const MerID = process.env.PAYUNI_MERID;
    const HashKey = process.env.PAYUNI_HASH_KEY;
    const HashIV = process.env.PAYUNI_HASH_IV;

    if (!MerID || !HashKey || !HashIV) {
      console.error('PayUni env not configured (PAYUNI_MERID/HASH_KEY/HASH_IV)');
      return NextResponse.json({ error: '金流尚未設定，請聯絡客服' }, { status: 500 });
    }

    const body: CheckoutBody = await req.json();
    const { courseId, planId, downloadId, type = 'course', couponCode } = body;
    const itemId = type === 'membership' ? planId : type === 'download' ? downloadId : courseId;

    // 依購買類型解析品項（金額以資料庫為準，防止竄改價格低買）
    const resolved = await resolvePurchasable(type, itemId);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const { item } = resolved;

    // 🔒 折扣碼處理（非破壞式）：沒有 couponCode 時 finalAmount 完全等於原價，行為與原本一致。
    //    有 couponCode 時，於伺服器端以同一套規則（validateCoupon）重新驗證並計算折後金額，
    //    絕不信任前端傳入的任何金額；折後金額已在 computeFinalAmount 夾到最低 1 元，不會送 0 元給 PayUni。
    let finalAmount = item.amount;
    let couponFields: OrderCouponFields | undefined;
    if (couponCode && couponCode.trim()) {
      const couponResult = await validateCoupon(couponCode, item.amount);
      if (!couponResult.valid) {
        return NextResponse.json({ error: couponResult.message }, { status: 400 });
      }
      finalAmount = couponResult.finalAmount;
      // 保險：即使計算結果異常，也不允許 <=0 的金額送出金流
      if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
        return NextResponse.json({ error: '折扣後金額為 0，請洽客服' }, { status: 400 });
      }
      couponFields = {
        coupon_code: normalizeCouponCode(couponCode),
        discount_amount: couponResult.discountAmount,
      };
    }

    // 訂單編號：加入隨機成分避免同一毫秒的並發結帳產生相同編號而互相覆蓋。
    // 以 base36 壓縮時間戳，控制長度在 ~17 字元（PayUni MerTradeNo 有長度上限，過長會被拒單）。
    const merTradeNo = `BDS${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;

    // 建立 pending 訂單（依 email 找使用者）。
    // 🔒 不變式：一定要先有 pending 訂單，才發出付款參數。
    //    否則使用者付了錢，callback 卻查無訂單可履約（收了錢卻不開通）。
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();
    if (!userData) {
      return NextResponse.json({ error: '找不到您的帳號資料，請重新登入後再試' }, { status: 400 });
    }
    try {
      // 以「折後金額」建立訂單：與稍後送 PayUni 的金額一致，
      // callback 端的金額一致性校驗（TradeAmt === order.amount）因此仍然成立，無需改動。
      await createOrder(merTradeNo, userData.id, finalAmount, item.orderFields, couponFields);
    } catch (orderErr) {
      console.error('建立訂單失敗，中止結帳：', orderErr);
      return NextResponse.json({ error: '建立訂單失敗，請稍後再試或聯絡客服' }, { status: 500 });
    }

    // ReturnURL 統一走 /api/checkout/return：由該端點驗章後依訂單品項導回正確頁面
    const cleanBaseUrl = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');

    return NextResponse.json(
      buildPayuniCheckout({
        merId: MerID,
        hashKey: HashKey,
        hashIV: HashIV,
        merTradeNo,
        amount: finalAmount,
        prodDesc: item.prodDesc,
        returnUrl: `${cleanBaseUrl}/api/checkout/return`,
        notifyUrl: `${cleanBaseUrl}/api/webhook/payuni`,
      })
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
