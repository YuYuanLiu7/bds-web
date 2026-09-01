'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在驗證您的電子郵件，請稍候...');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('缺少驗證參數，無法進行帳戶驗證。');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || '驗證成功！您的帳戶已成功啟用。');
          // 3 秒後自動導向登入頁
          setTimeout(() => {
            router.push('/login?registered=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || '驗證失敗，連結可能已失效。');
        }
      } catch (err) {
        setStatus('error');
        setMessage('連線伺服器失敗，請稍後再試。');
      }
    };

    verify();
  }, [token, email, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8 text-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            帳戶啟用驗證
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4 text-primary">
              <Loader2 className="w-16 h-16 animate-spin" />
              <p className="text-slate-500 text-sm font-medium">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4 text-emerald-500">
              <CheckCircle2 className="w-16 h-16 animate-pulse" />
              <p className="text-slate-900 text-lg font-bold">{message}</p>
              <p className="text-slate-500 text-xs">即將為您自動跳轉至登入頁面...</p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg text-sm transition"
              >
                立即登入 <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 text-rose-500">
              <XCircle className="w-16 h-16" />
              <p className="text-slate-900 text-md font-bold">{message}</p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full">
                <Link
                  href="/login"
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition"
                >
                  返回登入
                </Link>
                <Link
                  href={`/resend-verification?email=${encodeURIComponent(email || '')}`}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg text-sm transition"
                >
                  重新寄送驗證信
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
