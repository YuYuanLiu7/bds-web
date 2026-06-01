import { NextResponse } from 'next/server';
import { PayuniTool } from '@/lib/payuni';
import { supabase } from '@/lib/supabase';
import { sendPurchaseSuccessEmail } from '@/lib/email';

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
        if (order.course_id) {
          // 開通課程權限
          await supabase.from('user_courses').upsert({
            user_id: order.user_id,
            course_id: order.course_id,
            purchased_at: new Date().toISOString()
          });
        } else if (order.membership_plan_id) {
          // 開通會員方案訂閱權限
          try {
            // 查詢該會員方案的付款週期，用以計算到期日
            const { data: plan } = await supabase
              .from('membership_plans')
              .select('period')
              .eq('id', order.membership_plan_id)
              .single();
            
            let expiresAt = null;
            if (plan) {
              const now = new Date();
              if (plan.period === '月繳') {
                now.setMonth(now.getMonth() + 1);
                expiresAt = now.toISOString();
              } else if (plan.period === '年繳') {
                now.setFullYear(now.getFullYear() + 1);
                expiresAt = now.toISOString();
              } // '一次性' expiresAt 為 null 代表無期限
            } else {
              // 備援：若查不到方案，依交易慣例預設月繳 30 天
              const now = new Date();
              now.setMonth(now.getMonth() + 1);
              expiresAt = now.toISOString();
            }

            // 更新使用者的訂閱方案與過期日
            await supabase
              .from('users')
              .update({
                membership_plan_id: order.membership_plan_id,
                membership_expires_at: expiresAt
              })
              .eq('id', order.user_id);
          } catch (mErr) {
            console.error("Failed to process membership order callback (table might not exist yet):", mErr);
          }
        }

        // 寄送購買成功通知信
        try {
          const { data: user } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', order.user_id)
            .single();

          let purchasedItemName = '線上項目';
          if (order.course_id) {
            const { data: course } = await supabase
              .from('courses')
              .select('title')
              .eq('id', order.course_id)
              .single();
            if (course) purchasedItemName = course.title;
          } else if (order.membership_plan_id) {
            const { data: plan } = await supabase
              .from('membership_plans')
              .select('title')
              .eq('id', order.membership_plan_id)
              .single();
            if (plan) purchasedItemName = `訂閱會員 - ${plan.title}`;
          }

          if (user && user.email) {
            await sendPurchaseSuccessEmail({
              email: user.email,
              name: user.name || '學員',
              itemName: purchasedItemName,
              amount: order.amount,
              tradeNo: order.id
            });
          }
        } catch (emailErr) {
          console.error("Failed to process email dispatch in callback:", emailErr);
        }
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
