'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError('缺少必要的重設密碼參數。請確保您是從重設郵件中的連結進入。');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token || !email) {
      setError('重設密碼參數無效，請從郵件連結重新嘗試。');
      return;
    }

    if (password.length < 6) {
      setError('新密碼長度至少需要 6 位字元。');
      return;
    }

    if (password !== confirmPassword) {
      setError('兩次輸入的新密碼不一致。');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage(data.message || '密碼已重設成功！');
        // 3 秒後自動導向登入頁
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 3000);
      } else {
        setError(data.error || '密碼重設失敗，連結可能已失效。');
      }
    } catch (err) {
      setError('與伺服器連線失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-xl mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            設定新密碼
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            請為您的帳號 {email} 設定一個新的安全密碼。
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-600 text-sm flex flex-col items-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <span>{message}</span>
            </div>
            <p className="text-sm text-slate-500">
              即將自動為您跳轉至登入頁面...
            </p>
            <Link
              href="/login"
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition flex items-center justify-center"
            >
              立即登入
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-lg px-4 py-3 text-sm text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  電子郵件
                </label>
                <input
                  type="text"
                  disabled
                  value={email || ''}
                  className="w-full px-3 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  輸入新密碼
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="至少 6 位字元"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  確認新密碼
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="再次輸入您的新密碼"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? '隱藏密碼' : '顯示密碼'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !token || !email}
                aria-busy={loading}
                className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> 處理中…
                  </>
                ) : (
                  '更新帳密並重設密碼'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
