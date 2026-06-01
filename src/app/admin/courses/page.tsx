'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Copy, Check, MoreVertical, Star, User as UserIcon, BookOpen, GraduationCap, ChevronDown } from "lucide-react";
import Image from "next/image";
import CourseModal from "@/components/admin/CourseModal";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) throw new Error('刪除失敗');
      fetchCourses();
    } catch (err) {
      alert('刪除失敗');
    }
    setActiveMenuId(null);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    setActiveMenuId(null);
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
            <span className="material-symbols-outlined mr-2 text-indigo-600" style={{ fontSize: '26px' }}>school</span>
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
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>school</span>
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">上架課程總數</div>
              <div className="text-base font-black text-slate-800 mt-0.5">{totalCoursesCount} <span className="text-[10px] font-extrabold text-slate-400">門</span></div>
            </div>
          </div>

          {/* Card 2: Cumulative Student Accesses */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>group</span>
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">累計看課學員</div>
              <div className="text-base font-black text-slate-800 mt-0.5">{grandStudentAccesses} <span className="text-[10px] font-extrabold text-slate-400">人次</span></div>
            </div>
          </div>

          {/* Card 3: Grand Net Sales Total */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>payments</span>
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">全站課程淨銷售總額</div>
              <div className="text-base font-black text-emerald-600 mt-0.5">NT$ {grandNetSales.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Cards Grid */}
      {loading ? (
        <div className="py-32 text-center text-slate-400 font-semibold text-sm">
          課程資料載入中...
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {courses.map((course) => {
            const hasChapters = course.chapters && course.chapters.length > 0;
            const mockLecturer = {
              name: 'BDS 團隊',
              avatar: 'https://warehouse.kaik.network/lecturer/avatar/182000da-6fcd-4748-86df-e1f3b122a8c2/92222ca2-c0b8-421e-a120-a42236f5b80a.jpg'
            };

            return (
              <div 
                key={course.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition relative"
              >
                {/* Course Cover Photo */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 border-b border-slate-50">
                  <Image 
                    src={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"} 
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition duration-500"
                    unoptimized={true}
                  />
                </div>

                {/* Card Main Info Block */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    
                    {/* Tags row & Action Menu */}
                    <div className="flex justify-between items-start gap-2 relative">
                      <span className="inline-flex px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-400 font-bold text-[10px]">
                        付費課程
                      </span>
                      
                      {/* Vertical Menu Trigger */}
                      <div className="relative">
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
                      <span className="material-symbols-outlined mr-1 text-slate-400" style={{ fontSize: '13px' }}>group</span>
                      <span>學員: <span className="text-slate-800 font-extrabold">{course.studentCount || 0}</span> 人</span>
                    </div>
                    <div className="flex items-center text-slate-500 justify-end">
                      <span className="material-symbols-outlined mr-1 text-slate-400" style={{ fontSize: '13px' }}>payments</span>
                      <span>銷售: <span className="text-emerald-600 font-extrabold">NT$ {(course.netSales || 0).toLocaleString()}</span></span>
                    </div>
                  </div>

                  {/* Footer Stats & Lecturer avatar row */}
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3 gap-2">
                    <div className="flex items-center min-w-0">
                      <img 
                        src={mockLecturer.avatar} 
                        alt={mockLecturer.name} 
                        className="w-5.5 h-5.5 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="ml-1.5 text-[11px] font-bold text-slate-400 truncate flex-1">
                        {mockLecturer.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2.5 text-[10px] font-bold text-slate-400 flex-shrink-0">
                      <span className="flex items-center">
                        <span className="text-amber-400 mr-0.5">★</span>
                        <span>5.0</span>
                      </span>
                      <span className="flex items-center">
                        <UserIcon className="w-3 h-3 mr-0.5 text-slate-300" />
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
          目前沒有任何課程，點擊「建立課程」開始新增！
        </div>
      )}

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
