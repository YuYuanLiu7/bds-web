import { NextResponse } from 'next/server';
import { PayuniTool } from '@/lib/payuni';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const { courseId, courseName, amount } = await req.json();

    const PAYUNI_CONFIG = {
      MerID: process.env.PAYUNI_MERID || 'MS12345678',
      HashKey: process.env.PAYUNI_HASH_KEY || 'YOUR_PAYUNI_HASH_KEY',
      HashIV: process.env.PAYUNI_HASH_IV || 'YOUR_PAYUNI_HASH_IV',
      ReturnURL: `${process.env.NEXTAUTH_URL}/courses/${courseId}`,
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
        await supabase.from('orders').insert({
          id: merTradeNo,
          user_id: userData.id,
          course_id: courseId,
          amount: amount,
          status: 'pending'
        });
      }
    }

    const encryptParams = {
      MerID: PAYUNI_CONFIG.MerID,
      MerTradeNo: merTradeNo,
      TradeAmt: amount,
      Timestamp: timestamp,
      ProdDesc: `Purchase ${courseName}`,
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
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
