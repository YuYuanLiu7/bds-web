'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('請填寫電子郵件信箱。');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage(data.message || '重設密碼信件已寄出！');
      } else {
        setError(data.error || '重設密碼請求失敗。');
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
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            忘記密碼
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            輸入您的註冊信箱，我們將向您發送密碼重設連結。
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-600 text-sm flex flex-col items-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <span>{message}</span>
            </div>
            <p className="text-sm text-slate-500">
              如果幾分鐘內沒有收到信件，請檢查您的垃圾郵件匣，或確認信箱是否填寫正確。
            </p>
            <Link
              href="/login"
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition flex items-center justify-center"
            >
              返回登入頁面
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-lg px-4 py-3 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                電子郵件信箱
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> 處理中…
                  </>
                ) : (
                  '發送重設密碼連結'
                )}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-primary hover:underline transition"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> 返回登入
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
