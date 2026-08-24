/**
 * BDS Email Notification Utility
 * 
 * Uses Resend REST API for completely free, zero-dependency transactional emails (3,000 free emails/month).
 * Falls back to console log with clear setup instructions if API keys are not configured.
 */

interface SendEmailParams {
  email: string;
  name: string;
  itemName: string;
  amount: number;
  tradeNo: string;
}

interface ContactEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * 寄送「聯絡我們」表單訊息至客服信箱。
 * 收件者預設為 CONTACT_TO_EMAIL，未設定時退回 RESEND_TEST_RECIPIENT 或客服信箱。
 * 使用 Resend onboarding 網域時，只能寄到已驗證信箱，故沿用沙盒導向邏輯。
 */
export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: ContactEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const contactTo =
    process.env.CONTACT_TO_EMAIL ||
    process.env.RESEND_TEST_RECIPIENT ||
    'bydoingso@gmail.com';

  // 沙盒模式：使用 onboarding 網域時只能寄到已驗證信箱
  let targetEmail = contactTo;
  const testRecipient = process.env.RESEND_TEST_RECIPIENT;
  if (fromEmail === 'onboarding@resend.dev' && testRecipient) {
    targetEmail = testRecipient;
  }

  const safe = (s: string) =>
    s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const htmlContent = `
    <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color:#334155; max-width:600px; margin:0 auto;">
      <h2 style="color:#4f46e5;">📨 來自 BDS 網站的聯絡表單</h2>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:8px; color:#64748b; font-weight:600; width:100px;">姓名</td><td style="padding:8px; font-weight:700;">${safe(name)}</td></tr>
        <tr><td style="padding:8px; color:#64748b; font-weight:600;">信箱</td><td style="padding:8px; font-weight:700;">${safe(email)}</td></tr>
        <tr><td style="padding:8px; color:#64748b; font-weight:600;">主題</td><td style="padding:8px; font-weight:700;">${safe(subject)}</td></tr>
      </table>
      <div style="margin-top:16px; padding:16px; background:#f8fafc; border:1px solid #f1f5f9; border-radius:12px; white-space:pre-line; font-size:14px; line-height:1.6;">
        ${safe(message)}
      </div>
      <p style="margin-top:16px; font-size:12px; color:#94a3b8;">可直接回覆此信件聯繫來信者（Reply-To 已設為對方信箱）。</p>
    </div>
  `;

  if (!apiKey) {
    console.warn(`
[Email System WARNING] RESEND_API_KEY 未設定，聯絡表單訊息僅模擬未實際寄出。
CONTACT TO: ${contactTo}
FROM: ${safe(name)} <${safe(email)}>
SUBJECT: ${safe(subject)}
MESSAGE: ${safe(message)}
    `);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `BDS 聯絡表單 <${fromEmail}>`,
        to: [targetEmail],
        reply_to: email,
        subject: `【BDS 聯絡表單｜${subject}】來自 ${name}`,
        html: htmlContent,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`[Email System] 聯絡表單已寄出。ID: ${data.id}`);
      return true;
    }
    console.error('[Email System ERROR] Resend 回傳錯誤:', data);
    return false;
  } catch (error) {
    console.error('[Email System ERROR] 寄送聯絡表單失敗:', error);
    return false;
  }
}

