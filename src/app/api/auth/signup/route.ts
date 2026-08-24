import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidEmail, isValidPassword, hashPassword, emailTaken, MIN_PASSWORD_LENGTH } from '@/lib/validate';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 速率限制：同一 IP 每小時最多 10 次註冊嘗試，防止洗註冊
    if (!(await rateLimit(`signup:${clientIp(req)}`, 10, 3600))) {
      return NextResponse.json({ error: '操作過於頻繁，請稍後再試' }, { status: 429 });
    }

    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    // Email 格式後端驗證（防止前端被繞過）
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: '電子郵件格式不正確' }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: `密碼長度至少需要 ${MIN_PASSWORD_LENGTH} 位` }, { status: 400 });
    }

    // 1. 檢查使用者是否已存在
    if (await emailTaken(email)) {
      return NextResponse.json({ error: '此 Email 已被註冊' }, { status: 400 });
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
          role: 'user'
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Signup error:', createError);
      return NextResponse.json({ error: '註冊失敗，請稍後再試' }, { status: 500 });
    }

    return NextResponse.json({ message: '註冊成功', user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
