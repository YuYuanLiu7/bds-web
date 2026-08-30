'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Copy, Check, MoreVertical, BookOpen, GraduationCap, Users, DollarSign, Filter, Search, List, ArrowUpDown, Tags, ArrowUp, ArrowDown, GripVertical, Save } from "lucide-react";
import SafeImage from '@/components/SafeImage';
import CourseModal, { Course } from "@/components/admin/CourseModal";
import { useAdminResource } from '@/hooks/useAdminResource';
import { useToast } from '@/components/Toast';

// 課程列表頁額外攜帶之統計欄位（後端 courses_full 回傳）
interface AdminCourse extends Course {
  id: string;
  netSales?: number;
  studentCount?: number;
  instructor_avatar?: string | null;
  sort_order?: number;
}

// 課程分類（對應 /api/admin/course-categories 回傳）
interface CourseCategory {
  id: string;
  name: string;
  slug?: string | null;
  sort_order?: number;
}

// 課程頁子導覽區塊代號
type CourseSection = 'list' | 'order' | 'categories';

export default function AdminCoursesPage() {
  const toast = useToast();
  // 清單資料改由共用 Hook 統一管理（載入 / 錯誤 / 重抓）
  const { items: courses, loading, error, refetch } = useAdminResource<AdminCourse>('/api/admin/courses_full');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);

  // 課程頁內的子導覽狀態（課程列表 / 顯示順序 / 課程類別）
  const [activeSection, setActiveSection] = useState<CourseSection>('list');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');

  // Tracks which card's menu is open
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 點擊選單與觸發鈕以外的區域時，自動關閉三點選單
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-course-menu]')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const handleEdit = (course: AdminCourse) => {
    setEditingCourse(course);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此課程嗎？這將會連同所有章節一起刪除。')) return;

    try {
      // 刪除端點與清單端點不同（清單走 courses_full、刪除走 courses），故保留手動呼叫
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' });
      // 解析後端回傳內容，取得真實的刪除失敗原因（例如外鍵約束）
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || '刪除失敗');
        return;
      }
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('刪除失敗');
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    setActiveMenuId(null);
  };

  const uniqueCategories = Array.from(new Set(courses.map(c => c.category).filter(Boolean)));
  const uniqueInstructors = Array.from(new Set(courses.map(c => c.instructor || 'BDS 團隊').filter(Boolean)));

  const filteredCourses = courses.filter(course => {
    const title = course.title || '';
    const desc = course.description || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          desc.toLowerCase().includes(searchQuery.toLowerCase());

    const isPublished = course.is_published === true;
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'published' && isPublished) ||
                          (statusFilter === 'draft' && !isPublished);

    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;

    const instructorName = course.instructor || 'BDS 團隊';
    const matchesInstructor = instructorFilter === 'all' || instructorName === instructorFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesInstructor;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setInstructorFilter('all');
  };

  // ---- 顯示順序（sort_order）區塊狀態與邏輯 ----
  const [orderList, setOrderList] = useState<AdminCourse[]>([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 清單載入或更新後，同步排序清單（未編輯時才覆寫，避免蓋掉使用者調整）
  useEffect(() => {
    if (orderDirty) return;
    const sorted = [...courses].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setOrderList(sorted);
  }, [courses, orderDirty]);

  const moveOrderItem = (from: number, to: number) => {
    setOrderList(prev => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setOrderDirty(true);
  };

  const handleDrop = (dropIndex: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragOverIndex(null);
    if (from === null || from === dropIndex) return;
    moveOrderItem(from, dropIndex);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const payload = orderList.map((c, i) => ({ id: c.id, sort_order: i }));
      const res = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '排序儲存失敗');
      toast.success('課程顯示順序已儲存');
      setOrderDirty(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '排序儲存失敗');
    } finally {
      setSavingOrder(false);
    }
  };

  // ---- 課程類別區塊狀態與邏輯 ----
  const { items: categories, loading: catLoading, error: catError, refetch: refetchCats } =
    useAdminResource<CourseCategory>('/api/admin/course-categories');
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [catList, setCatList] = useState<CourseCategory[]>([]);
  const [catDirty, setCatDirty] = useState(false);
  const [savingCatOrder, setSavingCatOrder] = useState(false);

  useEffect(() => {
    if (catDirty) return;
    setCatList([...categories]);
  }, [categories, catDirty]);

  const moveCatItem = (from: number, to: number) => {
    setCatList(prev => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setCatDirty(true);
  };

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) {
      toast.error('請輸入分類名稱');
      return;
    }
    setAddingCat(true);
    try {
      const res = await fetch('/api/admin/course-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: newCatSlug.trim() || null, sort_order: categories.length }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '新增分類失敗');
      setNewCatName('');
      setNewCatSlug('');
      toast.success('分類已新增');
      refetchCats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '新增分類失敗');
    } finally {
      setAddingCat(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('確定要刪除此分類嗎？')) return;
    try {
      const res = await fetch(`/api/admin/course-categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '刪除分類失敗');
      toast.success('分類已刪除');
      refetchCats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '刪除分類失敗');
    }
  };

  const saveCatOrder = async () => {
    setSavingCatOrder(true);
    try {
      const payload = catList.map((c, i) => ({ id: c.id, sort_order: i }));
      const res = await fetch('/api/admin/course-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '分類排序儲存失敗');
      toast.success('分類排序已儲存');
      setCatDirty(false);
      refetchCats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '分類排序儲存失敗');
    } finally {
      setSavingCatOrder(false);
    }
  };

  // 子導覽項目定義
  const navItems: { key: CourseSection; label: string; icon: typeof List }[] = [
    { key: 'list', label: '課程列表', icon: List },
    { key: 'order', label: '顯示順序', icon: ArrowUpDown },
    { key: 'categories', label: '課程類別', icon: Tags },
  ];

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">

      {/* Title & Add Course button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <GraduationCap className="w-7 h-7 mr-2 text-indigo-600" />
            課程
          </h1>
        </div>

        <button
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 建立課程
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-xl font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* 課程頁主體：左側子導覽 + 右側內容 */}
      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* 左側子導覽 */}
        <aside className="w-full md:w-48 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-xs p-2 flex md:flex-col gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`flex-1 md:flex-none flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${active ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* 右側內容區 */}
        <div className="flex-1 min-w-0 w-full">

          {/* ===== 課程列表區塊 ===== */}
          {activeSection === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

              {/* Left Column: Courses Cards Grid (lg:col-span-3) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold select-none">
                  <span>
                    篩選出 <span className="text-slate-700 font-extrabold">{filteredCourses.length}</span> 門課程
                  </span>
                  {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || instructorFilter !== 'all') && (
                    <button
                      onClick={handleResetFilters}
                      className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                    >
                      重設篩選條件
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="py-32 text-center text-slate-400 font-semibold text-sm">
                    課程資料載入中...
                  </div>
                ) : filteredCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {filteredCourses.map((course) => {
                      const lecturerName: string = course.instructor || 'BDS 團隊';
                      const lecturerAvatar: string | null = course.instructor_avatar || null;

                      return (
                        <div
                          key={course.id}
                          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition relative"
                        >
                          {/* Course Cover Photo */}
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 border-b border-slate-50">
                            <SafeImage
                              src={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"}
                              alt={course.title || '課程封面'}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                            />
                          </div>

                          {/* Card Main Info Block */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">

                              {/* Tags row & Action Menu */}
                              <div className="flex justify-between items-start gap-2 relative">
                                <div className="flex items-center space-x-1.5">
                                  <span className="inline-flex px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-400 font-bold text-[9px]">
                                    付費課程
                                  </span>
                                  <span className={`inline-flex px-1.5 py-0.5 rounded border font-black text-[9px] ${
                                    course.is_published
                                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                      : 'bg-amber-50 border-amber-100 text-amber-600'
                                  }`}>
                                    {course.is_published ? '已發布' : '草稿'}
                                  </span>
                                  {course.is_hidden && (
                                    <span className="inline-flex px-1.5 py-0.5 rounded border font-black text-[9px] bg-rose-50 border-rose-100 text-rose-600">
                                      已隱藏
                                    </span>
                                  )}
                                </div>

                                {/* Vertical Menu Trigger */}
                                <div className="relative" data-course-menu>
                                  <button
                                    onClick={() => setActiveMenuId(activeMenuId === course.id ? null : course.id)}
                                    className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {/* Dropdown Options */}
                                  {activeMenuId === course.id && (
                                    <div className="absolute right-0 top-6 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-30 min-w-32 animate-in fade-in duration-100">
                                      <button
                                        onClick={() => handleCopyId(course.id)}
                                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center"
                                      >
                                        {copiedId === course.id ? (
                                          <>
                                            <Check className="w-3.5 h-3.5 mr-2 text-green-600" />
                                            已複製 ID
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                            複製 ID
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleEdit(course)}
                                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                        編輯
                                      </button>
                                      <div className="border-t border-slate-100 my-1"></div>
                                      <button
                                        onClick={() => handleDelete(course.id)}
                                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-2 text-red-400" />
                                        刪除課程
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Title */}
                              <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition leading-snug line-clamp-2">
                                <Link href={`/admin/courses/${course.id}/students`} className="hover:underline">
                                  {course.title}
                                </Link>
                              </h3>
                            </div>

                            {/* Course stats block (Students count and Net Sales) */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[10px] font-bold">
                              <div className="flex items-center text-slate-500">
                                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                <span>學員: <span className="text-slate-800 font-extrabold">{course.studentCount || 0}</span> 人</span>
                              </div>
                              <div className="flex items-center text-slate-500 justify-end">
                                <DollarSign className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                                <span>銷售: <span className="text-emerald-600 font-extrabold">NT$ {(course.netSales || 0).toLocaleString()}</span></span>
                              </div>
                            </div>

                            {/* Footer Stats & Lecturer avatar row */}
                            <div className="flex items-center justify-between border-t border-slate-50 pt-3 gap-2">
                              <div className="flex items-center min-w-0">
                                {lecturerAvatar ? (
                                  <img
                                    src={lecturerAvatar}
                                    alt={`${lecturerName} 講師頭像`}
                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                    onError={(e)=>{const t=e.currentTarget; if(!t.src.endsWith('/images/course-placeholder.svg')) t.src='/images/course-placeholder.svg';}}
                                  />
                                ) : (
                                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                    {lecturerName.charAt(0)}
                                  </span>
                                )}
                                <span className="ml-1.5 text-[11px] font-bold text-slate-400 truncate flex-1">
                                  {lecturerName}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2.5 text-[10px] font-bold text-slate-400 flex-shrink-0">
                                <span className="flex items-center">
                                  <BookOpen className="w-3 h-3 mr-0.5 text-slate-300" />
                                  <span>{course.chapters?.length || 0} 章</span>
                                </span>
                              </div>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-32 text-center text-slate-400 italic text-sm">
                    找不到符合搜尋與篩選條件的課程。
                  </div>
                )}
              </div>

              {/* Right Column: Filter Sidebar (lg:col-span-1) */}
              <div className="lg:col-span-1 space-y-4 select-none">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
                  <h3 className="font-extrabold text-slate-800 text-xs pb-3 border-b border-slate-50 uppercase tracking-wider flex items-center">
                    <Filter className="w-4 h-4 mr-1.5 text-indigo-600" />
                    課程篩選
                  </h3>

                  <div className="space-y-4">
                    {/* Search input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">關鍵字搜尋</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          placeholder="搜尋課程標題、描述"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Status Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">課程狀態</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition bg-white"
                      >
                        <option value="all">全部狀態</option>
                        <option value="published">🟢 已發布</option>
                        <option value="draft">🟡 草稿 (未發布)</option>
                      </select>
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">課程分類</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition bg-white"
                      >
                        <option value="all">所有分類</option>
                        {uniqueCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Instructor Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">授課講師</label>
                      <select
                        value={instructorFilter}
                        onChange={(e) => setInstructorFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition bg-white"
                      >
                        <option value="all">所有講師</option>
                        {uniqueInstructors.map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ===== 顯示順序區塊 ===== */}
          {activeSection === 'order' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center">
                    <ArrowUpDown className="w-4 h-4 mr-1.5 text-indigo-600" />
                    課程顯示順序
                  </h2>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">
                    拖曳項目，或使用上下按鈕調整順序，完成後按「儲存順序」。
                  </p>
                </div>
                <button
                  onClick={saveOrder}
                  disabled={!orderDirty || savingOrder}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98 flex-shrink-0"
                >
                  <Save className="w-4 h-4 mr-1.5" /> {savingOrder ? '儲存中...' : '儲存順序'}
                </button>
              </div>

              {loading ? (
                <div className="py-32 text-center text-slate-400 font-semibold text-sm">課程資料載入中...</div>
              ) : orderList.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-50 overflow-hidden">
                  {orderList.map((course, index) => (
                    <div
                      key={course.id}
                      draggable
                      onDragStart={() => { dragIndexRef.current = index; }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                      onDragLeave={() => setDragOverIndex(prev => (prev === index ? null : prev))}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={() => { dragIndexRef.current = null; setDragOverIndex(null); }}
                      className={`flex items-center gap-3 px-4 py-3 transition ${
                        dragOverIndex === index ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-slate-300 cursor-grab active:cursor-grabbing flex-shrink-0" title="拖曳排序">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <span className="w-6 text-center text-[11px] font-black text-slate-400 flex-shrink-0">{index + 1}</span>
                      <div className="relative w-12 h-8 rounded-md overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                        <SafeImage
                          src={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200"}
                          alt={course.title || '課程封面'}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate">{course.title}</div>
                        <div className="text-[10px] font-semibold text-slate-400 truncate">{course.category || '未分類'}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => moveOrderItem(index, index - 1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="上移"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveOrderItem(index, index + 1)}
                          disabled={index === orderList.length - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="下移"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center text-slate-400 italic text-sm">目前尚無課程可排序。</div>
              )}
            </div>
          )}

          {/* ===== 課程類別區塊 ===== */}
          {activeSection === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

              {/* 類別清單（可排序 / 刪除） */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800 flex items-center">
                      <Tags className="w-4 h-4 mr-1.5 text-indigo-600" />
                      課程類別
                    </h2>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">
                      使用上下按鈕調整類別排序，完成後按「儲存排序」。
                    </p>
                  </div>
                  <button
                    onClick={saveCatOrder}
                    disabled={!catDirty || savingCatOrder}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98 flex-shrink-0"
                  >
                    <Save className="w-4 h-4 mr-1.5" /> {savingCatOrder ? '儲存中...' : '儲存排序'}
                  </button>
                </div>

                {catError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-3 rounded-xl font-bold text-xs">
                    ⚠️ {catError}
                  </div>
                )}

                {catLoading ? (
                  <div className="py-24 text-center text-slate-400 font-semibold text-sm">分類載入中...</div>
                ) : catList.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-50 overflow-hidden">
                    {catList.map((cat, index) => (
                      <div key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
                        <span className="w-6 text-center text-[11px] font-black text-slate-400 flex-shrink-0">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-700 truncate">{cat.name}</div>
                          <div className="text-[10px] font-semibold text-slate-400 truncate">
                            /{cat.slug || <span className="italic text-slate-300">未設定 slug</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveCatItem(index, index - 1)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title="上移"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveCatItem(index, index + 1)}
                            disabled={index === catList.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title="下移"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="刪除分類"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center text-slate-400 italic text-sm">目前尚無課程類別，請於右側新增。</div>
                )}
              </div>

              {/* 新增類別表單 */}
              <div className="lg:col-span-1">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-xs pb-3 border-b border-slate-50 uppercase tracking-wider flex items-center">
                    <Plus className="w-4 h-4 mr-1.5 text-indigo-600" />
                    新增類別
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">分類名稱</label>
                    <input
                      type="text"
                      placeholder="例如：業務新手村"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">網址 slug（選填）</label>
                    <input
                      type="text"
                      placeholder="例如：beginner"
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>

                  <button
                    onClick={addCategory}
                    disabled={addingCat}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center cursor-pointer active:scale-98"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> {addingCat ? '新增中...' : '新增類別'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Modal structure */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
        course={editingCourse}
      />

    </div>
  );
}
