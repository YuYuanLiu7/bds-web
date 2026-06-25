import { NextResponse } from 'next/server';
import { PayuniTool } from '@/lib/payuni';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 結帳請求主體（金額一律以資料庫為準，此處僅用於指定品項與類型）
interface CheckoutBody {
  courseId?: string;
  planId?: string;
  downloadId?: string;
  type?: 'course' | 'membership' | 'download';
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

    // 🔒 金額一律以資料庫為準，不信任前端傳入的 amount，避免竄改價格低買
    let amount: number;
    let prodDesc: string;
    if (type === 'membership') {
      const { data: plan, error: planErr } = await supabase
        .from('membership_plans')
        .select('price, title')
        .eq('id', planId)
        .single();
      if (planErr || !plan) {
        return NextResponse.json({ error: '找不到指定的會員方案' }, { status: 400 });
      }
      amount = plan.price;
      prodDesc = `Subscribe to ${plan.title}`;
    } else if (type === 'download') {
      const { data: download, error: downloadErr } = await supabase
        .from('downloads')
        .select('price, title')
        .eq('id', downloadId)
        .single();
      if (downloadErr || !download) {
        return NextResponse.json({ error: '找不到指定的數位下載商品' }, { status: 400 });
      }
      amount = download.price;
      prodDesc = `Purchase ${download.title}`;
    } else {
      const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('price, title')
        .eq('id', courseId)
        .single();
      if (courseErr || !course) {
        return NextResponse.json({ error: '找不到指定的課程' }, { status: 400 });
      }
      amount = course.price;
      prodDesc = `Purchase ${course.title}`;
    }

    const cleanBaseUrl = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
    const PAYUNI_CONFIG = {
      MerID,
      HashKey,
      HashIV,
      ReturnURL: `${cleanBaseUrl}/api/checkout/return`,
      NotifyURL: `${cleanBaseUrl}/api/webhook/payuni`,
    };

    const tool = new PayuniTool(PAYUNI_CONFIG.HashKey, PAYUNI_CONFIG.HashIV);

    const merTradeNo = `BDS${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Record order in database
    if (session?.user?.email) {
      // Find user id by email
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (userData) {
        if (type === 'membership') {
          try {
            await supabase.from('orders').insert({
              id: merTradeNo,
              user_id: userData.id,
              membership_plan_id: planId,
              amount: amount,
              status: 'pending'
            });
          } catch (dbErr) {
            console.warn("DB insert membership order failed (table migration might not be executed yet):", dbErr);
            // Fallback insert without membership_plan_id
            await supabase.from('orders').insert({
              id: merTradeNo,
              user_id: userData.id,
              amount: amount,
              status: 'pending'
            });
          }
        } else if (type === 'download') {
          await supabase.from('orders').insert({
            id: merTradeNo,
            user_id: userData.id,
            download_id: downloadId,
            amount: amount,
            status: 'pending'
          });
        } else {
          await supabase.from('orders').insert({
            id: merTradeNo,
            user_id: userData.id,
            course_id: courseId,
            amount: amount,
            status: 'pending'
          });
        }
      }
    }

    const encryptParams = {
      MerID: PAYUNI_CONFIG.MerID,
      MerTradeNo: merTradeNo,
      TradeAmt: amount,
      Timestamp: timestamp,
      ProdDesc: prodDesc,
      ReturnURL: PAYUNI_CONFIG.ReturnURL,
      NotifyURL: PAYUNI_CONFIG.NotifyURL,
      Version: '2.0',
    };

    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(encryptParams)) usp.append(k, String(v));
    const plainText = usp.toString();
    console.log(`[DEBUG PayUni PlainText] ${plainText}`);

    const encryptInfo = tool.encrypt(encryptParams);
    const hashInfo = tool.generateHash(encryptInfo);

    console.log(`[DEBUG PayUni Payload] Amount: ${amount}, MerTradeNo: ${merTradeNo}`);
    console.log(`[DEBUG PayUni Payload] EncryptInfo: ${encryptInfo}`);
    console.log(`[DEBUG PayUni Payload] HashInfo: ${hashInfo}`);

    return NextResponse.json({
      MerID: PAYUNI_CONFIG.MerID,
      Version: '2.0',
      EncryptInfo: encryptInfo,
      HashInfo: hashInfo,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
