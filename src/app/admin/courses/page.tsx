'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Copy, Check, MoreVertical, Star, BookOpen, GraduationCap, ChevronDown, Users, DollarSign, Filter, Search } from "lucide-react";
import SafeImage from '@/components/SafeImage';
import CourseModal from "@/components/admin/CourseModal";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');

  // Tracks which card's menu is open
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/courses_full');
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setCourses(data);
      } else {
        setError(data.error || '無法取得課程資料');
        setCourses([]);
      }
    } catch (err) {
      console.error(err);
      setError('連線發生錯誤');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

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

  const handleEdit = (course: any) => {
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
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' });
      // 解析後端回傳內容，取得真實的刪除失敗原因（例如外鍵約束）
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || '刪除失敗');
        return;
      }
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('刪除失敗');
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

  // Global stats calculations
  const totalCoursesCount = courses.length;
  const grandNetSales = courses.reduce((sum, c) => sum + (c.netSales || 0), 0);
  const grandStudentAccesses = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

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

      {/* Course Summary Analytics Dashboard */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-300">
          {/* Card 1: Total Courses */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">上架課程總數</div>
              <div className="text-base font-black text-slate-800 mt-0.5">{totalCoursesCount} <span className="text-[10px] font-extrabold text-slate-400">門</span></div>
            </div>
          </div>

          {/* Card 2: Cumulative Student Accesses */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">累計看課學員</div>
              <div className="text-base font-black text-slate-800 mt-0.5">{grandStudentAccesses} <span className="text-[10px] font-extrabold text-slate-400">人次</span></div>
            </div>
          </div>

          {/* Card 3: Grand Net Sales Total */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">全站課程淨銷售總額</div>
              <div className="text-base font-black text-emerald-600 mt-0.5">NT$ {grandNetSales.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid for Cards and Filters */}
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

      {/* Modal structure */}
      <CourseModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchCourses();
        }} 
        course={editingCourse} 
      />

    </div>
  );
}
