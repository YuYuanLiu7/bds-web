'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  Settings, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Award, 
  Check, 
  X, 
  Mail, 
  Phone, 
  Lock,
  Loader2,
  FileText,
  Calendar,
  BookOpen
} from 'lucide-react';

export default function AdminStudentsPage() {
  // Tabs: 'student' | 'instructor' | 'assistant' | 'admin' | 'settings'
  const [activeTab, setActiveTab] = useState<'student' | 'instructor' | 'assistant' | 'admin' | 'settings'>('student');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Search Filters State
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  // Dropdown options loaded dynamically
  const [courses, setCourses] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Unified Add/Edit Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  // Member Form State
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberRole, setMemberRole] = useState('user');
  const [memberPassword, setMemberPassword] = useState('');
  
  // Member Permissions Form State (Specifically for Student role)
  const [membershipPlanId, setMembershipPlanId] = useState('');
  const [membershipExpiresAt, setMembershipExpiresAt] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState('');

  // Student Settings Form State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [phoneMode, setPhoneMode] = useState<'required' | 'optional' | 'disabled'>('optional');
  const [tosText, setTosText] = useState('');
  const [privacyText, setPrivacyText] = useState('');
  const [requireTosAgreement, setRequireTosAgreement] = useState(true);

  // show success/error toast helper
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all members
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setStudents(data);
      } else {
        setError(data.error || '無法取得成員資料');
      }
    } catch (err) {
      console.error(err);
      setError('連線發生錯誤，無法取得成員資料');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses list
  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch('/api/admin/courses_full');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCourses(data);
      }
    } catch (err) {
      console.error("Fetch courses error:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch membership plans
  const fetchMembershipPlans = async () => {
    try {
      const res = await fetch('/api/admin/membership');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setMembershipPlans(data);
      }
    } catch (err) {
      console.error("Fetch membership plans error:", err);
    }
  };

  // Fetch student settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/students/settings');
      const data = await res.json();
      if (res.ok) {
        setPhoneMode(data.phoneMode || 'optional');
        setTosText(data.tosText || '');
        setPrivacyText(data.privacyText || '');
        setRequireTosAgreement(data.requireTosAgreement !== undefined ? data.requireTosAgreement : true);
      }
    } catch (err) {
      console.error("Fetch student settings error:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchCourses();
    fetchMembershipPlans();
    fetchSettings();
  }, []);

  // Filter members based on active tab and search criteria
  const getFilteredMembers = () => {
    let result = [...students];

    // Filter by role according to tab
    if (activeTab === 'student') {
      result = result.filter(m => m.role === 'user' || m.role === 'student');
    } else if (activeTab === 'instructor') {
      result = result.filter(m => m.role === 'instructor');
    } else if (activeTab === 'assistant') {
      result = result.filter(m => m.role === 'assistant');
    } else if (activeTab === 'admin') {
      result = result.filter(m => m.role === 'admin');
    }

    // Filter by search parameters
    if (searchName.trim()) {
      result = result.filter(m => m.name?.toLowerCase().includes(searchName.toLowerCase()));
    }
    if (searchEmail.trim()) {
      result = result.filter(m => m.email?.toLowerCase().includes(searchEmail.toLowerCase()));
    }
    if (searchPhone.trim()) {
      result = result.filter(m => m.phone?.includes(searchPhone));
    }

    return result;
  };

  const handleResetSearch = () => {
    setSearchName('');
    setSearchEmail('');
    setSearchPhone('');
  };

  // Open member modal for Add
  const handleOpenAddModal = (defaultRole: string) => {
    setEditingMember(null);
    setMemberName('');
    setMemberEmail('');
    setMemberPhone('');
    setMemberRole(defaultRole === 'student' ? 'user' : defaultRole);
    setMemberPassword('');
    
    // Reset authorization states
    setMembershipPlanId('');
    setMembershipExpiresAt('');
    setSelectedCourses([]);
    setCourseSearch('');
    
    setIsMemberModalOpen(true);
  };

  // Open member modal for Edit
  const handleOpenEditModal = async (member: any) => {
    setEditingMember(member);
    setMemberName(member.name || '');
    setMemberEmail(member.email || '');
    setMemberPhone(member.phone || '');
    setMemberRole(member.role || 'user');
    setMemberPassword(''); // Password remains blank unless resetting
    
    // Populate subscription plan
    setMembershipPlanId(member.membership_plan_id || '');
    setMembershipExpiresAt(member.membership_expires_at ? member.membership_expires_at.split('T')[0] : '');
    
    // Reset permissions states
    setSelectedCourses([]);
    setCourseSearch('');
    setIsMemberModalOpen(true);

    // If student, dynamically load their course authorizations
    if (member.role === 'user' || member.role === 'student') {
      setLoadingPermissions(true);
      try {
        const res = await fetch(`/api/admin/students/courses?userId=${member.id}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setSelectedCourses(data);
        }
      } catch (err) {
        console.error("Load user courses error:", err);
      } finally {
        setLoadingPermissions(false);
      }
    }
  };

  // Toggle Course checkbox
  const handleToggleCourse = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  // Save Member (Add or Edit)
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim() || !memberName.trim() || !memberRole) {
      showToast('error', '請填寫必要欄位！');
      return;
    }

    // If new user, password is required
    if (!editingMember && (!memberPassword || memberPassword.length < 6)) {
      showToast('error', '新建成員時密碼為必填，且至少需要 6 位數！');
      return;
    }

    try {
      const isEdit = !!editingMember;
      const url = '/api/admin/students';
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload: any = {
        name: memberName,
        email: memberEmail,
        phone: memberPhone || null,
        role: memberRole,
      };

      if (isEdit) {
        payload.id = editingMember.id;
      }
      
      if (memberPassword.trim()) {
        payload.password = memberPassword;
      }

      // If role is Student (user), sync course permissions and subscriptions
      if (memberRole === 'user' || memberRole === 'student') {
        payload.membershipPlanId = membershipPlanId || null;
        payload.membershipExpiresAt = membershipExpiresAt ? new Date(membershipExpiresAt).toISOString() : null;
        payload.courseIds = selectedCourses;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', isEdit ? '成員與權限資料已成功更新！' : '新成員與權限已成功建立！');
        setIsMemberModalOpen(false);
        fetchMembers(); // refresh
      } else {
        showToast('error', data.error || '儲存失敗，請重試！');
      }
    } catch (err) {
      console.error(err);
      showToast('error', '伺服器連線發生錯誤');
    }
  };

  // Delete Member
  const handleDeleteMember = async (member: any) => {
    if (!confirm(`確定要刪除成員「${member.name || member.email}」嗎？此動作將無法復原。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students?id=${member.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        showToast('success', '成員已被刪除');
        fetchMembers();
      } else {
        showToast('error', data.error || '刪除失敗');
      }
    } catch (err) {
      console.error(err);
      showToast('error', '連線錯誤，刪除失敗');
    }
  };

  // Save Student Settings Form
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);

    try {
      const res = await fetch('/api/admin/students/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneMode,
          tosText,
          privacyText,
          requireTosAgreement
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', '學員欄位與服務條款設定已成功儲存！');
      } else {
        showToast('error', data.error || '儲存設定失敗');
      }
    } catch (err) {
      console.error("Save settings error:", err);
      showToast('error', '儲存設定連線錯誤');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Match Plan Title Helper
  const getPlanTitle = (planId: string) => {
    const plan = membershipPlans.find(p => p.id === planId);
    return plan ? plan.title : '已選訂閱方案';
  };

  // Helper date formatter
  const formatTaiwanDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}/${mo}/${dy}`;
  };

  const currentFiltered = getFilteredMembers();

  return (
    <div className="space-y-6 select-none font-sans text-slate-700 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-extrabold animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 mr-2 text-emerald-600" />
          ) : (
            <X className="w-4 h-4 mr-2 text-rose-600" />
          )}
          {toast.message}
        </div>
      )}

      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Users className="w-6 h-6 mr-2 text-indigo-600" />
            成員管理
          </h1>
          <p className="text-[11px] text-slate-400 font-bold mt-1">管理您平台上的學員、講師、助教與後台管理帳號</p>
        </div>
        
        {/* Dynamic add button according to active tab role */}
        {activeTab !== 'settings' && (
          <button 
            onClick={() => handleOpenAddModal(activeTab)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md hover:shadow-lg transition flex items-center cursor-pointer active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            新增{activeTab === 'student' ? '學員' : activeTab === 'instructor' ? '講師' : activeTab === 'assistant' ? '助教' : '管理人員'}
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-100/60 p-1.5 rounded-2xl flex flex-wrap gap-1 max-w-max border border-slate-200/40">
        {[
          { id: 'student', label: '學員', icon: GraduationCap },
          { id: 'instructor', label: '講師', icon: User },
          { id: 'assistant', label: '助教', icon: Users },
          { id: 'admin', label: '管理人員', icon: ShieldCheck },
          { id: 'settings', label: '學員設定', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer active:scale-95 ${
                isActive 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-xl font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* TAB: SETTINGS SECTION */}
      {activeTab === 'settings' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-4xl animate-in fade-in duration-300">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-base font-extrabold text-slate-800">學員註冊與隱私設定</h2>
            <p className="text-xs text-slate-400 font-bold mt-1">自訂學員註冊表單中電話欄位的規範，並管理前台註冊時的服務條款。</p>
          </div>

          {settingsLoading ? (
            <div className="py-12 flex justify-center items-center text-slate-400 font-semibold text-xs">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-600" />
              載入設定中...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* Phone Mode Regulation */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">電話號碼欄位規範</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'required', title: '必填手機號碼', desc: '學員註冊或結帳時必須輸入手機電話才能送出。' },
                    { id: 'optional', title: '選填手機號碼', desc: '註冊或結帳時可不填寫手機號碼直接註冊。' },
                    { id: 'disabled', title: '停用手機欄位', desc: '註冊時將完全不顯示任何手機電話號碼輸入框。' },
                  ].map((mode) => (
                    <label 
                      key={mode.id}
                      className={`border p-4 rounded-xl flex flex-col justify-between space-y-2 cursor-pointer transition select-none ${
                        phoneMode === mode.id 
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' 
                          : 'border-slate-200 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold ${phoneMode === mode.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {mode.title}
                        </span>
                        <input 
                          type="radio" 
                          name="phoneMode"
                          checked={phoneMode === mode.id}
                          onChange={() => setPhoneMode(mode.id as any)}
                          className="w-3.5 h-3.5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 leading-normal">{mode.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* TOS Switch & Editors */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">註冊條款與隱私聲明機制</label>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">學員在完成信箱註冊時，是否必須勾選同意下方所設定之條款政策。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequireTosAgreement(!requireTosAgreement)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      requireTosAgreement ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        requireTosAgreement ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* TOS Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center text-slate-700 font-extrabold text-xs">
                      <FileText className="w-4 h-4 mr-1.5 text-slate-400" />
                      服務條款 (Terms of Service)
                    </div>
                    <textarea 
                      value={tosText}
                      onChange={(e) => setTosText(e.target.value)}
                      rows={8}
                      placeholder="請輸入平台對學員承諾的服務條約內容..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-semibold text-slate-600 leading-relaxed outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>

                  {/* Privacy Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center text-slate-700 font-extrabold text-xs">
                      <ShieldCheck className="w-4 h-4 mr-1.5 text-slate-400" />
                      隱私權政策 (Privacy Policy)
                    </div>
                    <textarea 
                      value={privacyText}
                      onChange={(e) => setPrivacyText(e.target.value)}
                      rows={8}
                      placeholder="請輸入關於如何妥善保護並合理使用學員註冊資訊之規範內容..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-semibold text-slate-600 leading-relaxed outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition flex items-center cursor-pointer active:scale-95"
                >
                  {settingsLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                  儲存學員設定
                </button>
              </div>

            </form>
          )}

        </div>
      ) : (
        /* MAIN LIST GRID: Left is Members Table, Right is Filter Aside */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-in fade-in duration-300">
          
          {/* Left Column: Member List Table */}
          <div className="lg:col-span-3 space-y-4">
            
            <div className="text-xs text-slate-400 font-extrabold flex justify-between items-center px-1">
              <span>
                共 <span className="text-slate-700 font-extrabold">{currentFiltered.length}</span> 位，顯示 1-{currentFiltered.length}
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 h-12">
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        成員名稱 / 電子信箱
                      </th>
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        聯絡電話
                      </th>
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        加入日期
                      </th>
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-right w-28">
                        操作設定
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-24 text-center text-slate-400 font-semibold text-xs">
                          <Loader2 className="w-5 h-5 mx-auto animate-spin text-indigo-600 mb-2" />
                          成員資料載入中...
                        </td>
                      </tr>
                    ) : currentFiltered.length > 0 ? (
                      currentFiltered.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/40 transition odd:bg-white even:bg-slate-50/10">
                          {/* Name / Email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-slate-800 text-xs">
                                {member.name || '未命名成員'}
                              </span>
                              {member.role === 'admin' && (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-600">
                                  管理員
                                </span>
                              )}
                              {member.role === 'instructor' && (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-600">
                                  講師
                                </span>
                              )}
                              {member.role === 'assistant' && (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 border border-amber-100 text-amber-600">
                                  助教
                                </span>
                              )}
                            </div>
                            
                            {/* Detailed Info (Email) */}
                            <div className="text-slate-400 text-[10px] font-bold mt-1 flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-slate-300" />
                              {member.email}
                            </div>

                            {/* Classification Badge (Single Purchase vs Subscription Plan) */}
                            {(member.role === 'user' || member.role === 'student') && (
                              <div className="flex flex-col gap-1 mt-1.5">
                                {/* A. Subscription Badge */}
                                {member.membership_plan_id ? (
                                  <div className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg max-w-max flex items-center">
                                    <Award className="w-2.5 h-2.5 mr-1 text-indigo-600" />
                                    訂閱會員：{getPlanTitle(member.membership_plan_id)} (至 {formatTaiwanDate(member.membership_expires_at)})
                                  </div>
                                ) : (
                                  <div className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100/50 px-2 py-0.5 rounded-lg max-w-max flex items-center select-none">
                                    <Award className="w-2.5 h-2.5 mr-1 text-slate-300" />
                                    一般學員 (無活動訂閱)
                                  </div>
                                )}
                              </div>
                            )}

                          </td>
                          {/* Phone */}
                          <td className="px-6 py-4 text-slate-600 font-extrabold text-xs">
                            {member.phone ? (
                              <span className="flex items-center">
                                <Phone className="w-3 h-3 mr-1 text-slate-400" />
                                {member.phone}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          {/* Join Date */}
                          <td className="px-6 py-4 text-slate-400 font-bold text-[11px]">
                            {formatTaiwanDate(member.created_at)}
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenEditModal(member)}
                                title="編輯資料與權限"
                                className="p-1.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition active:scale-90 cursor-pointer flex items-center justify-center"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member)}
                                title="刪除成員"
                                className="p-1.5 border border-rose-100 hover:border-rose-200 text-rose-500 hover:bg-rose-50/50 rounded-lg transition active:scale-90 cursor-pointer flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-24 text-center text-slate-400 italic text-xs font-bold">
                          查無符合篩選條件的成員帳戶。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Search filters aside */}
          <div className="lg:col-span-1 lg:order-first">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-2.5">
                <h3 className="font-extrabold text-slate-800 text-xs">即時搜尋篩選</h3>
              </div>
              
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">成員姓名</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="輸入姓名..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">電子信箱 (Email)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="輸入信箱..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">聯絡電話</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      placeholder="輸入手機..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={handleResetSearch}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-extrabold text-slate-500 text-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer text-center"
                  >
                    重設
                  </button>
                  <button 
                    type="button"
                    className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-xl font-extrabold text-xs transition select-none flex items-center justify-center cursor-default"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    已套用
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* UNIFIED MODAL: ADD / EDIT MEMBER & DETAILED ACCESS CONTROL */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`bg-white rounded-2xl border border-slate-100 shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all duration-300 ${
            memberRole === 'user' || memberRole === 'student' ? 'max-w-3xl' : 'max-w-md'
          }`}>
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {editingMember ? `編輯${editingMember.role === 'admin' ? '管理人員' : editingMember.role === 'instructor' ? '講師' : editingMember.role === 'assistant' ? '助教' : '學員資料與權限'}` : `新增${activeTab === 'student' ? '學員' : activeTab === 'instructor' ? '講師' : activeTab === 'assistant' ? '助教' : '管理人員'}`}
              </h3>
              <button 
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveMember} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 scrollbar-thin scrollbar-thumb-slate-200">
                <div className={`grid gap-6 ${
                  memberRole === 'user' || memberRole === 'student' ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1'
                }`}>
                  
                  {/* Left Column: Basic Personnel Details */}
                  <div className={`space-y-4 ${
                    memberRole === 'user' || memberRole === 'student' ? 'md:col-span-3 pr-2 md:border-r md:border-slate-100' : ''
                  }`}>
                    <div className="border-b border-slate-50 pb-1.5 mb-2.5">
                      <h4 className="font-extrabold text-slate-800 text-xs">基本資料設定</h4>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">姓名 <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="請輸入真實姓名"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">電子信箱 (Email) <span className="text-rose-500">*</span></label>
                      <input 
                        type="email" 
                        required
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        placeholder="example@mail.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">聯絡電話</label>
                      <input 
                        type="text" 
                        value={memberPhone}
                        onChange={(e) => setMemberPhone(e.target.value)}
                        placeholder="請輸入電話號碼"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">帳號角色身分 <span className="text-rose-500">*</span></label>
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                      >
                        <option value="user">學員</option>
                        <option value="instructor">講師</option>
                        <option value="assistant">助教</option>
                        <option value="admin">管理人員</option>
                      </select>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {editingMember ? '更換密碼 (留空代表不變更)' : '登入密碼 (最少 6 位數)'} {!editingMember && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <input 
                          type="password" 
                          required={!editingMember}
                          value={memberPassword}
                          onChange={(e) => setMemberPassword(e.target.value)}
                          placeholder={editingMember ? "留空即不重置密碼" : "輸入登入密碼"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Student Permissions & Access Options (Only visible for Students) */}
                  {(memberRole === 'user' || memberRole === 'student') && (
                    <div className="md:col-span-2 space-y-4 animate-in slide-in-from-right-4 duration-300">
                      
                      <div className="border-b border-slate-50 pb-1.5 mb-2.5 flex justify-between items-center">
                        <h4 className="font-extrabold text-slate-800 text-xs">學員權限與存取授權</h4>
                        {loadingPermissions && <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />}
                      </div>

                      {/* Membership subscription category */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">會員訂閱制方案</label>
                        <select
                          value={membershipPlanId}
                          onChange={(e) => setMembershipPlanId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                        >
                          <option value="">一般學員 (無訂閱會員身分)</option>
                          {membershipPlans.map(plan => (
                            <option key={plan.id} value={plan.id}>{plan.title} ({plan.period})</option>
                          ))}
                        </select>
                      </div>

                      {/* Expiry Date */}
                      {membershipPlanId && (
                        <div className="space-y-1 animate-in fade-in duration-200">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">會員訂閱到期日</label>
                          <div className="relative">
                            <input 
                              type="date" 
                              required={!!membershipPlanId}
                              value={membershipExpiresAt}
                              onChange={(e) => setMembershipExpiresAt(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          </div>
                        </div>
                      )}

                      {/* Single Course Purchase Authorization Checklist */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center">
                          <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          授權單堂課程（單堂個別授權）
                        </label>
                        
                        {/* Course inner filter */}
                        <input 
                          type="text"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          placeholder="過濾線上課程..."
                          className="w-full bg-slate-100/50 border border-slate-200/50 rounded-lg px-2.5 py-1 text-[10px] font-semibold text-slate-600 outline-none focus:border-indigo-500 transition mb-2"
                        />

                        {/* Scrollable course checkboxes list */}
                        <div className="border border-slate-100 rounded-xl max-h-48 overflow-y-auto p-2.5 space-y-1.5 bg-slate-50/50 scrollbar-thin">
                          {courses.length > 0 ? (
                            courses
                              .filter(c => !courseSearch.trim() || c.title?.toLowerCase().includes(courseSearch.toLowerCase()) || c.category?.toLowerCase().includes(courseSearch.toLowerCase()))
                              .map(course => {
                                const isGranted = selectedCourses.includes(course.id);
                                return (
                                  <label 
                                    key={course.id} 
                                    onClick={() => handleToggleCourse(course.id)}
                                    className={`flex items-center space-x-2 p-1.5 hover:bg-slate-200/40 rounded-lg cursor-pointer text-[10px] font-extrabold text-slate-600 select-none border transition ${
                                      isGranted ? 'bg-indigo-50/40 border-indigo-100/50' : 'bg-white border-transparent'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isGranted}
                                      onChange={() => {}} // handled by parent container click
                                      className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className="truncate flex-1">{course.title}</span>
                                    {isGranted && <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">已選</span>}
                                  </label>
                                );
                              })
                          ) : (
                            <div className="py-8 text-center text-slate-300 italic text-[10px]">
                              平台無既有線上課程
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                {(memberRole === 'user' || memberRole === 'student') ? (
                  <span className="text-[10px] font-extrabold text-slate-400">
                    已勾選單堂課：<span className="text-indigo-600 font-black text-xs">{selectedCourses.length}</span> 門 | 訂閱：<span className="text-indigo-600 font-black text-xs">{membershipPlanId ? '會員制' : '無'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-slate-400">
                    角色身分：{memberRole === 'admin' ? '系統管理員' : memberRole === 'instructor' ? '特聘講師' : '助教'}
                  </span>
                )}
                
                <div className="flex space-x-2">
                  <button 
                    type="button"
                    onClick={() => setIsMemberModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-extrabold text-slate-500 text-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    儲存成員與權限
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
