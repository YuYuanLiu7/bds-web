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
