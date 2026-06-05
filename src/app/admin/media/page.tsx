'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminMediaRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/assets');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px] text-slate-400 text-xs font-semibold">
      正在導向至素材庫 (Assets)...
    </div>
  );
}
