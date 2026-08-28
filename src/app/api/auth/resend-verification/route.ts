import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { normalizeEmail } from '@/lib/validate';

// 防帳號枚舉：無論帳號是否存在／是否已驗證，一律回傳相同的中性成功訊息。
// 僅在「帳號存在且尚未驗證」時才實際寄信，但回應不透露此差異。
const NEUTRAL_MESSAGE = '若該信箱存在且尚未完成驗證，我們已重新寄出驗證信，請檢查信箱（含垃圾郵件匣）。';

export async function POST(req: Request) {
  try {
    // 速率限制：同一個 IP 每小時最多可重寄 5 次驗證信，防止惡意洗信
    if (!(await rateLimit(`resend-verify:${clientIp(req)}`, 5, 3600))) {
      return NextResponse.json({ error: '重寄信件過於頻繁，請稍後再試。' }, { status: 429 });
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

    if (userError || !user || user.is_verified) {
      // 帳號不存在或已驗證：回中性訊息，不寄信、不透露帳號狀態
      return NextResponse.json({ message: NEUTRAL_MESSAGE });
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
      // 不透露帳號狀態：記伺服器日誌，對外仍回中性 200
      console.error('Insert new verification token error:', tokenError);
      return NextResponse.json({ message: NEUTRAL_MESSAGE });
    }

    // 5. 寄送驗證信（寄信成敗一律回中性訊息，避免以回應差異枚舉帳號）
    const sent = await sendVerificationEmail({
      email,
      name: user.name || '學員',
      token
    });

    if (!sent) {
      console.error('[resend-verification] 驗證信寄送失敗：', email);
    }

    return NextResponse.json({ message: NEUTRAL_MESSAGE });
  } catch (error) {
    console.error('Resend verification API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
