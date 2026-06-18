// 全站載入指示：頁面切換／RSC 串流期間顯示，取代空白等待
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400" aria-busy="true" aria-label="載入中">
      <Loader2 className="w-9 h-9 animate-spin text-[var(--brand)]" />
      <p className="text-sm font-semibold">載入中⋯</p>
    </div>
  );
}
