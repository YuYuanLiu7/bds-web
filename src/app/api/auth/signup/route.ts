import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidEmail, isValidPassword, hashPassword, emailTaken, normalizeEmail, MIN_PASSWORD_LENGTH } from '@/lib/validate';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import crypto from 'crypto';
import { sendVerificationEmail, sendAdminAlert } from '@/lib/email';

export async function POST(req: Request) {
  try {
    // 速率限制：同一 IP 每小時最多 10 次註冊嘗試，防止洗註冊
    if (!(await rateLimit(`signup:${clientIp(req)}`, 10, 3600))) {
      return NextResponse.json({ error: '操作過於頻繁，請稍後再試' }, { status: 429 });
    }

    const { email: rawEmail, password, name } = await req.json();

    if (!rawEmail || !password || !name) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    // Email 格式後端驗證（防止前端被繞過）
    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: '電子郵件格式不正確' }, { status: 400 });
    }

    // 一律正規化（去空白、轉小寫）後才寫入／比對，避免大小寫造成登不進去或重複註冊
    const email = normalizeEmail(rawEmail);

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: `密碼長度至少需要 ${MIN_PASSWORD_LENGTH} 位` }, { status: 400 });
    }

    // 1. 檢查使用者是否已存在
    // 防帳號枚舉：信箱已註冊時，不透露此事實，回與新註冊「完全相同」的中性成功訊息
    //（不建立帳號、不寄信）。並執行一次等成本的雜湊拉平時間差，避免以回應時間推斷帳號是否存在。
    // 既有使用者本就能用「登入」或「忘記密碼」，不受影響。
    if (await emailTaken(email)) {
      await hashPassword(password).catch(() => {});
      return NextResponse.json({
        message: '註冊成功，請檢查您的電子郵件（含垃圾郵件匣）以驗證並啟用您的帳戶。',
        requiresVerification: true,
        emailSent: true,
      });
    }

    // 2. 密碼加密
    const hashedPassword = await hashPassword(password);

    // 3. 建立新使用者
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          password_hash: hashedPassword,
          role: 'user',
          is_verified: false // 新使用者預設為未驗證
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Signup error:', createError);
      return NextResponse.json({ error: '註冊失敗，請稍後再試' }, { status: 500 });
    }

    // 4. 產生 Email 驗證 Token (效期 24 小時)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenError } = await supabase
      .from('verification_tokens')
      .insert([
        { email, token, expires_at: expiresAt }
      ]);

    // 寄送驗證信，並確實檢查是否寄成功（先前忽略回傳值，寄失敗也回「請收信」，
    // 導致新客既收不到信、又因未驗證無法登入而卡死，且站方毫無所覺）。
    let emailSent = false;
    if (tokenError) {
      console.error('Create verification token error:', tokenError);
      // 產生 token 失敗：不中斷註冊，但記錄錯誤（用戶可稍後於登入頁點「重寄驗證信」）
    } else {
      emailSent = await sendVerificationEmail({ email, name, token });
      if (!emailSent) {
        console.error('[signup] 驗證信寄送失敗：', email);
        // 告警管理員：可能是 Resend 網域未驗證或已達每日上限，需儘速處理
        await sendAdminAlert(
          '驗證信寄送失敗',
          `新用戶 ${email} 註冊成功但驗證信寄送失敗，該用戶目前無法登入。請檢查 Resend 網域驗證狀態與每日寄送額度。`
        );
      }
    }

    // 不回傳 user 物件（前端未使用），使此回應與「信箱已存在」的中性回應形狀一致，避免帳號枚舉
    void newUser;
    return NextResponse.json({
      message: emailSent
        ? '註冊成功，請檢查您的電子郵件（含垃圾郵件匣）以驗證並啟用您的帳戶。'
        : '註冊成功，但驗證信暫時寄送失敗。請稍後至登入頁點「重寄驗證信」，或聯絡客服。',
      requiresVerification: true,
      emailSent,
    });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
