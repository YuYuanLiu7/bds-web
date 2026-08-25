import { PayuniTool } from '@/lib/payuni';
import { getOrder, markOrderPaid, markOrderFailed, fulfillOrder } from '@/lib/purchases';
import { sendAdminAlert } from '@/lib/email';
import crypto from 'crypto';

// PayUni 付款結果回呼（Webhook）：驗章 → 校驗訂單 → 原子標記 paid → 履約。
// 訂單流轉與履約邏輯集中在 src/lib/purchases.ts，此處僅負責 HTTP/驗章轉接。
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

    // 2. 解密 EncryptInfo（僅記錄必要欄位，避免將買家個資/卡片遮罩資訊寫入日誌）
    const decodedData = tool.decrypt(encryptInfo);
    const merTradeNo = decodedData.MerTradeNo;
    console.log(`[PayUni Callback] MerTradeNo: ${merTradeNo}, Status: ${decodedData.Status}`);

    // 3. 非成功通知：標記失敗（已 paid 的訂單不會被降級）
    if (decodedData.Status !== 'SUCCESS') {
      await markOrderFailed(merTradeNo);
      return new Response('FAILED');
    }

    // 4. 取出資料庫中的原始訂單，據此進行防重送與金額校驗
    const order = await getOrder(merTradeNo);
    if (!order) {
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
      await markOrderFailed(merTradeNo);
      return new Response('ERROR');
    }

    // 5. 原子地將訂單標記為 paid
    const result = await markOrderPaid(merTradeNo, decodedData.PaymentType);
    if (result === 'duplicate') {
      // 被並發回呼搶先，不重複履約
      console.warn('Concurrent duplicate paid callback ignored for order:', merTradeNo);
      return new Response('SUCCESS');
    }
    if (result === 'error') {
      // DB 更新失敗：回 ERROR 讓 PayUni 重送通知以自我修復，避免訂單卡在 pending、權益不發放
      console.error('markOrderPaid 失敗，回 ERROR 以觸發 PayUni 重送：', merTradeNo);
      return new Response('ERROR');
    }

    // result === 'updated'：履約（開通權益 + 寄送通知信）
    // 訂單此時已標記 paid，若履約失敗回 ERROR 會使 PayUni 重送卻被 paid 短路而永不履約；
    // 因此改為記錄明確的嚴重告警供人工補開通，仍回 SUCCESS。
    try {
      await fulfillOrder(order);
      console.log('Payment success and access granted:', merTradeNo);
    } catch (fulfillErr) {
      const detail = fulfillErr instanceof Error ? fulfillErr.message : String(fulfillErr);
      console.error(
        `[需人工處理] 訂單 ${merTradeNo} 已付款(paid)但權益開通失敗，請至後台手動補開通：`,
        fulfillErr
      );
      // 主動寄警示信給站方，不必等客訴（寄信失敗不影響回應）
      await sendAdminAlert(
        '訂單已付款但開通失敗，需人工補開通',
        `訂單編號：${merTradeNo}\n狀態：已收款(paid)，但自動開通權益失敗。\n錯誤：${detail}\n\n請至後台為該學員手動開通對應課程/會員。`
      ).catch(() => {});
    }
    return new Response('SUCCESS');
  } catch (error) {
    console.error('Callback error:', error);
    return new Response('ERROR');
  }
}
