import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    // 速率限制：同一 IP 每 10 分鐘最多 20 次，防止對驗證 token 暴力猜測
    if (!(await rateLimit(`verify-email:${clientIp(req)}`, 20, 600))) {
      return NextResponse.json({ error: '操作過於頻繁，請稍後再試' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json({ error: '缺少驗證參數' }, { status: 400 });
    }

    // 1. 查詢驗證 Token
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: '驗證連結無效或與帳號不匹配。' }, { status: 400 });
    }

    // 2. 檢查是否過期
    const expiresAt = new Date(tokenData.expires_at).getTime();
    if (Date.now() > expiresAt) {
      return NextResponse.json({ error: '驗證連結已過期，請重新索取驗證信。' }, { status: 400 });
    }

    // 3. 啟用使用者帳號
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('email', email);

    if (updateError) {
      console.error('Verify email user update error:', updateError);
      return NextResponse.json({ error: '帳戶啟用失敗，請稍後再試。' }, { status: 500 });
    }

    // 4. 刪除已使用過的 Token
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('id', tokenData.id);

    return NextResponse.json({ message: '驗證成功，您的帳戶已啟用！' });
  } catch (error) {
    console.error('Verify email API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
