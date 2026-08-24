import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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
    // 🔒 模擬付款端點僅供開發/測試環境，正式環境必須關閉，否則任何登入者可免費開通會員
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PAYMENT_SIMULATION !== 'true') {
      return NextResponse.json({ error: "此端點僅供開發測試環境使用" }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, planName, price, period }: SimulateBody = await req.json();
    if (!planId) {
      return NextResponse.json({ error: "缺少方案 ID (planId)" }, { status: 400 });
    }
    // 與原行為一致：將 price 以 10 進位解析為整數金額（無法解析則為 0）
    const amount = parseInt(String(price)) || 0;

    // 1. 依據 Email 尋找使用者 ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const merTradeNo = `BDS_SIM_${Date.now()}`;

    // 2. 建立已付費訂單紀錄
    try {
      await supabase.from('orders').insert({
        id: merTradeNo,
        user_id: user.id,
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
      await grantMembership(user.id, planId, expiresAt);
    } catch (e) {
      console.warn("DB update user membership skipped (table/columns might not be migrated yet):", e);
    }

    // 5. 寄送模擬購買成功通知信
    try {
      await sendPurchaseSuccessEmail({
        email: session.user.email,
        name: session.user.name || '學員',
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
