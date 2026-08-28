import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { normalizeEmail } from '@/lib/validate';

// 防帳號枚舉：無論帳號是否存在、寄信是否成功，一律回同一則中性 200 訊息，
// 真正的錯誤只記在伺服器日誌，不讓回應差異透露帳號是否存在。
const NEUTRAL_MESSAGE = '若該信箱已註冊，我們已寄出重設密碼連結，請於幾分鐘內檢查信箱（含垃圾郵件匣）。';

export async function POST(req: Request) {
  try {
    // 速率限制：同一個 IP 每小時最多可重設密碼 5 次，防止惡意洗信
    if (!(await rateLimit(`forgot-pass:${clientIp(req)}`, 5, 3600))) {
      return NextResponse.json({ error: '重設密碼請求過於頻繁，請稍後再試。' }, { status: 429 });
    }

    const { email: rawEmail } = await req.json();

    if (!rawEmail) {
      return NextResponse.json({ error: '請提供電子郵件信箱' }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

    // 1. 查詢使用者
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    // 為了防範帳號探針，如果使用者不存在，我們依然回傳中性訊息，但不寄出信件。
    if (userError || !user) {
      return NextResponse.json({ message: NEUTRAL_MESSAGE });
    }

    // 2. 刪除該 Email 舊有的未過期重設 Token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email);

    // 3. 產生新的重設 Token (效期 1 小時)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 小時後過期

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert([
        { email, token, expires_at: expiresAt }
      ]);

    if (tokenError) {
      // 不透露帳號存在與否：記伺服器日誌，對外仍回中性 200
      console.error('Insert password reset token error:', tokenError);
      return NextResponse.json({ message: NEUTRAL_MESSAGE });
    }

    // 4. 寄送密碼重設信（寄信成敗一律回中性訊息，避免以回應差異枚舉帳號）
    const sent = await sendPasswordResetEmail({
      email,
      name: user.name || '學員',
      token
    });

    if (!sent) {
      console.error('[forgot-password] 重設信寄送失敗：', email);
    }

    return NextResponse.json({ message: NEUTRAL_MESSAGE });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
