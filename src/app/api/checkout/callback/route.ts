import { PayuniTool } from '@/lib/payuni';
import { getOrder, markOrderPaid, markOrderFailed, markOrderFulfilled, releaseOrderFulfillment, fulfillOrder } from '@/lib/purchases';
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

    // 金額一致性校驗：比對 PayUni 回傳的 TradeAmt 與資料庫預存金額，
    // 防止有心人士在金流端竄改交易金額（低買）。
    // （已 paid 的重送也會走到這裡再校驗一次，金額本就一致，無副作用。）
    const callbackAmount = Number(decodedData.TradeAmt);
    if (!Number.isFinite(callbackAmount) || callbackAmount !== Number(order.amount)) {
      console.error(
        `Amount mismatch on callback for order ${merTradeNo}: ` +
        `callback=${decodedData.TradeAmt} vs db=${order.amount}`
      );
      await markOrderFailed(merTradeNo);
      return new Response('ERROR');
    }

    // 5. 原子地將訂單標記為 paid（首次通知會成功；重送/並發會得到 'duplicate'，皆繼續往下走履約認領）
    const result = await markOrderPaid(merTradeNo, decodedData.PaymentType);
    if (result === 'error') {
      // DB 更新失敗：回 ERROR 讓 PayUni 重送通知以自我修復，避免訂單卡在 pending、權益不發放
      console.error('markOrderPaid 失敗，回 ERROR 以觸發 PayUni 重送：', merTradeNo);
      return new Response('ERROR');
    }

    // 6. 履約認領（冪等 + 當機補償）：
    //    無論本次是首次通知或重送，都嘗試「認領履約」。只有 fulfilled_at 仍為 null 者會認領成功，
    //    因此開通權益恰好發生一次；若上次在「已 paid」與「開通」之間當機，這次重送會補開通。
    const claim = await markOrderFulfilled(merTradeNo);
    if (claim === 'error') {
      // 認領更新失敗：回 ERROR 讓 PayUni 重送，避免權益漏發
      console.error('markOrderFulfilled 失敗，回 ERROR 以觸發 PayUni 重送：', merTradeNo);
      return new Response('ERROR');
    }
    if (claim === 'duplicate') {
      // 已履約過（或被並發搶先），不重複開通、不重寄信
      console.warn('Duplicate/already-fulfilled callback ignored for order:', merTradeNo);
      return new Response('SUCCESS');
    }

    // claim === 'updated'：由本次負責履約（開通權益 + 寄送通知信）
    try {
      await fulfillOrder(order);
      console.log('Payment success and access granted:', merTradeNo);
    } catch (fulfillErr) {
      const detail = fulfillErr instanceof Error ? fulfillErr.message : String(fulfillErr);
      // 釋放履約認領，讓 PayUni 重送時可重新認領並補開通（避免卡在「已認領但未開通」）
      await releaseOrderFulfillment(merTradeNo).catch(() => {});
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
