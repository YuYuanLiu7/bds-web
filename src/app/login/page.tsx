'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | React.ReactNode>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const emailParam = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error.includes('EMAIL_NOT_VERIFIED') || result.error === 'EMAIL_NOT_VERIFIED') {
        setError(
          <div className="text-center">
            您的 Email 尚未驗證，請先收取驗證信啟用帳號。<br/>
            <Link 
              href={`/resend-verification?email=${encodeURIComponent(email)}`} 
              className="text-blue-600 font-bold hover:underline mt-2 inline-block transition"
            >
              點此重新發送驗證信
            </Link>
          </div>
        );
      } else if (result.error.includes('RATE_LIMIT_EXCEEDED') || result.error === 'RATE_LIMIT_EXCEEDED') {
        setError('嘗試登入次數過多。為保障帳戶安全，請於 10 分鐘後再試。');
      } else {
        setError('登入失敗，請檢查您的帳號密碼。');
      }
      setLoading(false);
    } else {
      // 獲取最新 session 以確認 role
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      if (session?.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/courses');
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登入您的帳戶
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            還沒有帳號？{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              立即註冊
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {registered === 'verification_pending' && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700 text-sm rounded-r-xl leading-relaxed">
              註冊成功！我們已發送帳戶啟用信至 <strong>{emailParam || email}</strong>，請點擊信中連結啟用帳戶。<br/>
              <Link 
                href={`/resend-verification?email=${encodeURIComponent(emailParam || email)}`} 
                className="text-blue-600 font-bold hover:underline mt-2 inline-block transition"
              >
                沒有收到信？點此重寄驗證信
              </Link>
            </div>
          )}
          {registered === 'true' && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 text-green-700 text-sm rounded-r-xl">
              帳戶啟用成功／註冊成功！現在您可以登入了。
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 text-sm rounded-r-xl">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full pl-3 pr-11 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="輸入您的密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition">
                  忘記密碼？
                </Link>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-lg shadow-blue-200 disabled:bg-gray-400"
            >
              {loading ? '處理中...' : '登入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">載入中...</div>}>
      <LoginContent />
    </Suspense>
  );
}
