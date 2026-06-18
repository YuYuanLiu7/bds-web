import { PayuniTool } from '@/lib/payuni';
import { supabase } from '@/lib/supabase';
import { sendPurchaseSuccessEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const encryptInfo = formData.get('EncryptInfo') as string;
    const hashInfo = formData.get('HashInfo') as string;

    // 🔒 金鑰必須由環境變數提供；缺漏直接拒絕，避免以可預測預設金鑰驗章而被偽造
    const HashKey = process.env.PAYUNI_HASH_KEY;
    const HashIV = process.env.PAYUNI_HASH_IV;
    if (!HashKey || !HashIV) {
      console.error('PayUni env not configured in callback');
      return new Response('ERROR');
    }

    const tool = new PayuniTool(HashKey, HashIV);

    // 1. 驗證 HashInfo（常數時間比較，消除時序側信道）
    const calculatedHash = tool.generateHash(encryptInfo);
    const a = Buffer.from(calculatedHash);
    const b = Buffer.from(hashInfo || '');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.error('Invalid HashInfo');
      return new Response('ERROR');
    }

    // 2. 解密 EncryptInfo
    const decodedData = tool.decrypt(encryptInfo);
    console.log('Payment Callback Data:', decodedData);

    const merTradeNo = decodedData.MerTradeNo;

    // 3. 檢查支付狀態
    if (decodedData.Status === 'SUCCESS') {
      // 先取出資料庫中的原始訂單，後續據此進行防重送與金額校驗
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', merTradeNo)
        .single();

      if (!order || orderError) {
        console.error('Callback success for unknown order:', merTradeNo);
        return new Response('ERROR');
      }

      // 防重送攻擊 (Replay Attack)：已完成的訂單不再重複開通權限與重寄信，
      // 但仍回傳 SUCCESS 讓 PayUni 不再重送通知。
      if (order.status === 'paid') {
        console.warn('Duplicate paid callback ignored for order:', merTradeNo);
        return new Response('SUCCESS');
      }

      // 金額一致性校驗：比對 PayUni 回傳的 TradeAmt 與資料庫預存金額，
      // 防止有心人士在金流端竄改交易金額（低買）。
      const callbackAmount = Number(decodedData.TradeAmt);
      if (!Number.isFinite(callbackAmount) || callbackAmount !== Number(order.amount)) {
        console.error(
          `Amount mismatch on callback for order ${merTradeNo}: ` +
          `callback=${decodedData.TradeAmt} vs db=${order.amount}`
        );
        await supabase
          .from('orders')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', merTradeNo);
        return new Response('ERROR');
      }

      // 校驗通過，原子地將訂單由「非 paid」更新為 paid（條件式更新 + 回傳受影響列），
      // 避免 PayUni 並發/重送通知造成「先讀後寫」競態而重複開通、重複寄信。
      const { data: updatedRows, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_type: decodedData.PaymentType,
          updated_at: new Date().toISOString()
        })
        .eq('id', merTradeNo)
        .neq('status', 'paid')
        .select('id');

      // 若沒有任何列被更新（已被另一個並發回呼搶先標記 paid），視為重送，直接結束不重複開通
      if (!updateError && (!updatedRows || updatedRows.length === 0)) {
        console.warn('Concurrent duplicate paid callback ignored for order:', merTradeNo);
        return new Response('SUCCESS');
      }

      if (!updateError) {
        if (order.course_id) {
          // 開通課程權限
          await supabase.from('user_courses').upsert({
            user_id: order.user_id,
            course_id: order.course_id,
            purchased_at: new Date().toISOString()
          });
        } else if (order.download_id) {
          // 開通數位下載擁有權
          await supabase.from('user_downloads').upsert({
            user_id: order.user_id,
            download_id: order.download_id,
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
              // 查不到方案時不臆測付款週期，保留 expiresAt 為 null，
              // 避免把「一次性永久會員」誤設成 30 天到期。改以記錄警告供後台稽核補正。
              console.warn(`Membership plan ${order.membership_plan_id} not found in callback; leaving membership_expires_at as null.`);
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
          } else if (order.download_id) {
            const { data: download } = await supabase
              .from('downloads')
              .select('title')
              .eq('id', order.download_id)
              .single();
            if (download) purchasedItemName = `數位下載 - ${download.title}`;
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
