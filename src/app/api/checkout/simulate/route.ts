import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { grantMembership, computeMembershipExpiry } from "@/lib/entitlements";
import { sendPurchaseSuccessEmail } from "@/lib/email";

// 模擬付款請求主體
interface SimulateBody {
  planId?: string;
  planName?: string;
  price?: string | number;
  period?: string;
}

export async function POST(req: Request) {
  try {
    // 🔒 模擬付款端點僅供開發/測試環境，正式環境必須關閉
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PAYMENT_SIMULATION !== 'true') {
      return NextResponse.json({ error: "此端點僅供開發測試環境使用" }, { status: 403 });
    }

    // 🔒 縱深防禦：即使旗標誤開，也僅限管理員可用（免費開通會員的測試工具，不可對一般使用者開放）
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;
    const userId = auth.user.id;
    if (!userId || !auth.user.email) {
      return NextResponse.json({ error: "找不到管理員帳號資料" }, { status: 400 });
    }

    const { planId, planName, price, period }: SimulateBody = await req.json();
    if (!planId) {
      return NextResponse.json({ error: "缺少方案 ID (planId)" }, { status: 400 });
    }
    // 與原行為一致：將 price 以 10 進位解析為整數金額（無法解析則為 0）
    const amount = parseInt(String(price)) || 0;

    const merTradeNo = `BDS_SIM_${Date.now()}`;

    // 2. 建立已付費訂單紀錄
    try {
      await supabase.from('orders').insert({
        id: merTradeNo,
        user_id: userId,
        membership_plan_id: planId,
        amount,
        status: 'paid',
        payment_type: 'SIMULATED_TEST',
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("DB insert simulated order skipped (table/columns might not be migrated yet):", e);
    }

    // 3. 計算到期日並開通使用者會員方案權限（'一次性' 為永久會員，expiresAt 為 null）
    const expiresAt = computeMembershipExpiry(period);
    try {
      await grantMembership(userId, planId, expiresAt);
    } catch (e) {
      console.warn("DB update user membership skipped (table/columns might not be migrated yet):", e);
    }

    // 5. 寄送模擬購買成功通知信
    try {
      await sendPurchaseSuccessEmail({
        email: auth.user.email,
        name: auth.user.name || '學員',
        itemName: `訂閱會員 - ${planName}`,
        amount,
        tradeNo: merTradeNo
      });
    } catch (emailErr) {
      console.error("Failed to send simulation success email:", emailErr);
    }

    return NextResponse.json({ 
      success: true, 
      merTradeNo,
      message: `🎉 會員方案「${planName}」已成功模擬開通！到期日：${expiresAt ? new Date(expiresAt).toLocaleDateString() : '永久'}`
    });
  } catch (error) {
    console.error("Simulation endpoint error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
