import CourseCard from "@/components/CourseCard";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, Briefcase, Globe, TrendingUp } from "lucide-react";
import { getPublishedCourses } from "@/lib/courses";

export default async function Home() {
  const courses = await getPublishedCourses();
  const featuredCourses = courses.slice(0, 3);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
              BDS <br />
              <span className="text-blue-600">Business Development & Sales</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              橋接理論與實踐，深耕硬體、半導體與醫材產業。<br />
              專為追求卓越的業務與開發者打造的專業實戰平台。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/courses" 
                className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center"
              >
                所有課程 <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/signup" 
                className="bg-white text-gray-900 border-2 border-gray-200 px-10 py-4 rounded-full font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition flex items-center justify-center"
              >
                加入我們
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
      </section>

      {/* Core Values / Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-blue-50 transition duration-500 border border-gray-100">
              <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">產業交流</h3>
              <p className="text-gray-600 leading-relaxed">
                建立專業的人脈網絡，與來自半導體、醫療器材及 ODM 領域的頂尖專家深度對話。
              </p>
            </div>
            <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-blue-50 transition duration-500 border border-gray-100">
              <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">實戰知識</h3>
              <p className="text-gray-600 leading-relaxed">
                拒絕純理論，我們只提供第一線的業務開發心法、求職策略以及產業深度解密。
              </p>
            </div>
            <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-blue-50 transition duration-500 border border-gray-100">
              <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">職場升級</h3>
              <p className="text-gray-600 leading-relaxed">
                專為轉職者與新手打造的培訓體系，助您順利切入高薪產業，實現職涯躍遷。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Highlight Sections (Mirroring Categories from reference) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16">
            <div className="text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">探索我們的學習軌跡</h2>
              <p className="text-lg text-gray-500">從新手村到產業專家，BDS 全程陪伴您的成長。</p>
            </div>
            <Link href="/courses" className="text-blue-600 font-bold flex items-center hover:underline text-lg">
              查看所有分類 <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {['業務新手村', '產業大講堂', '圍爐夜話', '讀書會'].map((cat) => (
              <div key={cat} className="bg-white p-6 rounded-2xl border border-gray-100 text-center hover:shadow-lg transition cursor-pointer">
                <span className="font-bold text-gray-800">{cat}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.length > 0 ? (
              featuredCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  id={course.id}
                  title={course.title}
                  thumbnail={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"}
                  price={course.price}
                  category={course.category || "精選"}
                  instructor="BDS 團隊"
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-400 italic">正在載入精選課程...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">準備好開啟您的職涯新篇章了嗎？</h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            加入超過 500+ 位產業菁英的行列，讓我們一起用實踐定義未來。
          </p>
          <Link 
            href="/signup" 
            className="bg-white text-blue-600 px-12 py-4 rounded-full font-bold text-xl hover:bg-gray-100 transition shadow-2xl"
          >
            立即免費註冊
          </Link>
        </div>
        {/* Background Decorative Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full -mt-20 -ml-20 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-700 rounded-full -mb-20 -mr-20 opacity-50"></div>
      </section>
    </div>
  );
}
