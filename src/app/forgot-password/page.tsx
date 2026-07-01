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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-indigo-950/40 text-white font-sans relative">
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 bg-slate-900/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-slate-800 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600/10 text-indigo-400 rounded-xl mb-4 border border-indigo-500/20">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            忘記密碼
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            輸入您的註冊信箱，我們將向您發送密碼重設連結。
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm flex flex-col items-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <span>{message}</span>
            </div>
            <p className="text-sm text-gray-400">
              如果幾分鐘內沒有收到信件，請檢查您的垃圾郵件匣，或確認信箱是否填寫正確。
            </p>
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center"
            >
              返回登入頁面
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                電子郵件信箱
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition disabled:bg-gray-700 disabled:text-gray-400 shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  '發送重設密碼連結'
                )}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-gray-400 hover:text-white transition"
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
