import { NextResponse } from 'next/server';
import { PayuniTool } from '@/lib/payuni';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const merId = formData.get('MerID') as string;
    const encryptInfo = formData.get('EncryptInfo') as string;
    const hashInfo = formData.get('HashInfo') as string;

    const PAYUNI_CONFIG = {
      HashKey: process.env.PAYUNI_HASH_KEY || 'YOUR_PAYUNI_HASH_KEY',
      HashIV: process.env.PAYUNI_HASH_IV || 'YOUR_PAYUNI_HASH_IV',
    };

    const tool = new PayuniTool(PAYUNI_CONFIG.HashKey, PAYUNI_CONFIG.HashIV);

    // 1. 驗證 HashInfo
    const calculatedHash = tool.generateHash(encryptInfo);
    if (calculatedHash !== hashInfo) {
      console.error('Invalid HashInfo');
      return new Response('ERROR');
    }

    // 2. 解密 EncryptInfo
    const decodedData = tool.decrypt(encryptInfo);
    console.log('Payment Callback Data:', decodedData);

    const merTradeNo = decodedData.MerTradeNo;

    // 3. 檢查支付狀態
    if (decodedData.Status === 'SUCCESS') {
      // 更新訂單狀態
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid', 
          payment_type: decodedData.PaymentType,
          updated_at: new Date().toISOString()
        })
        .eq('id', merTradeNo)
        .select()
        .single();

      if (order && !orderError) {
        // 開通課程權限
        await supabase.from('user_courses').upsert({
          user_id: order.user_id,
          course_id: order.course_id,
          purchased_at: new Date().toISOString()
        });
      }
      
      console.log('Payment success and access granted:', merTradeNo);
      return new Response('SUCCESS');
    } else {
      // 更新訂單為失敗
      await supabase
        .from('orders')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', merTradeNo);
    }

    return new Response('FAILED');
  } catch (error) {
    console.error('Callback error:', error);
    return new Response('ERROR');
  }
}
