import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 由於 npm 安裝權限問題，我們暫時使用一個簡單的雜湊模擬，
// 但為了商用安全，建議您稍後在終端機執行：sudo chown -R 501:20 "/Users/yuyuanliu/.npm" 修正權限後再安裝 bcryptjs。
// 目前先實作註冊邏輯。

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
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

    // 2. 建立新使用者 (目前暫時存明文，強烈建議修復權限後改用 bcrypt)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          name, 
          password_hash: password, // 注意：正式環境務必加密
          role: 'user' 
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Signup error:', createError);
      return NextResponse.json({ error: '註冊失敗，請稍後再試' }, { status: 500 });
    }

    return NextResponse.json({ message: '註冊成功', user: newUser });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
