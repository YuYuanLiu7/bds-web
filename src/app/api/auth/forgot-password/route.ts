import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 速率限制：同一個 IP 每小時最多可重設密碼 5 次，防止惡意洗信
    if (!(await rateLimit(`forgot-pass:${clientIp(req)}`, 5, 3600))) {
      return NextResponse.json({ error: '重設密碼請求過於頻繁，請稍後再試。' }, { status: 429 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: '請提供電子郵件信箱' }, { status: 400 });
    }

    // 1. 查詢使用者
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    // 為了防範帳號探針，如果使用者不存在，我們依然回傳成功訊息，但不寄出信件。
    if (userError || !user) {
      return NextResponse.json({ message: '重設密碼連結已寄出。如果該信箱已註冊，您將在幾分鐘內收到信件。' });
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
      console.error('Insert password reset token error:', tokenError);
      return NextResponse.json({ error: '系統錯誤，無法產生重設 Token。' }, { status: 500 });
    }

    // 4. 寄送密碼重設信
    const sent = await sendPasswordResetEmail({
      email,
      name: user.name || '學員',
      token
    });

    if (!sent) {
      return NextResponse.json({ error: '信件寄送失敗，請稍後再試。' }, { status: 500 });
    }

    return NextResponse.json({ message: '重設密碼連結已發送，請檢查您的電子信箱（包含垃圾郵件匣）。' });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
