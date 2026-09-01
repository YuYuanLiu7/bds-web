'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

function ResendVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

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
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage(data.message || '驗證信已重新發送！');
      } else {
        setError(data.error || '信件重新發送失敗。');
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
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            重新寄送驗證信
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            如果未收到啟用信，請輸入您的信箱以重新寄送。
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-600 text-sm flex flex-col items-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <span>{message}</span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition flex items-center justify-center"
            >
              返回登入頁面
            </button>
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
                  '發送啟用驗證信'
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

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ResendVerificationContent />
    </Suspense>
  );
}
