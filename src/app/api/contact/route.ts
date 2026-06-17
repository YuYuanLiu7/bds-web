import { sendContactEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

// 聯絡我們表單：將訪客訊息寄送至客服信箱（使用 Resend）
export async function POST(req: Request) {
  try {
    // 速率限制：同一 IP 每 10 分鐘最多 5 次，防止灌爆客服信箱與耗用寄信額度
    if (!(await rateLimit(`contact:${clientIp(req)}`, 5, 600))) {
      return NextResponse.json({ error: "送出過於頻繁，請稍後再試" }, { status: 429 });
    }

    const { name, email, subject, message } = await req.json();

    // 基本欄位驗證
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "請填寫姓名、信箱與訊息內容" }, { status: 400 });
    }
    // 簡單 email 格式檢查
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "電子郵件格式不正確" }, { status: 400 });
    }
    // 訊息長度上限，避免濫用
    if (message.length > 5000) {
      return NextResponse.json({ error: "訊息內容過長（上限 5000 字）" }, { status: 400 });
    }

    const ok = await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      subject: (subject || '一般諮詢').trim(),
      message: message.trim(),
    });

    if (!ok) {
      // 寄信失敗（多為未設定 RESEND_API_KEY）：回傳明確錯誤，避免前端誤報成功
      return NextResponse.json(
        { error: "訊息暫時無法送出，請直接來信 bydoingso@gmail.com" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "聯絡訊息已送出" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "送出失敗" }, { status: 500 });
  }
}
