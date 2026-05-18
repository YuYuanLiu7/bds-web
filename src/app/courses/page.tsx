import CourseCard from "@/components/CourseCard";
import { getPublishedCourses } from "@/lib/courses";

const CATEGORIES = ["全部", "產業知識", "職涯策略", "專業技能", "讀書會", "新手村"];

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">所有課程</h1>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              cat === "全部" 
              ? "bg-blue-600 text-white" 
              : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-600"
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
          <p className="text-gray-500 col-span-full text-center py-20 italic">目前尚無課程...</p>
        )}
      </div>
    </div>
  );
}
