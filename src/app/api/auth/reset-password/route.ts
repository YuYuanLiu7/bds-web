import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidPassword, hashPassword, normalizeEmail, MIN_PASSWORD_LENGTH } from '@/lib/validate';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 速率限制：同一 IP 每 10 分鐘最多 10 次，防止對重設 token 暴力嘗試
    // 重設密碼屬安全關鍵端點，故 failClosed（機制失效時拒絕）
    if (!(await rateLimit(`reset-pw:${clientIp(req)}`, 10, 600, { failClosed: true }))) {
      return NextResponse.json({ error: '操作過於頻繁，請稍後再試' }, { status: 429 });
    }

    const { email: rawEmail, token, password } = await req.json();

    if (!rawEmail || !token || !password) {
      return NextResponse.json({ error: '請提供電子郵件、驗證 Token 與新密碼。' }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

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

    // 4. 更新使用者密碼；一併標記 is_verified=true。
    //    能收到並使用重設連結即證明信箱可用，等同完成信箱驗證；
    //    否則未驗證的帳號設好新密碼仍會被登入流程（is_verified=false）擋下，形成「設好卻登不進去」。
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword, is_verified: true, password_changed_at: new Date().toISOString() })
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
