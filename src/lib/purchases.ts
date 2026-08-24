import { supabase } from './supabase';
import { PayuniTool } from './payuni';
import {
  grantCourse,
  grantDownload,
  grantMembership,
  computeMembershipExpiry,
} from './entitlements';
import { sendPurchaseSuccessEmail } from './email';

/**
 * 購買/履約模組（Purchases）：訂單生命週期的唯一所在地。
 *
 * - resolvePurchasable：依購買類型查價與組訂單欄位（金額一律以資料庫為準）
 * - createOrder / getOrder / markOrderPaid / markOrderFailed：訂單狀態流轉
 * - buildPayuniCheckout：組出 PayUni UPP 所需的加密參數
 * - fulfillOrder：付款成功後的履約（發放權益 + 通知信）
 *
 * 之前這些邏輯全部內嵌在 checkout 與 callback 兩條 route 裡，
 * 同一個「購買類型」switch 寫了 4 次；現在 route 只剩 HTTP 轉接。
 */

export type PurchaseType = 'course' | 'download' | 'membership';

// 訂單資料列（僅標註履約流程使用到的欄位）
export interface OrderRow {
  id: string;
  user_id: string;
  amount: number;
  status?: string;
  course_id?: string | null;
  download_id?: string | null;
  membership_plan_id?: string | null;
}

// 可購買品項：查價結果與建立訂單所需的欄位
export interface Purchasable {
  amount: number;
  prodDesc: string;
  /** 付款完成後導回的站內路徑（不含網域） */
  returnPath: string;
  /** 寫入 orders 的品項欄位（course_id / download_id / membership_plan_id 擇一） */
  orderFields: Partial<Pick<OrderRow, 'course_id' | 'download_id' | 'membership_plan_id'>>;
}

/**
 * 依購買類型解析品項：查資料庫取得金額與名稱（不信任前端傳入的 amount，防低買）。
 * 找不到品項時回傳使用者可讀的錯誤訊息。
 */
export async function resolvePurchasable(
  type: PurchaseType,
  id: string | undefined
): Promise<{ ok: true; item: Purchasable } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: '缺少品項 ID' };

  if (type === 'membership') {
    const { data: plan, error } = await supabase
      .from('membership_plans')
      .select('price, title')
      .eq('id', id)
      .single();
    if (error || !plan) return { ok: false, error: '找不到指定的會員方案' };
    return {
      ok: true,
      item: {
        amount: plan.price,
        prodDesc: `Subscribe to ${plan.title}`,
        returnPath: '/membership',
        orderFields: { membership_plan_id: id },
      },
    };
  }

  if (type === 'download') {
    const { data: download, error } = await supabase
      .from('downloads')
      .select('price, title')
      .eq('id', id)
      .single();
    if (error || !download) return { ok: false, error: '找不到指定的數位下載商品' };
    return {
      ok: true,
      item: {
        amount: download.price,
        prodDesc: `Purchase ${download.title}`,
        returnPath: '/downloads',
        orderFields: { download_id: id },
      },
    };
  }

  const { data: course, error } = await supabase
    .from('courses')
    .select('price, title')
    .eq('id', id)
    .single();
  if (error || !course) return { ok: false, error: '找不到指定的課程' };
  return {
    ok: true,
    item: {
      amount: course.price,
      prodDesc: `Purchase ${course.title}`,
      returnPath: `/courses/${id}`,
      orderFields: { course_id: id },
    },
  };
}

/** 建立 pending 訂單；會員方案欄位若尚未遷移則降級為不含該欄位的保底寫入 */
export async function createOrder(
  orderId: string,
  userId: string,
  amount: number,
  orderFields: Purchasable['orderFields']
): Promise<void> {
  try {
    await supabase.from('orders').insert({
      id: orderId,
      user_id: userId,
      amount,
      status: 'pending',
      ...orderFields,
    });
  } catch (dbErr) {
    if (orderFields.membership_plan_id) {
      console.warn(
        'DB insert membership order failed (table migration might not be executed yet):',
        dbErr
      );
      await supabase.from('orders').insert({
        id: orderId,
        user_id: userId,
        amount,
        status: 'pending',
      });
    } else {
      throw dbErr;
    }
  }
}

/** 取得訂單（供回呼校驗金額與履約） */
export async function getOrder(orderId: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (error || !data) return null;
  return data as OrderRow;
}

/**
 * 原子地將訂單由「非 paid」更新為 paid（條件式更新 + 回傳受影響列），
 * 避免 PayUni 並發/重送通知造成「先讀後寫」競態而重複開通、重複寄信。
 */