export async function sendPurchaseSuccessEmail({
  email,
  name,
  itemName,
  amount,
  tradeNo
}: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'; // Resend default for unverified domains, or custom domain like no-reply@bydoingso.com

  // Sandbox Mode Auto-Override: when using Resend's free onboarding domain, we can only send to our verified address.
  let targetEmail = email;
  const testRecipient = process.env.RESEND_TEST_RECIPIENT;
  if (fromEmail === 'onboarding@resend.dev' && testRecipient && email !== testRecipient) {
    targetEmail = testRecipient;
    console.log(`[Email System Sandbox] Redirecting target email from ${email} to verified testing email: ${testRecipient}`);
  }

  console.log(`[Email System] Preparing purchase success email for ${targetEmail} (${itemName})`);

  // HTML elegant transactional email template matching BDS premium style
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>購買成功通知</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 20px;
            box-sizing: border-box;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 24px;
            border: 1px solid #f1f5f9;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            padding: 40px 32px;
            text-align: center;
            color: #ffffff;
            position: relative;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            color: #cbd5e1;
            font-weight: 500;
          }
          .content {
            padding: 40px 32px;
          }
          .welcome {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 28px;
            font-weight: 500;
          }
          .welcome span {
            font-weight: 800;
            color: #4f46e5;
          }
          .receipt-box {
            background-color: #f8fafc;
            border-radius: 16px;
            border: 1px solid #f1f5f9;
            padding: 24px;
            margin-bottom: 32px;
          }
          .receipt-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .receipt-row:last-child {
            margin-bottom: 0;
          }
          .label {
            color: #64748b;
            font-weight: 600;
          }
          .value {
            color: #0f172a;
            font-weight: 700;
            text-align: right;
          }
          .value-price {
            color: #16a34a;
            font-weight: 800;
          }
          .btn-container {
            text-align: center;
            margin: 32px 0 16px 0;
          }
          .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 36px;
            border-radius: 14px;
            font-size: 14px;
            font-weight: 800;
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
            transition: all 0.2s ease;
          }
          .footer {
            background-color: #fafafa;
            border-top: 1px solid #f1f5f9;
            padding: 24px 32px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
          }
          .footer a {
            color: #6366f1;
            text-decoration: none;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>🎉 購買成功！</h1>
              <p>感謝您的支持，您已成功開通線上課程權限</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="welcome">
                親愛的 <span>${name}</span> 您好：<br>
                系統已成功收到您的付款！我們已立即為您的帳號開通觀看權限，請點擊下方按鈕登入平台，即可隨時隨地開始您的學習之旅！
              </div>
              
              <!-- Receipt Detail Card -->
              <div class="receipt-box">
                <div class="receipt-title">訂單明細</div>
                <div class="receipt-row">
                  <span class="label">購買項目</span>
                  <span class="value">${itemName}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">訂單編號</span>
                  <span class="value" style="font-family: monospace; font-size: 13px;">${tradeNo}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">交易金額</span>
                  <span class="value value-price">NT$ ${amount.toLocaleString()}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">開通時間</span>
                  <span class="value">${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })} (台北時間)</span>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div class="btn-container">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/courses" class="btn">
                  立刻進入教室，開始學習 🚀
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              本郵件由 BDS 線上學習平台系統自動發出，請勿直接回覆。<br>
              如有任何疑問，歡迎聯絡 <a href="mailto:support@bydoingso.com">support@bydoingso.com</a>。
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // If Resend API Key is not set, log the email beautifully in console (mock fallback)
  if (!apiKey) {
    console.warn(`
[Email System WARNING] RESEND_API_KEY is not defined in environment variables. 
The purchase notification email was simulated but NOT actually sent.
To activate actual email delivery, add this to your .env.local:
  RESEND_API_KEY=re_YOUR_ACTUAL_KEY
  RESEND_FROM_EMAIL=your-verified-sender@domain.com
=========================================
EMAIL TO: ${email}
SUBJECT: 🎉 購買成功！立刻開始您的學習之旅
ITEM: ${itemName}
AMOUNT: NT$ ${amount.toLocaleString()}
TRADE_NO: ${tradeNo}
=========================================
    `);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: `BDS 課程平台 <${fromEmail}>`,
        to: [targetEmail],
        subject: `🎉 購買成功！立刻開始學習《${itemName}》` + (targetEmail !== email ? ` [測試導向: ${email}]` : ''),
        html: htmlContent
      })
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`[Email System] Email successfully sent via Resend. ID: ${data.id}`);
      return true;
    } else {
      console.error('[Email System ERROR] Resend returned error status:', data);
      return false;
    }
  } catch (error) {
    console.error('[Email System ERROR] Failed to perform fetch request to Resend API:', error);
    return false;
  }
}

interface AuthEmailParams {
  email: string;
  name: string;
  token: string;
}

/**
 * 寄送 Email 驗證信（帳戶啟用）
 */
