import CoursesClient from "@/components/CoursesClient";
import { getPublishedCourses } from "@/lib/courses";

export const metadata = {
  title: "所有課程",
  description: "精選硬體、半導體、醫材產業的業務開發與銷售實戰課程，由資深產業經理人親自授課。",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="bg-slate-50 min-h-screen pb-16 font-sans">

      {/* Main Container */}
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">所有課程</h1>

        {/* 分類篩選 + 課程列表（互動篩選於 client 元件處理） */}
        <CoursesClient courses={courses} />
      </div>
    </div>
  );
}
