import { NextResponse } from 'next/server';
import { PayuniTool } from '@/lib/payuni';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { courseId, planId, type = 'course' } = body;

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

    const PAYUNI_CONFIG = {
      MerID: process.env.PAYUNI_MERID || 'MS12345678',
      HashKey: process.env.PAYUNI_HASH_KEY || 'YOUR_PAYUNI_HASH_KEY',
      HashIV: process.env.PAYUNI_HASH_IV || 'YOUR_PAYUNI_HASH_IV',
      ReturnURL: type === 'membership' 
        ? `${process.env.NEXTAUTH_URL}/membership`
        : `${process.env.NEXTAUTH_URL}/courses/${courseId}`,
      NotifyURL: `${process.env.NEXTAUTH_URL}/api/checkout/callback`,
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

    const encryptInfo = tool.encrypt(encryptParams);
    const hashInfo = tool.generateHash(encryptInfo);

    return NextResponse.json({
      MerID: PAYUNI_CONFIG.MerID,
      Version: '2.0',
      EncryptInfo: encryptInfo,
      HashInfo: hashInfo,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
