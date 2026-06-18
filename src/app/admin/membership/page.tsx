'use client';

import { useState, useEffect } from 'react';
import { Award, Search, Plus, Users, Edit3, Trash2, CheckCircle, Sparkles, X, AlertCircle, DollarSign } from 'lucide-react';

interface MembershipPlan {
  id: string;
  title: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  is_popular: boolean;
  status: 'active' | 'draft';
  subscribers_count: number;
  created_at?: string;
}

export default function AdminMembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    period: '月繳',
    description: '',
    is_popular: false,
    status: 'active' as 'active' | 'draft'
  });
  const [features, setFeatures] = useState<string[]>(['']);
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // 狀態切換中的方案 ID（避免切換期間重複點擊造成競態）
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/membership');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (error) {
      console.error("Failed to fetch membership plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Filter plans list
  useEffect(() => {
    let result = [...plans];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(plan => 
        plan.title.toLowerCase().includes(query) || 
        (plan.description && plan.description.toLowerCase().includes(query))
      );
    }
    if (selectedPeriod !== 'All') {
      result = result.filter(plan => plan.period === selectedPeriod);
    }
    setFilteredPlans(result);
  }, [plans, searchQuery, selectedPeriod]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setSelectedPlan(null);
    setFormData({
      title: '',
      price: '',
      period: '月繳',
      description: '',
      is_popular: false,
      status: 'active'
    });
    setFeatures(['']);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title,
      price: plan.price.toString(),
      period: plan.period,
      description: plan.description || '',
      is_popular: !!plan.is_popular,
      status: plan.status || 'active'
    });
    setFeatures(plan.features && plan.features.length > 0 ? [...plan.features] : ['']);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle delete plan
  const handleDeletePlan = async (id: string) => {
    if (!confirm('⚠️ 確定要刪除此會員方案嗎？這將會立即移除前台方案與交易關聯！')) return;
    
    try {
      const res = await fetch(`/api/admin/membership?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('🎉 方案已成功刪除！');
        fetchPlans();
      } else {
        let errData: { error?: string } | null = null;
        try {
          errData = await res.json();
        } catch {
          errData = null;
        }
        alert(`❌ 刪除失敗：${errData?.error || '未知錯誤'}`);
      }
    } catch (error) {
      alert(`❌ 刪除失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // Toggle status shortcut
  const handleToggleStatus = async (plan: MembershipPlan) => {
    // 切換進行中時，忽略重複點擊以避免競態
    if (togglingId) return;
    const nextStatus = plan.status === 'active' ? 'draft' : 'active';
    setTogglingId(plan.id);
    try {
      const res = await fetch('/api/admin/membership', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plan,
          status: nextStatus
        })
      });
      if (res.ok) {
        fetchPlans();
      } else {
        let errData: { error?: string } | null = null;
        try {
          errData = await res.json();
        } catch {
          errData = null;
        }
        alert(`❌ 狀態切換失敗：${errData?.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error("Failed to toggle plan status:", error);
      alert(`❌ 狀態切換失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return setFormError('方案名稱為必填欄位');
    if (!formData.price.trim() || isNaN(parseInt(formData.price))) return setFormError('價格必須為有效整數');

    // Filter out empty features
    const cleanedFeatures = features.map(f => f.trim()).filter(f => f !== '');
    if (cleanedFeatures.length === 0) return setFormError('請至少設定一項方案包含權益');

    setFormSubmitLoading(true);
    setFormError('');

    try {
      const method = selectedPlan ? 'PUT' : 'POST';
      const body = {
        ...formData,
        price: parseInt(formData.price),
        features: cleanedFeatures,
        ...(selectedPlan ? { id: selectedPlan.id } : {})
      };

      const res = await fetch('/api/admin/membership', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(selectedPlan ? '🎉 方案已成功更新！' : '🎉 新會員方案已成功建立！');
        setIsModalOpen(false);
        fetchPlans();
      } else {
        const errData = await res.json();
        setFormError(errData.error || '儲存失敗，請重試');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '儲存發生錯誤');
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // KPI Calculations
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.status === 'active').length;
  const totalSubscribers = plans.reduce((acc, curr) => acc + (curr.subscribers_count || 0), 0);
  const totalEstimatedRevenue = plans.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.subscribers_count || 0)), 0);

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Award className="w-7 h-7 mr-2 text-indigo-600 shrink-0" />
            會員方案管理
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">設計與管理不同層級的 VIP 會員方案、年繳/月費訂閱制服務與權益內容。</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 建立新方案
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">總會員方案數</span>
            <span className="text-2xl font-black text-slate-800">{totalPlans} <span className="text-xs text-slate-400 font-semibold">項</span></span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">已啟動方案</span>
            <span className="text-2xl font-black text-slate-800">{activePlans} <span className="text-xs text-slate-400 font-semibold">個</span></span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">累計訂閱會員</span>
            <span className="text-2xl font-black text-slate-800">{totalSubscribers.toLocaleString()} <span className="text-xs text-slate-400 font-semibold">人</span></span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">訂閱預估總營收</span>
            <span className="text-2xl font-black text-slate-800">NT$ {totalEstimatedRevenue.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold flex justify-between items-center">
            <span>共 <span className="text-slate-700 font-extrabold">{filteredPlans.length}</span> 項</span>
            {loading && <span className="text-indigo-600 font-bold animate-pulse text-[10px]">資料同步中...</span>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 h-12 select-none">
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[40%]">方案名稱 & 權益</th>
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[20%]">定價</th>
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[25%]">週期 / 累計會員</th>
                  <th className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[15%] text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-semibold text-xs">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      沒有找到符合條件的會員方案項目。
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(plan)}
                            disabled={togglingId === plan.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider select-none cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-pulse ${
                              plan.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {togglingId === plan.id ? '切換中...' : (plan.status === 'active' ? '已啟動' : '草稿')}
                          </button>
                          {plan.is_popular && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider flex items-center">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> 最受歡迎
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => handleOpenEditModal(plan)}
                          className="block font-black text-slate-800 hover:text-indigo-600 transition text-sm text-left leading-snug outline-none"
                        >
                          {plan.title}
                        </button>
                        <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">{plan.description}</p>
                        {plan.features && plan.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {plan.features.slice(0, 3).map((feat, fIdx) => (
                              <span key={fIdx} className="text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                                ✓ {feat}
                              </span>
                            ))}
                            {plan.features.length > 3 && (
                              <span className="text-[9px] font-bold bg-slate-50 text-indigo-500 border border-indigo-50 px-1.5 py-0.5 rounded-md">
                                + {plan.features.length - 3} 項權益
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-indigo-600 font-black text-sm">
                          NT$ {plan.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-y-1 text-slate-400 font-semibold text-xs">
                        <div className="flex items-center text-slate-600 font-bold">
                          週期: <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-md ml-1">{plan.period}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-slate-300 shrink-0" />
                          已加入會員: <span className="text-slate-800 font-black ml-1">{plan.subscribers_count || 0} 人</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button 
                            onClick={() => handleOpenEditModal(plan)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                            title="編輯方案"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeletePlan(plan.id)}
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
              {/* Search input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">搜尋方案名稱</label>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="輸入關鍵字搜尋..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Period Filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">繳費週期過濾</label>
                <select 
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition cursor-pointer"
                >
                  <option value="All">顯示所有週期</option>
                  <option value="月繳">月繳</option>
                  <option value="年繳">年繳</option>
                  <option value="一次性">一次性 / 終身</option>
                </select>
              </div>

              <button 
                onClick={fetchPlans}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center cursor-pointer"
              >
                刷新資料庫
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Membership Form Modal (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-250 text-left">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-wider">
                {selectedPlan ? '✏️ 編輯會員方案' : '✨ 建立會員方案'}
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

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">方案名稱 *</label>
                <input 
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="例如：BDS 產業升級訂閱制 - 月費方案"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Price & Period Group */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">定價 (NT$) *</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="例如：990"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>

                {/* Period */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">繳費週期 *</label>
                  <select 
                    value={formData.period}
                    onChange={e => setFormData({...formData, period: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition cursor-pointer"
                  >
                    <option value="月繳">月繳</option>
                    <option value="年繳">年繳</option>
                    <option value="一次性">一次性</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">方案介紹簡介</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="輸入方案的主要特色或適用對象描述..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
                />
              </div>

              {/* Switch options */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl select-none">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-800 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1 shrink-0" />
                    標記為「最受歡迎方案」
                  </span>
                  <p className="text-[9px] text-slate-400 font-semibold leading-none">在前台以高亮邊框及推薦徽章優先呈現此方案</p>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.is_popular}
                  onChange={e => setFormData({...formData, is_popular: e.target.checked})}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Status & Options */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">上架狀態 *</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'draft'})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition cursor-pointer"
                >
                  <option value="active">已啟動上架</option>
                  <option value="draft">暫存草稿</option>
                </select>
              </div>

              {/* Features List Dynamic Editor */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">方案權益清單項目 *</label>
                  <button
                    type="button"
                    onClick={() => setFeatures([...features, ''])}
                    className="text-indigo-600 font-black text-[10px] flex items-center hover:underline cursor-pointer"
                  >
                    + 新增權益
                  </button>
                </div>

                <div className="space-y-2">
                  {features.map((feat, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 font-black shrink-0 w-4">{index + 1}.</span>
                      <input 
                        type="text"
                        required
                        value={feat}
                        onChange={e => {
                          const newFeats = [...features];
                          newFeats[index] = e.target.value;
                          setFeatures(newFeats);
                        }}
                        placeholder={`例如：暢讀所有專欄文章或課程折扣`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFeats = features.filter((_, idx) => idx !== index);
                          setFeatures(newFeats.length > 0 ? newFeats : ['']);
                        }}
                        disabled={features.length === 1 && features[0] === ''}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
                {formSubmitLoading ? '儲存中...' : (selectedPlan ? '儲存更新' : '建立方案')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
