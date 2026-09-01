'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

// 後台通知鈴鐺（接真實資料）：顯示「已付款未開通訂單」「待審留言」等待辦，
// 紅點數字為真實筆數；點開為下拉清單，點項目會導向對應後台頁。
// 資料來源：GET /api/admin/notifications（每 60 秒自動更新一次）。
type Item = { type: string; title: string; detail: string; time: string; href: string };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setTotal(data.total || 0);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // 靜默失敗，不影響後台其他操作
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  // 點鈴鐺以外區域時關閉下拉
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-1 text-slate-400 hover:text-slate-600 transition focus:outline-none"
        title="通知"
        aria-label="通知"
      >
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100 font-bold text-slate-700 text-sm">
            待處理事項{total > 0 ? `（${total}）` : ''}
          </div>
          {loading ? (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">載入中…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">目前沒有待處理事項 🎉</div>
          ) : (
            items.map((it, i) => (
              <Link
                key={i}
                href={it.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition"
              >
                <div className="text-sm font-medium text-slate-800">{it.title}</div>
                {it.detail && (
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{it.detail}</div>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
