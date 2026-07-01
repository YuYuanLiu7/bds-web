import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 速率限制：同一個 IP 每小時最多可重寄 5 次驗證信，防止惡意洗信
    if (!(await rateLimit(`resend-verify:${clientIp(req)}`, 5, 3600))) {
      return NextResponse.json({ error: '重寄信件過於頻繁，請稍後再試。' }, { status: 429 });
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

    if (userError || !user) {
      return NextResponse.json({ error: '找不到此電子郵件的註冊帳號。' }, { status: 400 });
    }

    // 2. 檢查是否已驗證
    if (user.is_verified) {
      return NextResponse.json({ error: '此帳戶先前已完成驗證，可直接登入！' }, { status: 400 });
    }

    // 3. 刪除該 Email 舊有的未過期 verification_token（保持資料庫整潔）
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('email', email);

    // 4. 產生新的驗證 Token (效期 24 小時)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenError } = await supabase
      .from('verification_tokens')
      .insert([
        { email, token, expires_at: expiresAt }
      ]);

    if (tokenError) {
      console.error('Insert new verification token error:', tokenError);
      return NextResponse.json({ error: '系統錯誤，無法產生驗證 Token。' }, { status: 500 });
    }

    // 5. 寄送驗證信
    const sent = await sendVerificationEmail({
      email,
      name: user.name || '學員',
      token
    });

    if (!sent) {
      return NextResponse.json({ error: '信件寄送失敗，請稍後再試。' }, { status: 500 });
    }

    return NextResponse.json({ message: '驗證信已重新寄出，請檢查您的電子信箱（包含垃圾郵件匣）。' });
  } catch (error) {
    console.error('Resend verification API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
