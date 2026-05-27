import CourseCard from "@/components/CourseCard";
import { getPublishedCourses } from "@/lib/courses";

const CATEGORIES = ["全部", "產業知識", "職涯策略", "專業技能", "讀書會", "新手村"];

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
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2.5 mb-10 select-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`px-5 py-2 rounded-full text-xs font-black transition duration-200 border shadow-xs cursor-pointer ${
                cat === "全部" 
                ? "bg-blue-600 border-blue-600 text-white" 
                : "bg-white/80 backdrop-blur-md text-slate-600 border-slate-200/70 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.length > 0 ? (
            courses.map((course) => (
              <CourseCard 
                key={course.id} 
                id={course.id}
                title={course.title}
                thumbnail={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"}
                price={course.price}
                category={course.category || "未分類"}
                instructor="BDS 團隊"
              />
            ))
          ) : (
            <p className="text-slate-500 col-span-full text-center py-20 italic font-semibold">目前尚無課程...</p>
          )}
        </div>
      </div>
    </div>
  );
}
