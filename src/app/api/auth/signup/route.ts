import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密碼長度至少需要 6 位' }, { status: 400 });
    }

    // 1. 檢查使用者是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: '此 Email 已被註冊' }, { status: 400 });
    }

    // 2. 密碼加密
    const hashedPassword = await bcrypt.hash(password, 12);

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
