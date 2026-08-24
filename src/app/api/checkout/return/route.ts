import { NextResponse } from 'next/server';
import { PayuniTool } from '@/lib/payuni';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const encryptInfo = formData.get('EncryptInfo') as string;
    const hashInfo = formData.get('HashInfo') as string;

    const HashKey = process.env.PAYUNI_HASH_KEY;
    const HashIV = process.env.PAYUNI_HASH_IV;
    
    // 預設跳轉頁面
    const rawBaseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    let fallbackRedirect = `${baseUrl}/courses`;

    if (!HashKey || !HashIV || !encryptInfo) {
      console.warn('[PayUni Return] Missing keys or encryptInfo');
      return NextResponse.redirect(fallbackRedirect, 303);
    }

    const tool = new PayuniTool(HashKey, HashIV);

    // 1. 驗證 HashInfo 避免偽造
    const calculatedHash = tool.generateHash(encryptInfo);
    const a = Buffer.from(calculatedHash);
    const b = Buffer.from(hashInfo || '');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.warn('[PayUni Return] Invalid HashInfo signature');
      return NextResponse.redirect(fallbackRedirect, 303);
    }

    // 2. 解密交易結果
    const decodedData = tool.decrypt(encryptInfo);
    console.log('[PayUni Return] Decoded transaction data:', decodedData);
    const merTradeNo = decodedData.MerTradeNo;

    if (merTradeNo) {
      // 3. 查資料庫確認訂單購買的品項
      const { data: order } = await supabase
        .from('orders')
        .select('course_id, membership_plan_id, download_id')
        .eq('id', merTradeNo)
        .single();

      if (order) {
        if (order.course_id) {
          fallbackRedirect = `${baseUrl}/courses/${order.course_id}`;
        } else if (order.membership_plan_id) {
          fallbackRedirect = `${baseUrl}/membership`;
        } else if (order.download_id) {
          fallbackRedirect = `${baseUrl}/downloads`;
        }
      }
    }

    console.log(`[PayUni Return] Redirecting user via GET to: ${fallbackRedirect}`);
    return NextResponse.redirect(fallbackRedirect, 303);
  } catch (error) {
    console.error('[PayUni Return] Error handling return POST redirect:', error);
    const rawBaseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    return NextResponse.redirect(`${baseUrl}/courses`, 303);
  }
}

export async function GET(req: Request) {
  const rawBaseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  return NextResponse.redirect(`${baseUrl}/courses`, 303);
}
