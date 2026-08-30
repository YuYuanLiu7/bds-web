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
  coupon_code?: string | null;
}

/** 訂單折扣欄位（選填，欄位可能尚未遷移 → 建立訂單時會降級為不寫入） */
export interface OrderCouponFields {
  coupon_code?: string;
  discount_amount?: number;
}

// 可購買品項：查價結果與建立訂單所需的欄位
// （付款完成後的導回頁面由 /api/checkout/return 依訂單品項決定，不在此處指定）
export interface Purchasable {
  amount: number;
  prodDesc: string;
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
      orderFields: { course_id: id },
    },
  };
}

/**
 * 建立 pending 訂單，採「逐層降級」寫入以相容尚未遷移的資料庫：
 *  1. 完整寫入（品項欄位 + 折扣欄位）
 *  2. 折扣欄位（coupon_code / discount_amount）可能尚未遷移 → 移除折扣欄位重試（保留品項欄位）
 *  3. 會員方案欄位可能尚未遷移 → 僅保底欄位寫入
 * 未帶折扣欄位時行為與原本完全一致（不影響既有結帳路徑）。
 */
export async function createOrder(
  orderId: string,
  userId: string,
  amount: number,
  orderFields: Purchasable['orderFields'],
  couponFields?: OrderCouponFields
): Promise<void> {
  const base = { id: orderId, user_id: userId, amount, status: 'pending' };
  const coupon = couponFields ?? {};
  const hasCoupon = Object.keys(coupon).length > 0;

  // 注意：supabase 的 .insert() 失敗時是回傳 { error } 而非拋出例外，
  // 因此必須明確檢查 error（先前用 try/catch 攔截，實際上永遠攔不到）。
  let { error } = await supabase.from('orders').insert({
    ...base,
    ...orderFields,
    ...coupon,
  });
  if (!error) return;

  // 第一層降級：折扣欄位可能尚未遷移 → 移除折扣欄位重試（品項欄位保留）
  if (hasCoupon) {
    console.warn('建立訂單含折扣欄位失敗（coupon 欄位可能尚未遷移），移除折扣欄位重試：', error.message);
    const retry = await supabase.from('orders').insert({ ...base, ...orderFields });
    if (!retry.error) return;
    error = retry.error;
  }

  // 第二層降級：會員方案欄位可能尚未遷移 → 降級為不含該欄位的保底寫入
  if (orderFields.membership_plan_id) {
    console.warn('建立會員訂單失敗（membership 欄位可能尚未遷移），改以保底欄位重試：', error.message);
    const retry = await supabase.from('orders').insert(base);
    if (retry.error) {
      throw new Error(`建立訂單失敗：${retry.error.message}`);
    }
    return;
  }

  throw new Error(`建立訂單失敗：${error.message}`);
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
 * 原子地「認領履約」：僅將 fulfilled_at 仍為 null 且已 paid 的訂單標記為現在時間。
 * 回傳 'updated' 代表本次呼叫取得履約權（應接著執行 fulfillOrder）；
 * 'duplicate' 代表已被履約（或已被並發呼叫搶先），不應重複開通；
 * 'error' 代表更新失敗（呼叫端應回 ERROR 讓 PayUni 重送以自我修復）。
 * 這讓「已付款但開通前當機」可在重送時自動補開通，且不會重複累加會員天數。
 */
export async function markOrderFulfilled(
  orderId: string
): Promise<'updated' | 'duplicate' | 'error'> {
  const { data: updatedRows, error } = await supabase
    .from('orders')
    .update({ fulfilled_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'paid')
    .is('fulfilled_at', null)
    .select('id');

  if (error) return 'error';
  if (!updatedRows || updatedRows.length === 0) return 'duplicate';
  return 'updated';
}

/**
 * 釋放履約認領（把 fulfilled_at 清回 null）。
 * 用於 fulfillOrder 拋錯時：讓 PayUni 重送通知時可重新認領並補開通，
 * 避免「已認領但實際未開通」而卡死。
 */
export async function releaseOrderFulfillment(orderId: string): Promise<void> {
  await supabase
    .from('orders')
    .update({ fulfilled_at: null })
    .eq('id', orderId);
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
    // ⚠️ 這裡「不」用 try/catch 吞掉錯誤：grantMembership 失敗時必須讓例外冒泡到 callback，
    //    由 callback 記「[需人工處理]」並 sendAdminAlert。先前用 try/catch 只 console.error，
    //    導致「付款成功卻沒開通會員」時站方毫無所覺（三品項唯獨最貴的會員靜默失敗）。
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

    // 續訂累加：若現有會員尚未到期，以「現有到期日」為基準往後加一個週期，
    // 而非用「現在」覆寫，避免提前續訂者未用完的天數蒸發。
    const { data: current } = await supabase
      .from('users')
      .select('membership_expires_at')
      .eq('id', order.user_id)
      .single();
    const now = new Date();
    const existing = current?.membership_expires_at
      ? new Date(current.membership_expires_at)
      : null;
    const base = existing && existing.getTime() > now.getTime() ? existing : now;

    const expiresAt = computeMembershipExpiry(plan?.period, base);
    await grantMembership(order.user_id, order.membership_plan_id, expiresAt);
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
  const hashInfo = tool.generateHash(encryptInfo);

  // 僅記錄非機密的訂單編號與金額供對帳；不記錄 EncryptInfo/HashInfo（可被重放的付款請求密文與簽章）
  console.log(`[PayUni] 建立結帳 MerTradeNo: ${config.merTradeNo}, Amount: ${config.amount}`);

  return {
    MerID: config.merId,
    Version: '2.0',
    EncryptInfo: encryptInfo,
    HashInfo: hashInfo,
  };
}
