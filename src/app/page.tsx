import CourseCard from "@/components/CourseCard";

const FEATURED_COURSES = [
  {
    id: "1",
    title: "【產業大講堂】硬體 ODM 體系深度解密",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    price: 1200,
    category: "產業知識",
    instructor: "BDS 團隊"
  },
  {
    id: "2",
    title: "【圍爐夜話】外商遠端工作的求職策略與面試技巧",
    thumbnail: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800",
    price: 800,
    category: "職涯策略",
    instructor: "BDS 團隊"
  },
  {
    id: "3",
    title: "【新手村】半導體通路業務入門手冊",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    price: 2500,
    category: "專業技能",
    instructor: "BDS 團隊"
  }
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-white py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            提升職涯競爭力，從 <span className="text-blue-600">Doing</span> 開始
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            專為硬體、半導體、醫材產業打造的業務開發與銷售學習平台。我們不只教知識，更教你如何實戰。
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-blue-700 transition">
              探索課程
            </button>
            <button className="bg-gray-100 text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-200 transition">
              關於我們
            </button>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">精選課程</h2>
            <p className="text-gray-500">最新、最熱門的產業實戰課程</p>
          </div>
          <button className="text-blue-600 font-bold hover:underline">查看全部課程 →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURED_COURSES.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      </section>

      {/* Stats / Why Us */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-white mb-2">50+</div>
            <div className="text-blue-100">在線課程</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-2">3000+</div>
            <div className="text-blue-100">學員好評</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-2">20+</div>
            <div className="text-blue-100">資深講師</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-2">100%</div>
            <div className="text-blue-100">實戰導向</div>
          </div>
        </div>
      </section>
    </div>
  );
}
