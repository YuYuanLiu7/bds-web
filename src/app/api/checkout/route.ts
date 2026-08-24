import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { resolvePurchasable, createOrder, buildPayuniCheckout, PurchaseType } from '@/lib/purchases';

// 結帳請求主體（金額一律以資料庫為準，此處僅用於指定品項與類型）
interface CheckoutBody {
  courseId?: string;
  planId?: string;
  downloadId?: string;
  type?: PurchaseType;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // 🔒 未登入不可發起結帳（避免產生無對應使用者的付款）
    if (!session?.user?.email) {
      return NextResponse.json({ error: '請先登入再進行結帳' }, { status: 401 });
    }

    // 🔒 金流金鑰必須由環境變數提供；缺漏時直接拒絕（fail-fast），
    //    避免以無效預設金鑰送出交易、產生髒訂單或可被偽造的簽章
    const MerID = process.env.PAYUNI_MERID;
    const HashKey = process.env.PAYUNI_HASH_KEY;
    const HashIV = process.env.PAYUNI_HASH_IV;

    console.log(`[DEBUG PayUni Env] MerID: ${MerID}`);
    console.log(`[DEBUG PayUni Env] HashKey length: ${HashKey?.length}, starts with: ${HashKey?.substring(0, 4)}`);
    console.log(`[DEBUG PayUni Env] HashIV length: ${HashIV?.length}, starts with: ${HashIV?.substring(0, 4)}`);

    if (!MerID || !HashKey || !HashIV) {
      console.error('PayUni env not configured (PAYUNI_MERID/HASH_KEY/HASH_IV)');
      return NextResponse.json({ error: '金流尚未設定，請聯絡客服' }, { status: 500 });
    }

    const body: CheckoutBody = await req.json();
    const { courseId, planId, downloadId, type = 'course' } = body;
    const itemId = type === 'membership' ? planId : type === 'download' ? downloadId : courseId;

    // 依購買類型解析品項（金額以資料庫為準，防止竄改價格低買）
    const resolved = await resolvePurchasable(type, itemId);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const { item } = resolved;

    const merTradeNo = `BDS${Date.now()}`;

    // 建立 pending 訂單（依 email 找使用者）
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();
    if (userData) {
      await createOrder(merTradeNo, userData.id, item.amount, item.orderFields);
    }

    // ReturnURL 統一走 /api/checkout/return：由該端點驗章後依訂單品項導回正確頁面
    const cleanBaseUrl = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');

    return NextResponse.json(
      buildPayuniCheckout({
        merId: MerID,
        hashKey: HashKey,
        hashIV: HashIV,
        merTradeNo,
        amount: item.amount,
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
