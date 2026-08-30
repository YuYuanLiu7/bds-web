import SafeImage from '@/components/SafeImage';
import { CheckCircle, PlayCircle, Clock, Users } from 'lucide-react';
import BuyButton from '@/components/BuyButton';
import { getCourseById } from '@/lib/courses';
import { canAccess } from '@/lib/entitlements';
import { getUserByEmail } from '@/lib/users';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import CourseReviews from '@/components/CourseReviews';
import DOMPurify from 'isomorphic-dompurify';

// 課程簡介現在是富文本（HTML）；顯示前一律淨化，metadata 用純文字。
function stripHtml(html: string | null | undefined): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) return { title: "課程" };
  return {
    title: course.title,
    description: stripHtml(course.description) || `${course.title} — BDS By Doing So 線上實戰課程。`,
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const course = await getCourseById(id);

  if (!course) {
    notFound();
  }

  // 未發佈/隱藏的課程僅管理員可瀏覽，避免知道 UUID 的訪客看到草稿課程的標題/售價/章節
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';
  const courseRow = course as typeof course & { is_published?: boolean; is_hidden?: boolean };
  if (!isAdmin && (courseRow.is_published === false || courseRow.is_hidden === true)) {
    notFound();
  }

  let hasAccess = false;
  if (session?.user?.email) {
    const user = await getUserByEmail(session.user.email);
    if (user) {
      hasAccess = await canAccess({ id: user.id, role: user.role }, { kind: 'course', id });
    }
  }

  // 靜態資料，未來可考慮放入資料庫
  const features = [
    "高畫質影片教學",
    "實戰案例分析",
    "講師線上 QA 解惑",
    "終身存取權限"
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-20 font-sans relative overflow-hidden">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[220px] left-[5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[480px] right-[5%] w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-[130px] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold mb-4">
              {course.category || "未分類"}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              {course.title}
            </h1>
            <div
              className="text-lg text-gray-600 mb-8 leading-relaxed prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.description || '') }}
            />
            {course.points && stripHtml(course.points) && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">課程重點</h2>
                <div
                  className="text-base text-gray-600 leading-relaxed prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-li:my-1"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(course.points) }}
                />
              </div>
            )}
            <div className="flex items-center space-x-6 text-gray-500 text-sm">
              <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> 課程大綱共 {course.chapters.length} 章節</div>
              <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> 專業講師授課</div>
            </div>
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-gray-100">
            <SafeImage
              src={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {hasAccess ? (
              <Link href={`/courses/${id}/learn`} className="absolute inset-0 bg-black/20 flex items-center justify-center group cursor-pointer">
                <div className="bg-white/90 p-4 rounded-full group-hover:scale-110 transition">
                  <PlayCircle className="w-12 h-12 text-blue-600 fill-blue-600/10" />
                </div>
              </Link>
            ) : (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <div className="bg-white/90 p-4 rounded-full opacity-50">
                  <PlayCircle className="w-12 h-12 text-gray-400" />
                </div>
              </div>
            )}
          </div>
          </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
          {/* What you'll learn */}
          <section className="bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-slate-200/70 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">課程內容亮點</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Curriculum */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">課程大綱</h2>
            <div className="space-y-3">
              {course.chapters.length > 0 ? (
                course.chapters.map((chapter, i) => {
                  const content = (
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 mr-4">
                        {i + 1}
                      </div>
                      <span className="font-medium text-gray-900">{chapter.title}</span>
                    </div>
                  );

                  return hasAccess ? (
                    <Link 
                      key={chapter.id} 
                      href={`/courses/${id}/learn/${chapter.id}`}
                      className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-slate-200/70 shadow-xs flex items-center justify-between hover:border-blue-200 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
                    >
                      {content}
                      <PlayCircle className="w-4 h-4 text-blue-500" />
                    </Link>
                  ) : (
                    <div 
                      key={chapter.id} 
                      className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between opacity-75"
                    >
                      {content}
                      <Clock className="w-4 h-4 text-gray-300" />
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 italic">尚未規劃章節</p>
              )}
            </div>
          </section>

          {course.allow_ratings !== false && (
            <CourseReviews 
              courseId={course.id}
              courseTitle={course.title}
              studentName={session?.user?.name || session?.user?.email || '學員'}
              hasAccess={hasAccess}
            />
          )}
          </div>
        {/* Sidebar (Buy Box) */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-slate-200/70 shadow-lg sticky top-24">
            <div className="mb-6">
              <div className="text-gray-500 text-sm mb-1 uppercase font-bold tracking-wider">課程售價</div>
              <div className="text-4xl font-extrabold text-blue-600">NT$ {course.price.toLocaleString()}</div>
            </div>
            
            {hasAccess ? (
              <Link
                href={`/courses/${id}/learn`}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition mb-4 shadow-green-200 shadow-lg flex items-center justify-center"
              >
                立即開始觀看
              </Link>
            ) : (
              <BuyButton 
                courseId={course.id} 
                courseName={course.title} 
                amount={course.price} 
              />
            )}
            
            <p className="text-center text-gray-400 text-xs">
              {hasAccess ? '您已擁有此課程' : '購買後即可永久觀看，支援多種付款方式'}
            </p>
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4 text-sm">包含項目：</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-gray-400 mr-2" /> 終身觀看權限</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-gray-400 mr-2" /> 課程專屬講義</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-gray-400 mr-2" /> 行動裝置支援</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
