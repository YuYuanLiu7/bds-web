import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidPassword, hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/validate';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 速率限制：同一 IP 每 10 分鐘最多 10 次，防止對重設 token 暴力嘗試
    if (!(await rateLimit(`reset-pw:${clientIp(req)}`, 10, 600))) {
      return NextResponse.json({ error: '操作過於頻繁，請稍後再試' }, { status: 429 });
    }

    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: '請提供電子郵件、驗證 Token 與新密碼。' }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: `新密碼長度至少需要 ${MIN_PASSWORD_LENGTH} 位` }, { status: 400 });
    }

    // 1. 查詢重設 Token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: '密碼重設連結無效或與帳號不匹配。' }, { status: 400 });
    }

    // 2. 檢查是否過期
    const expiresAt = new Date(tokenData.expires_at).getTime();
    if (Date.now() > expiresAt) {
      return NextResponse.json({ error: '密碼重設連結已過期，請重新申請。' }, { status: 400 });
    }

    // 3. 密碼加密
    const hashedPassword = await hashPassword(password);

    // 4. 更新使用者密碼
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', email);

    if (updateError) {
      console.error('Reset password user update error:', updateError);
      return NextResponse.json({ error: '密碼重設失敗，請稍後再試。' }, { status: 500 });
    }

    // 5. 刪除已使用過的 Token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('id', tokenData.id);

    return NextResponse.json({ message: '密碼重設成功，請使用新密碼登入您的帳戶！' });
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
