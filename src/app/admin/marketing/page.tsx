'use client';

import { useState, useEffect } from 'react';
import { Tag, Search, Plus, Edit3, Trash2, X, AlertCircle } from 'lucide-react';
import { useAdminResource } from '@/hooks/useAdminResource';
import { useToast } from '@/components/Toast';

// 行銷促銷方案型別（對應 promotions 資料表）
interface Promotion {
  id: string;
  title: string;
  price: number;
  period: string;
  description: string;
  status: 'active' | 'draft';
  created_at?: string;
}

export default function AdminMarketingPage() {
  const toast = useToast();
  // 清單資料改由共用 Hook 統一管理（載入 / 重抓 / 刪除 / 儲存）
  const { items: promotions, loading, refetch, remove, save } = useAdminResource<Promotion>('/api/admin/promotions');

  // 搜尋與篩選
  const [searchQuery, setSearchQuery] = useState('');
  const [filtered, setFiltered] = useState<Promotion[]>([]);

  // 表單彈窗狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    period: '限時',
    description: '',
    status: 'active' as 'active' | 'draft'
  });
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // 上/下架切換中的方案 ID（避免切換期間重複點擊造成競態）
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // 依關鍵字即時過濾清單
  useEffect(() => {
    let result = [...promotions];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [promotions, searchQuery]);

  // 開啟「新增」彈窗
  const handleOpenCreateModal = () => {
    setSelected(null);
    setFormData({ title: '', price: '', period: '限時', description: '', status: 'active' });
    setFormError('');
    setIsModalOpen(true);
  };

  // 開啟「編輯」彈窗
  const handleOpenEditModal = (promo: Promotion) => {
    setSelected(promo);
    setFormData({
      title: promo.title,
      price: promo.price.toString(),
      period: promo.period,
      description: promo.description || '',
      status: promo.status || 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // 刪除方案
  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ 確定要刪除此促銷方案嗎？此動作無法復原！')) return;
    try {
      await remove(id);
      toast.success('🎉 促銷方案已成功刪除！');
    } catch (error) {
      toast.error(`❌ 刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 快速切換上/下架
  const handleToggleStatus = async (promo: Promotion) => {
    if (togglingId) return;
    const nextStatus = promo.status === 'active' ? 'draft' : 'active';
    setTogglingId(promo.id);
    try {
      await save({ ...promo, status: nextStatus });
    } catch (error) {
      console.error('切換促銷方案狀態失敗：', error);
      toast.error(`❌ 狀態切換失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setTogglingId(null);
    }
  };

  // 送出表單（新增 / 更新）
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return setFormError('方案名稱為必填欄位');
    if (!formData.price.trim() || isNaN(parseInt(formData.price))) return setFormError('價格必須為有效整數');

    setFormSubmitLoading(true);
    setFormError('');

    try {
      // 有 selected 時帶入 id，save 會自動改走 PUT 更新
      const body = {
        ...formData,
        price: parseInt(formData.price),
        ...(selected ? { id: selected.id } : {})
      };
      await save(body);
      toast.success(selected ? '🎉 促銷方案已成功更新！' : '🎉 新促銷方案已成功建立！');
      setIsModalOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '儲存發生錯誤');
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // KPI 統計
  const totalPromos = promotions.length;
  const activePromos = promotions.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Tag className="w-6 h-6 mr-2 text-indigo-600" />
            行銷促銷方案
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">建立與管理限時促銷方案（名稱、價格、期間、說明、上/下架），提高學員的轉單與購買意願。</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 新增促銷方案
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">總促銷方案數</span>
            <span className="text-2xl font-black text-slate-800">{totalPromos} <span className="text-xs text-slate-400 font-semibold">項</span></span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">上架中方案</span>
            <span className="text-2xl font-black text-slate-800">{activePromos} <span className="text-xs text-slate-400 font-semibold">個</span></span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold flex justify-between items-center">
            <span>共 <span className="text-slate-700 font-extrabold">{filtered.length}</span> 項</span>
            {loading && <span className="text-indigo-600 font-bold animate-pulse text-[10px]">資料同步中...</span>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 h-12 select-none">
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[45%]">方案名稱 / 說明</th>
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[20%]">價格</th>
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[20%]">期間</th>
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[15%] text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-semibold text-xs">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      {loading ? '資料載入中...' : '目前沒有促銷方案，點擊右上角「新增促銷方案」開始建立。'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((promo) => (
                    <tr key={promo.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(promo)}
                            disabled={togglingId === promo.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider select-none cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-pulse ${
                              promo.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {togglingId === promo.id ? '切換中...' : (promo.status === 'active' ? '已上架' : '已下架')}
                          </button>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal(promo)}
                          className="block font-black text-slate-800 hover:text-indigo-600 transition text-sm text-left leading-snug outline-none"
                        >
                          {promo.title}
                        </button>
                        <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">{promo.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-rose-600 font-black text-sm">
                          NT$ {promo.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{promo.period}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(promo)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                            title="編輯方案"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="刪除方案"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1 lg:order-first">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center pb-2.5 border-b border-slate-100">
              <Search className="w-4 h-4 text-indigo-500 mr-1.5 shrink-0" />
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">方案篩選</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">搜尋方案名稱</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="輸入關鍵字搜尋..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button
                onClick={refetch}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center cursor-pointer"
              >
                刷新資料庫
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 表單彈窗（新增 & 編輯） */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-left">

            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-wider">
                {selected ? '✏️ 編輯促銷方案' : '✨ 建立促銷方案'}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full transition text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-start space-x-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 mr-1 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 方案名稱 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">方案名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：半導體實戰營早鳥優惠"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* 價格與期間 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">價格 (NT$) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="例如：990"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">期間 *</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition cursor-pointer"
                  >
                    <option value="限時">限時</option>
                    <option value="月">月</option>
                    <option value="季">季</option>
                    <option value="年">年</option>
                    <option value="一次性">一次性</option>
                  </select>
                </div>
              </div>

              {/* 方案說明 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">方案說明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="輸入促銷方案的主要特色或適用對象描述..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
                />
              </div>

              {/* 上/下架狀態 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">上/下架狀態 *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'draft' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition cursor-pointer"
                >
                  <option value="active">已上架</option>
                  <option value="draft">已下架</option>
                </select>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4.5 border-t border-slate-200 bg-slate-50/50 flex space-x-3 justify-end select-none">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={formSubmitLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {formSubmitLoading ? '儲存中...' : (selected ? '儲存更新' : '建立方案')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