export async function sendVerificationEmail({
  email,
  name,
  token,
}: AuthEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let targetEmail = email;
  const testRecipient = process.env.RESEND_TEST_RECIPIENT;
  if (fromEmail === 'onboarding@resend.dev' && testRecipient && email !== testRecipient) {
    targetEmail = testRecipient;
    console.log(`[Email System Sandbox] Redirecting target email from ${email} to verified testing email: ${testRecipient}`);
  }

  const verifyUrl = `${siteUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>驗證您的 Email 帳號</title>
        <style>
          body { font-family: sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; }
          .header { text-align: center; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #1e3a8a;">BDS 線上學習平台</h2>
          </div>
          <p>親愛的 ${name} 您好：</p>
          <p>感謝您註冊 BDS 線上學習平台！請點擊下方的按鈕驗證您的電子郵件地址，以啟用您的帳戶並開始學習：</p>
          <div class="btn-container">
            <a href="${verifyUrl}" class="btn">驗證電子郵件</a>
          </div>
          <p>或是複製並貼上以下連結至您的瀏覽器中：</p>
          <p style="word-break: break-all; color: #3b82f6; font-size: 14px;">${verifyUrl}</p>
          <p>此驗證連結將在 24 小時後過期。如果您沒有註冊此帳戶，請忽略此郵件。</p>
          <div class="footer">
            本郵件由 BDS 系統自動發送。如有任何疑問，請聯絡 support@bydoingso.com。
          </div>
        </div>
      </body>
    </html>
  `;

  if (!apiKey) {
    console.warn(`
[Email System WARNING] RESEND_API_KEY is not defined. Email Verification simulated.
EMAIL TO: ${email}
URL: ${verifyUrl}
    `);
    return true; // 模擬模式回傳成功以利本機測試
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: `BDS 帳戶驗證 <${fromEmail}>`,
        to: [targetEmail],
        subject: `【BDS 平台】請驗證您的電子郵件信箱` + (targetEmail !== email ? ` [測試導向: ${email}]` : ''),
        html: htmlContent
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * 寄送密碼重設信
 */
export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: AuthEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let targetEmail = email;
  const testRecipient = process.env.RESEND_TEST_RECIPIENT;
  if (fromEmail === 'onboarding@resend.dev' && testRecipient && email !== testRecipient) {
    targetEmail = testRecipient;
    console.log(`[Email System Sandbox] Redirecting target email from ${email} to verified testing email: ${testRecipient}`);
  }

  const resetUrl = `${siteUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>重設您的密碼</title>
        <style>
          body { font-family: sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; }
          .header { text-align: center; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background-color: #ef4444; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #1e3a8a;">BDS 線上學習平台</h2>
          </div>
          <p>親愛的 ${name} 您好：</p>
          <p>您收到了此封郵件，是因為我們收到了重設您帳戶密碼的請求。請點擊下方按鈕以設定新密碼：</p>
          <div class="btn-container">
            <a href="${resetUrl}" class="btn">重設密碼</a>
          </div>
          <p>或是複製並貼上以下連結至您的瀏覽器中：</p>
          <p style="word-break: break-all; color: #3b82f6; font-size: 14px;">${resetUrl}</p>
          <p>此重設連結將在 1 小時後過期。如果您沒有要求重設密碼，請忽略此郵件，您的密碼將保持不變。</p>
          <div class="footer">
            本郵件由 BDS 系統自動發送。如有任何疑問，請聯絡 support@bydoingso.com。
          </div>
        </div>
      </body>
    </html>
  `;

  if (!apiKey) {
    console.warn(`
[Email System WARNING] RESEND_API_KEY is not defined. Password Reset Email simulated.
EMAIL TO: ${email}
URL: ${resetUrl}
    `);
    return true; // 模擬模式回傳成功以利本機測試
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: `BDS 密碼重設 <${fromEmail}>`,
        to: [targetEmail],
        subject: `【BDS 平台】密碼重設請求` + (targetEmail !== email ? ` [測試導向: ${email}]` : ''),
        html: htmlContent
      })
    });
    return res.ok;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}
