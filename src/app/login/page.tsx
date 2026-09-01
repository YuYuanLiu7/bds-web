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
              className="text-primary font-bold hover:underline mt-2 inline-block transition"
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        <div>
          <h2 className="text-center text-2xl font-bold text-slate-900">
            登入您的帳戶
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            還沒有帳號？{' '}
            <Link href="/signup" className="text-primary hover:underline">
              立即註冊
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {registered === 'verification_pending' && (
            <div className="bg-primary/5 border border-primary/20 text-slate-700 rounded-lg px-4 py-3 text-sm leading-relaxed">
              註冊成功！我們已發送帳戶啟用信至 <strong>{emailParam || email}</strong>，請點擊信中連結啟用帳戶。<br/>
              <Link
                href={`/resend-verification?email=${encodeURIComponent(emailParam || email)}`}
                className="text-primary font-bold hover:underline mt-2 inline-block transition"
              >
                沒有收到信？點此重寄驗證信
              </Link>
            </div>
          )}
          {registered === 'true' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg px-4 py-3 text-sm">
              帳戶啟用成功／註冊成功！現在您可以登入了。
            </div>
          )}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">電子郵件</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="w-full px-3 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-3 pr-11 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="輸入您的密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline transition">
                  忘記密碼？
                </Link>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? '處理中…' : '登入'}
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
