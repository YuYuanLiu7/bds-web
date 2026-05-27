import { getPublishedCourses } from "@/lib/courses";
import { getSiteSettingsServer } from "@/lib/site-settings";
import Link from 'next/link';
import { Star, Users, ArrowLeft, BookOpen } from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { id } = await params;
  
  // 1. Fetch visual settings and courses from the server
  const settings = await getSiteSettingsServer();
  const courses = await getPublishedCourses();
  
  // 2. Map Category ID to human-readable text
  const categoryMap: { [key: string]: string } = {
    'novice': '業務新手村',
    'industry': '線上產業講座',
    'job': '職場升級',
    'bookclub': '讀書會',
    'fireside': '爐邊對談',
    'firesidechats': '爐邊對談'
  };

  const readableCategory = categoryMap[id.toLowerCase()] || decodeURIComponent(id);
  const primaryColor = settings.primaryColor || '#21448e';

  // 3. Fallback mock courses if DB is empty
  const fallbackCourses = [
    { id: 'fs001', title: '硬體業務新手村', price: 3200, category: '業務新手村', thumbnail_url: 'https://warehouse.kaik.network/school/images/800c43d7-815d-4b73-8347-0f76477826f0.jpg', instructor: 'BDS 團隊', rating: 5.0, students: 142 },
    { id: 'fs002', title: '醫材產業新手村', price: 3500, category: '業務新手村', thumbnail_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800', instructor: 'BDS 團隊', rating: 5.0, students: 86 },
    { id: 'fs003', title: '外商遠距求職攻略', price: 2800, category: '職場升級', thumbnail_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800', instructor: 'BDS 團隊', rating: 4.9, students: 95 },
    { id: 'fs004', title: '文組跨領域高薪轉職', price: 2900, category: '職場升級', thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800', instructor: 'BDS 團隊', rating: 5.0, students: 110 },
    { id: 'fs005', title: '秒錄取的面試提問策略', price: 1800, category: '職場升級', thumbnail_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800', instructor: 'BDS 團隊', rating: 4.8, students: 78 },
    { id: 'fs006', title: 'BDS爐邊對談 Vol.1｜業務表達及提案關鍵', price: 0, category: '爐邊對談', thumbnail_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800', instructor: 'BDS 團隊', rating: 5.0, students: 230 }
  ];

  const displayedCourses = courses.length > 0 
    ? courses.map(c => ({
        id: c.id,
        title: c.title,
        price: c.price,
        category: c.category || '精選',
        thumbnail_url: c.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
        instructor: 'BDS 團隊',
        rating: 5.0,
        students: Math.floor(Math.random() * 80) + 12
      }))
    : fallbackCourses;

  // Filter courses by readableCategory
  // Supports fuzzy or exact match for robust rendering
  const filteredCourses = displayedCourses.filter(c => 
    c.category.includes(readableCategory) || 
    readableCategory.includes(c.category)
  );

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-16 font-sans relative overflow-hidden">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[320px] left-[5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[580px] right-[5%] w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      
      {/* Category Hero Header */}
      <div 
        style={{ backgroundColor: primaryColor }}
        className="w-full text-white py-16 md:py-24 px-6 relative overflow-hidden select-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto space-y-4 relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 回首頁
          </Link>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">分類課程專區</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{readableCategory}</h1>
            <p className="text-white/70 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
              深耕硬體、半導體與醫材產業，提供業界資深專家多年精煉的核心銷售理論與實戰思維。
            </p>
          </div>
        </div>
      </div>

      {/* Courses Grid Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4 select-none">
          <h2 className="text-lg font-black text-slate-800 flex items-center">
            <span className="w-1.5 h-5 bg-[#21448e] rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
            精選課程 ({filteredCourses.length})
          </h2>
          <span className="text-xs text-slate-400 font-bold">由 BDS 編輯團隊嚴選</span>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden flex flex-col group hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-350 transition-all duration-300"
              >
                {/* Thumbnail Cover */}
                <Link href={`/courses/${course.id}`} className="block relative aspect-[16/9] w-full overflow-hidden bg-slate-50">
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase select-none">
                    {course.category}
                  </div>
                </Link>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col text-left space-y-4">
                  <div className="space-y-1.5">
                    <Link 
                      href={`/courses/${course.id}`}
                      className="block font-black text-slate-800 hover:text-[#21448e] transition leading-snug line-clamp-2"
                      style={{ hover: { color: primaryColor } } as any}
                    >
                      {course.title}
                    </Link>
                    <span className="block text-slate-400 font-semibold text-[11px]">
                      講師：{course.instructor}
                    </span>
                  </div>

                  {/* Rating Stars & Student Count */}
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-b border-slate-50 py-2.5 select-none">
                    <div className="flex items-center">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 mr-1" />
                      <span className="text-slate-600 font-extrabold">{course.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3.5 h-3.5 text-slate-300 mr-1" />
                      <span>{course.students} 人已學習</span>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex items-center justify-between pt-1 select-none">
                    <span className="text-base font-extrabold text-slate-800">
                      {course.price === 0 ? '免費學習' : `NT$ ${course.price.toLocaleString()}`}
                    </span>
                    <Link 
                      href={`/courses/${course.id}`}
                      style={{ color: primaryColor, borderColor: `${primaryColor}20` }}
                      className="text-xs font-black border hover:bg-slate-50 px-4 py-2 rounded-xl transition duration-200"
                    >
                      立即選購
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white/90 backdrop-blur-md border border-slate-200/70 rounded-3xl p-16 select-none shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">此分類目前尚無發布課程</h3>
              <p className="text-slate-400 text-xs font-semibold">我們正在精心籌備這個分類的實戰課程，敬請期待！</p>
            </div>
            <Link 
              href="/"
              style={{ backgroundColor: primaryColor }}
              className="inline-block text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition hover:opacity-90 active:scale-95"
            >
              回首頁看看其他課程
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
