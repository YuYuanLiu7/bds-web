'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 後台資源清單 Hook：統一「載入清單 / loading / error / 刪除後重抓 / 儲存後重抓」
 * 的控制流。先前 6 個後台列表頁（文章/課程/下載/活動/會員/留言）各自複製同一套
 * useState + fetch 樣板，現在收攏於此。
 *
 * 約定（與既有 /api/admin/* 路由一致）：
 *  - GET  {endpoint}        取得清單（回傳陣列，或以 pick 取出陣列欄位）
 *  - POST/PUT {endpoint}    儲存（依 payload.id 有無決定新增或更新）
 *  - DELETE {endpoint}?id=  刪除
 */
export function useAdminResource<T>(
  endpoint: string,
  options?: {
    /** 回應不是純陣列時，從回應物件取出清單陣列 */
    pick?: (data: unknown) => T[];
  }
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pick = options?.pick;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入失敗');
      const list = pick ? pick(data) : (data as T[]);
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(`載入 ${endpoint} 失敗:`, err);
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
    // pick 以呼叫端字面 inline 函式為常態，不列入依賴避免每次 render 重抓
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  /** 刪除一筆並重抓清單；失敗時擲出錯誤讓呼叫端顯示訊息 */
  const remove = useCallback(
    async (id: string | number) => {
      const res = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '刪除失敗');
      }
      await refetch();
    },
    [endpoint, refetch]
  );

  /** 儲存（payload.id 有值走 PUT，否則 POST）並重抓清單；失敗時擲出錯誤 */
  const save = useCallback(
    async (payload: Record<string, unknown>) => {
      const method = payload.id ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '儲存失敗');
      }
      await refetch();
    },
    [endpoint, refetch]
  );

  return { items, setItems, loading, error, refetch, remove, save };
}
