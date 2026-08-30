'use client';

import { useState } from 'react';
import { Ticket, Plus, Edit3, Trash2, Percent, DollarSign, X, Save, Tag, CalendarClock, Hash } from 'lucide-react';
import { useAdminResource } from '@/hooks/useAdminResource';
import { useToast } from '@/components/Toast';

// 折扣碼資料列（對應 coupons 資料表）
interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  min_amount: number;
  created_at?: string;
}

// 表單狀態（含新增/編輯共用；id 有值為編輯）
interface CouponForm {
  id?: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  active: boolean;
  expires_at: string; // datetime-local 用字串，送出時空字串轉 null
  usage_limit: string; // 空字串代表不限
  min_amount: number;
}

const EMPTY_FORM: CouponForm = {
  code: '',
  discount_type: 'percent',
  discount_value: 10,
  active: true,
  expires_at: '',
  usage_limit: '',
  min_amount: 0,
};

// 將資料庫時間字串轉為 <input type="datetime-local"> 可接受的格式（yyyy-MM-ddTHH:mm）
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminCouponsPage() {
  const toast = useToast();
  const { items: coupons, loading, error, refetch, remove } = useAdminResource<Coupon>('/api/admin/coupons');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleAdd = () => {
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const handleEdit = (c: Coupon) => {
    setForm({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      active: c.active,
      expires_at: toLocalInput(c.expires_at),
      usage_limit: c.usage_limit === null || c.usage_limit === undefined ? '' : String(c.usage_limit),
      min_amount: c.min_amount ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此折扣碼嗎？')) return;
    try {
      await remove(id);
      toast.success('折扣碼已刪除');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '刪除失敗');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: form.id,
        code: form.code,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        active: form.active,
        // 空字串交由後端轉為 null（不限期 / 不限次）
        expires_at: form.expires_at,
        usage_limit: form.usage_limit,
        min_amount: form.min_amount,
      };
      // 更新用 PATCH、新增用 POST（與後台 API 約定一致）
      const method = form.id ? 'PATCH' : 'POST';
      const res = await fetch('/api/admin/coupons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '儲存失敗');
      }
      setIsModalOpen(false);
      toast.success('折扣碼已儲存');
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  // 折扣碼是否已過期（僅前台顯示用）
  const isExpired = (c: Coupon) => !!c.expires_at && new Date(c.expires_at).getTime() < Date.now();
  const isExhausted = (c: Coupon) =>
    c.usage_limit !== null && c.usage_limit !== undefined && (c.used_count ?? 0) >= c.usage_limit;

  // KPI 統計
  const total = coupons.length;
  const activeCount = coupons.filter((c) => c.active && !isExpired(c) && !isExhausted(c)).length;
  const totalUsed = coupons.reduce((acc, c) => acc + (c.used_count ?? 0), 0);

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Ticket className="w-6 h-6 mr-2 text-indigo-600" />
            優惠券 / 折扣碼管理
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            建立與管理結帳時可套用的折扣碼；折抵金額一律以伺服器端重新計算，確保安全。
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 新增折扣碼
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">折扣碼總數</span>
            <div className="text-xl font-black text-slate-800">{total} <span className="text-xs font-semibold text-slate-400">組</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Tag className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">目前可用</span>
            <div className="text-xl font-black text-emerald-600">{activeCount} <span className="text-xs font-semibold text-emerald-400">組</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Ticket className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">累計使用次數</span>
            <div className="text-xl font-black text-slate-800">{totalUsed.toLocaleString()} <span className="text-xs font-semibold text-slate-400">次</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
            <Hash className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400 font-bold px-1">
          <div>共 <span className="text-slate-700 font-extrabold">{coupons.length}</span> 組折扣碼</div>
          {loading && <span className="text-indigo-600 animate-pulse">連線更新中...</span>}
        </div>

        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto min-w-[820px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 h-12 select-none">
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3">折扣碼</th>
                  <th className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3">折抵</th>
                  <th className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3">最低金額</th>
                  <th className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3">使用 / 上限</th>
                  <th className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3">到期</th>
                  <th className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3 text-center">狀態</th>
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length > 0 ? (
                  coupons.map((c) => {
                    const expired = isExpired(c);
                    const exhausted = isExhausted(c);
                    const usable = c.active && !expired && !exhausted;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/40 transition duration-150 group">
                        <td className="px-6 py-4.5">
                          <span
                            onClick={() => handleEdit(c)}
                            className="font-mono font-extrabold text-slate-800 text-sm hover:text-indigo-600 transition cursor-pointer"
                          >
                            {c.code}
                          </span>
                        </td>
                        <td className="px-5 py-4.5 text-slate-700 font-bold text-xs">
                          {c.discount_type === 'percent' ? (
                            <span className="inline-flex items-center">
                              <Percent className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                              {c.discount_value}% 折抵
                            </span>
                          ) : (
                            <span className="inline-flex items-center">
                              <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                              折 NT$ {(c.discount_value ?? 0).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4.5 text-slate-600 font-semibold text-xs">
                          {c.min_amount > 0 ? `NT$ ${c.min_amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-4.5 text-slate-600 font-semibold text-xs">
                          {c.used_count ?? 0} / {c.usage_limit === null || c.usage_limit === undefined ? '∞' : c.usage_limit}
                        </td>
                        <td className="px-5 py-4.5 text-slate-600 font-semibold text-xs">
                          {c.expires_at ? new Date(c.expires_at).toLocaleDateString('zh-TW') : '不限期'}
                        </td>
                        <td className="px-5 py-4.5 text-center">
                          {usable ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />可用
                            </span>
                          ) : !c.active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-black text-[9px] border border-slate-200">已停用</span>
                          ) : expired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-black text-[9px] border border-amber-100">已過期</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-black text-[9px] border border-rose-100">已用罄</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5 opacity-90 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleEdit(c)}
                              title="編輯折扣碼"
                              className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 rounded-lg transition cursor-pointer flex items-center justify-center"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              title="刪除折扣碼"
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-rose-500 font-semibold text-xs">
                      資料載入失敗，請重新整理或確認登入狀態。
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic text-xs">
                      目前尚無折扣碼，點右上角「新增折扣碼」開始建立。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans text-slate-700">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 select-none">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center">
                  <Ticket className="w-5 h-5 mr-2 text-indigo-600" />
                  {form.id ? '編輯折扣碼' : '新增折扣碼'}
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  折扣碼會自動轉為大寫並去除空白；折抵金額於結帳時由伺服器端重新計算。
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition text-gray-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div className="p-8 space-y-6">

                {/* Code */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">折扣碼</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-sm font-mono font-bold text-slate-800 placeholder:text-slate-300 uppercase"
                    placeholder="例如：WELCOME100"
                  />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">折抵類型</label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'fixed' })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold text-slate-700"
                    >
                      <option value="percent">百分比折扣 (%)</option>
                      <option value="fixed">固定金額折抵 (NT$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">
                      {form.discount_type === 'percent' ? '折扣百分比 (0-100)' : '折抵金額 (NT$)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={form.discount_type === 'percent' ? 100 : undefined}
                      required
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-700"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Min amount & Usage limit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">最低訂單金額 (NT$)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.min_amount}
                      onChange={(e) => setForm({ ...form, min_amount: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-700"
                      placeholder="0（不限）"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">原價需達此金額才能套用；0 表示不限。</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                      <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" />使用次數上限
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.usage_limit}
                      onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-700"
                      placeholder="留空表示不限"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">留空表示不限次數。</p>
                  </div>
                </div>

                {/* Expiry & Active */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                      <CalendarClock className="w-3.5 h-3.5 mr-1 text-slate-400" />到期時間
                    </label>
                    <input
                      type="datetime-local"
                      value={form.expires_at}
                      onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-700"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">留空表示不限期。</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">啟用狀態</label>
                    <select
                      value={form.active ? '1' : '0'}
                      onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold text-slate-700"
                    >
                      <option value="1">🟢 啟用</option>
                      <option value="0">⚪ 停用</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-end space-x-3 px-8 py-5 border-t border-slate-100 bg-slate-50/20 select-none">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition text-xs font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md active:scale-98 transition flex items-center cursor-pointer disabled:opacity-55"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {saving ? '儲存中...' : '儲存折扣碼'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
