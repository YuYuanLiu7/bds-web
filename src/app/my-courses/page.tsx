import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, type SessionUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getMembershipStatus } from '@/lib/entitlements';
import SafeImage from '@/components/SafeImage';
import { PlayCircle, Crown, Receipt } from 'lucide-react';

export const revalidate = 0;

export const metadata = { title: '我的課程' };

interface CourseRow { id: string; title: string; thumbnail_url: string | null }
interface OrderRow {
  id: string; amount: number | null; status: string | null; created_at: string | null;
  course_id: string | null; download_id: string | null; membership_plan_id: string | null;
}

function itemLabel(o: OrderRow): string {
  if (o.course_id) return '單堂課程';
  if (o.membership_plan_id) return '會員方案';
  if (o.download_id) return '數位下載';
  return '項目';
}
const statusText: Record<string, string> = { paid: '已付款', pending: '處理中', failed: '未完成' };

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) redirect('/login?callbackUrl=/my-courses');
  const userId = user.id;

  // 1. 已購單堂課程
  const { data: ucRows } = await supabase.from('user_courses').select('course_id').eq('user_id', userId);
  const courseIds = (ucRows || []).map((r: { course_id: string }) => r.course_id);
  let courses: CourseRow[] = [];
  if (courseIds.length > 0) {
    const { data } = await supabase.from('courses').select('id, title, thumbnail_url').in('id', courseIds);
    courses = (data || []) as CourseRow[];
  }

  // 2. 會員狀態
  const membership = await getMembershipStatus(userId);
  let planTitle = '';
  if (membership.planId) {
    const { data: plan } = await supabase.from('membership_plans').select('title').eq('id', membership.planId).maybeSingle();
    planTitle = plan?.title || '會員方案';
  }

  // 訂閱會員可觀看「開放給會員」的課程 → 併入可看清單（去重）
  if (membership.active) {
    const { data: memData } = await supabase
      .from('courses')
      .select('id, title, thumbnail_url')
      .eq('membership_included', true)
      .eq('is_published', true);
    const owned = new Set(courses.map((c) => c.id));
    for (const m of (memData || []) as CourseRow[]) {
      if (!owned.has(m.id)) courses.push(m);
    }
  }

  // 3. 訂單紀錄（供退費對照）
  const { data: orderRows } = await supabase
    .from('orders')
    .select('id, amount, status, created_at, course_id, download_id, membership_plan_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  const orders = (orderRows || []) as OrderRow[];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">我的課程</h1>
        <p className="text-gray-500 mb-8">您購買與可觀看的課程、會員狀態與訂單紀錄。</p>

        {/* 會員狀態 */}
        {membership.active && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
            <Crown className="w-8 h-8 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-gray-900">會員生效中：{planTitle}</div>
              <div className="text-sm text-gray-600">
                {membership.expiresAt ? `到期日：${membership.expiresAt.slice(0, 10)}` : '永久有效'}　·　可觀看文章與「開放給會員」的課程
              </div>
            </div>
            <Link href="/courses" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold">瀏覽課程</Link>
          </div>
        )}

        {/* 已購課程 */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">已擁有的課程</h2>
        {courses.length === 0 && !membership.active ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
            您還沒有購買任何課程。
            <div className="mt-4"><Link href="/courses" className="text-blue-600 font-bold hover:underline">去逛課程 →</Link></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}/learn`} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition">
                <div className="relative aspect-video bg-gray-100">
                  <SafeImage
                    src={c.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600'}
                    alt={c.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-bold text-gray-900 line-clamp-2 mb-2">{c.title}</div>
                  <span className="text-sm text-blue-600 font-bold">前往上課 →</span>
                </div>
              </Link>
            ))}
            {courses.length === 0 && membership.active && (
              <div className="col-span-full text-gray-500 text-sm">目前尚無「開放給會員」的課程；您仍可觀看文章。<Link href="/courses" className="text-blue-600 font-bold hover:underline">前往課程目錄</Link>。</div>
            )}
          </div>
        )}

        {/* 訂單紀錄 */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Receipt className="w-5 h-5" /> 訂單紀錄</h2>
        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500 text-sm">尚無訂單紀錄。</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3">訂單編號</th>
                  <th className="px-4 py-3">日期</th>
                  <th className="px-4 py-3">品項</th>
                  <th className="px-4 py-3">金額</th>
                  <th className="px-4 py-3">狀態</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 break-all">{o.id}</td>
                    <td className="px-4 py-3 text-gray-600">{(o.created_at || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-gray-700">{itemLabel(o)}</td>
                    <td className="px-4 py-3 text-gray-900 font-bold">NT$ {(o.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{statusText[o.status || ''] || o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">※ 退費請保留「訂單編號」與購買日期，並依《隱私權政策》期限與客服聯絡。</p>
      </div>
    </div>
  );
}
