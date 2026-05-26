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
          <Mail className="w-4.5 h-4.5" />
          <a href="mailto:bydoingso@gmail.com" className="font-semibold">
            客服信箱：bydoingso@gmail.com
          </a>
        </div>

        <hr className="border-slate-200" />

        {/* Copyright & Policy links */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-semibold gap-3">
          <div>© {new Date().getFullYear()} BDS All Rights Reserved.</div>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="hover:underline transition text-slate-400 hover:text-slate-600">
              使用者條款
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/privacy" className="hover:underline transition text-slate-400 hover:text-slate-600">
              隱私權政策
            </Link>
          </div>
        </div>

        <div className="text-[10px] text-slate-300 font-medium">
          ♥ 本站使用 <a href="https://teachify.tw/?ref=outliersadmin38" target="_blank" className="underline hover:text-slate-500 transition">Teachify</a> 架設
        </div>

      </div>
    </footer>
  );
}