export async function markOrderPaid(
  orderId: string,
  paymentType?: string
): Promise<'updated' | 'duplicate' | 'error'> {
  const { data: updatedRows, error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_type: paymentType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .neq('status', 'paid')
    .select('id');

  if (error) return 'error';
  if (!updatedRows || updatedRows.length === 0) return 'duplicate';
  return 'updated';
}

/**
 * 將訂單標記為失敗；以 .neq('status','paid') 守衛，避免晚到/重送的非成功通知
 * 把已付款（已開通權限）的訂單降級為 failed，造成金流狀態與授權/對帳不一致。
 */
export async function markOrderFailed(orderId: string): Promise<void> {
  await supabase
    .from('orders')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .neq('status', 'paid');
}

/** 依訂單品項取得通知信用的品名 */
async function getPurchasedItemName(order: OrderRow): Promise<string> {
  if (order.course_id) {
    const { data } = await supabase
      .from('courses')
      .select('title')
      .eq('id', order.course_id)
      .single();
    if (data) return data.title;
  } else if (order.download_id) {
    const { data } = await supabase
      .from('downloads')
      .select('title')
      .eq('id', order.download_id)
      .single();
    if (data) return `數位下載 - ${data.title}`;
  } else if (order.membership_plan_id) {
    const { data } = await supabase
      .from('membership_plans')
      .select('title')
      .eq('id', order.membership_plan_id)
      .single();
    if (data) return `訂閱會員 - ${data.title}`;
  }
  return '線上項目';
}

/**
 * 履約：付款成功後開通對應權益並寄送通知信。
 * 呼叫前必須先以 markOrderPaid 取得 'updated'（防重送）；本函式不再重複檢查。
 */
export async function fulfillOrder(order: OrderRow): Promise<void> {
  // 1. 依品項發放權益（透過權益模組，發放語意集中一處）
  if (order.course_id) {
    await grantCourse(order.user_id, order.course_id);
  } else if (order.download_id) {
    await grantDownload(order.user_id, order.download_id);
  } else if (order.membership_plan_id) {
    try {
      const { data: plan } = await supabase
        .from('membership_plans')
        .select('period')
        .eq('id', order.membership_plan_id)
        .single();

      if (!plan) {
        // 查不到方案時不臆測付款週期，computeMembershipExpiry 會回傳 null（永久），
        // 避免把「一次性永久會員」誤設成 30 天到期。記錄警告供後台稽核補正。
        console.warn(
          `Membership plan ${order.membership_plan_id} not found in fulfillment; leaving membership_expires_at as null.`
        );
      }
      const expiresAt = computeMembershipExpiry(plan?.period);
      await grantMembership(order.user_id, order.membership_plan_id, expiresAt);
    } catch (mErr) {
      console.error('Failed to process membership fulfillment (table might not exist yet):', mErr);
    }
  }

  // 2. 寄送購買成功通知信（寄信失敗不影響履約結果）
  try {
    const { data: user } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', order.user_id)
      .single();

    if (user && user.email) {
      await sendPurchaseSuccessEmail({
        email: user.email,
        name: user.name || '學員',
        itemName: await getPurchasedItemName(order),
        amount: order.amount,
        tradeNo: order.id,
      });
    }
  } catch (emailErr) {
    console.error('Failed to process email dispatch in fulfillment:', emailErr);
  }
}

/** 組出 PayUni UPP 結帳所需的加密參數（回傳值可直接作為前端表單欄位） */
export function buildPayuniCheckout(config: {
  merId: string;
  hashKey: string;
  hashIV: string;
  merTradeNo: string;
  amount: number;
  prodDesc: string;
  returnUrl: string;
  notifyUrl: string;
}): { MerID: string; Version: string; EncryptInfo: string; HashInfo: string } {
  const tool = new PayuniTool(config.hashKey, config.hashIV);
  const encryptInfo = tool.encrypt({
    MerID: config.merId,
    MerTradeNo: config.merTradeNo,
    TradeAmt: config.amount,
    Timestamp: Math.floor(Date.now() / 1000),
    ProdDesc: config.prodDesc,
    ReturnURL: config.returnUrl,
    NotifyURL: config.notifyUrl,
    Version: '2.0',
  });
  return {
    MerID: config.merId,
    Version: '2.0',
    EncryptInfo: encryptInfo,
    HashInfo: tool.generateHash(encryptInfo),
  };
}
