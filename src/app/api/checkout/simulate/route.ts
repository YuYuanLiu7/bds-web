import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { sendPurchaseSuccessEmail } from "@/lib/email";

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

    const { planId, planName, price, period } = await req.json();

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
        amount: parseInt(price) || 0,
        status: 'paid',
        payment_type: 'SIMULATED_TEST',
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn("DB insert simulated order skipped (table/columns might not be migrated yet):", e);
    }

    // 3. 計算到期日
    let expiresAt = null;
    const now = new Date();
    if (period === '月繳') {
      now.setMonth(now.getMonth() + 1);
      expiresAt = now.toISOString();
    } else if (period === '年繳') {
      now.setFullYear(now.getFullYear() + 1);
      expiresAt = now.toISOString();
    } // '一次性' 為永久會員，expiresAt 為 null

    // 4. 開通使用者會員方案權限
    try {
      await supabase
        .from('users')
        .update({
          membership_plan_id: planId,
          membership_expires_at: expiresAt
        })
        .eq('id', user.id);
    } catch (e) {
      console.warn("DB update user membership skipped (table/columns might not be migrated yet):", e);
    }

    // 5. 寄送模擬購買成功通知信
    try {
      await sendPurchaseSuccessEmail({
        email: session.user.email,
        name: session.user.name || '學員',
        itemName: `訂閱會員 - ${planName}`,
        amount: parseInt(price) || 0,
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
  } catch (error: any) {
    console.error("Simulation endpoint error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
