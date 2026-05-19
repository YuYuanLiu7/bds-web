'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import CourseModal from "@/components/admin/CourseModal";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">課程管理</h1>
          <p className="text-gray-500 text-sm">在這裡您可以管理您的課程內容與 Bunny.net 影片連結。</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5 mr-2" /> 新增課程
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl font-bold flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-sm font-bold text-gray-600">課程封面</th>
              <th className="px-8 py-5 text-sm font-bold text-gray-600">課程名稱 / ID</th>
              <th className="px-8 py-5 text-sm font-bold text-gray-600">價格</th>
              <th className="px-8 py-5 text-sm font-bold text-gray-600">章節數</th>
              <th className="px-8 py-5 text-sm font-bold text-gray-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center text-gray-400">載入中...</td></tr>
            ) : Array.isArray(courses) && courses.length > 0 ? (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50/50 transition group">
                  <td className="px-8 py-5">
                    <div className="relative w-24 h-14 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                      <Image 
                        src={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"} 
                        alt={course.title} 
                        fill 
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-gray-900 group-hover:text-blue-600 transition">{course.title}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-1 uppercase">{course.id}</div>
                  </td>
                  <td className="px-8 py-5 text-gray-700 font-bold">
                    NT$ {course.price.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-gray-500">
                    {course.chapters?.length || 0} 個章節
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(course)}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(course.id)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
        {!loading && (!Array.isArray(courses) || courses.length === 0) && (
          <div className="py-20 text-center text-gray-400 italic">
            目前沒有任何課程。
          </div>
        )}
      </div>

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
