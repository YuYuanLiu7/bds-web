import CoursesClient from "@/components/CoursesClient";
import { getPublishedCourses } from "@/lib/courses";

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-16 font-sans relative overflow-hidden">

      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[220px] left-[5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[480px] right-[5%] w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-[130px] pointer-events-none -z-10"></div>

      {/* Main Container */}
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">所有課程</h1>

        {/* 分類篩選 + 課程列表（互動篩選於 client 元件處理） */}
        <CoursesClient courses={courses} />
      </div>
    </div>
  );
}
