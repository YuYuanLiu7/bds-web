import { getPublishedCourses } from "@/lib/courses";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import Image from "next/image";

export default async function AdminCoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">課程管理</h1>
          <p className="text-gray-500 text-sm">在這裡您可以新增、編輯或刪除您的課程內容。</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-blue-700 transition">
          <Plus className="w-4 h-4 mr-2" /> 新增課程
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-bold text-gray-600">課程封面</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">課程名稱</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">價格</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">分類</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">狀態</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-4">
                  <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-gray-100">
                    <Image 
                      src={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"} 
                      alt={course.title} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{course.title}</div>
                  <div className="text-xs text-gray-400">ID: {course.id}</div>
                </td>
                <td className="px-6 py-4 text-gray-700 font-medium">
                  NT$ {course.price.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded">
                    {course.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center text-green-600 text-xs font-bold">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    已上架
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 transition">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <div className="py-20 text-center text-gray-400 italic">
            目前沒有任何課程。
          </div>
        )}
      </div>
    </div>
  );
}
