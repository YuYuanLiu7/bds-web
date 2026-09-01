'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // If in admin dashboard, do not render the frontend Footer
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-slate-50 border-t border-slate-100 py-10 md:py-14 select-none flex-shrink-0">
      <div className="max-w-[1140px] mx-auto px-6 text-center space-y-6">
        
        {/* Support Email */}
        <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition">
          <Mail className="w-4 h-4" />
          <a href="mailto:bydoingso@gmail.com" className="font-semibold">
            客服信箱：bydoingso@gmail.com
          </a>
        </div>

        <div className="border-t border-slate-200" />

        {/* Copyright & Policy links */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-semibold gap-3">
          <div>© {new Date().getFullYear()} BDS 版權所有，保留一切權利。</div>
          <div className="flex items-center space-x-4">
            <Link href="/about" className="hover:underline transition text-slate-500 hover:text-slate-700">
              關於我們
            </Link>
            <span className="text-slate-300" aria-hidden="true">•</span>
            <Link href="/contact" className="hover:underline transition text-slate-500 hover:text-slate-700">
              聯絡我們
            </Link>
            <span className="text-slate-300" aria-hidden="true">•</span>
            <Link href="/privacy#terms" className="hover:underline transition text-slate-500 hover:text-slate-700">
              使用者條款
            </Link>
            <span className="text-slate-300" aria-hidden="true">•</span>
            <Link href="/privacy#privacy" className="hover:underline transition text-slate-500 hover:text-slate-700">
              隱私權政策
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
