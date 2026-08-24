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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-indigo-950/40 text-white font-sans relative">
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 bg-slate-900/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-slate-800 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 text-blue-400 rounded-xl mb-4 border border-blue-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            設定新密碼
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            請為您的帳號 `{email}` 設定一個新的安全密碼。
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm flex flex-col items-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <span>{message}</span>
            </div>
            <p className="text-sm text-gray-400">
              即將自動為您跳轉至登入頁面...
            </p>
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center"
            >
              立即登入
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  電子郵件
                </label>
                <input
                  type="text"
                  disabled
                  value={email || ''}
                  className="block w-full px-4 py-3 bg-slate-800/40 border border-slate-700/60 rounded-xl text-gray-450 focus:outline-none sm:text-sm cursor-not-allowed opacity-60"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  輸入新密碼
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-4 pr-10 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                    placeholder="至少 6 位字元"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  確認新密碼
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-4 pr-10 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                    placeholder="再次輸入您的新密碼"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
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
                className="w-full flex justify-center py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition disabled:bg-gray-700 disabled:text-gray-400 shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
