'use client';

import { useState, useEffect } from 'react';
import { Star, CheckCircle, User, Clock } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Review {
  id: string;
  courseId: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
}

interface CourseReviewsProps {
  courseId: string;
  courseTitle: string;
  studentName: string;
  hasAccess: boolean;
}

export default function CourseReviews({ courseId, courseTitle, studentName, hasAccess }: CourseReviewsProps) {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // 從伺服器載入本課程的評價（持久化於資料庫，跨裝置/使用者皆可見）
  useEffect(() => {
    fetch(`/api/reviews?courseId=${encodeURIComponent(courseId)}`)
      .then(res => (res.ok ? res.json() : []))
      .then(list => setReviews(Array.isArray(list) ? list : []))
      .catch(err => console.warn('Failed to load reviews:', err));
  }, [courseId]);

  const courseReviews = reviews;

  const averageRating = courseReviews.length > 0
    ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length).toFixed(1)
    : '5.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, rating: userRating, comment: userComment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '評價發佈失敗，請稍後再試。');
        return;
      }
      setReviews([data, ...reviews]);
      setUserComment('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Submit review error:', err);
      toast.error('連線錯誤，評價發佈失敗。');
    }
  };

  return (
    <section className="bg-white/90 backdrop-blur-md p-8 rounded-2xl border border-slate-200/60 shadow-xs space-y-8 mt-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Star className="w-6 h-6 mr-2 text-yellow-500 fill-yellow-500" />
            學員評價與回饋
          </h2>
          <p className="text-sm text-gray-500 mt-1">聽聽其他學員的真實心聲，優質回饋助您做出最適合的選擇。</p>
        </div>
        <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-100 self-start md:self-auto">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-gray-900">{averageRating}</div>
            <div className="text-[10px] text-gray-400 font-bold mt-0.5">平均得分</div>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div>
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(Number(averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-1">來自 {courseReviews.length} 位學員</div>
          </div>
        </div>
      </div>

      {/* Review Submission Form - Only visible if hasAccess is true */}
      {hasAccess ? (
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-800">撰寫您的評價</h3>
          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-semibold flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
              感謝您的評價！您的回饋已成功發佈。
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-semibold">給予評分：</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      className="text-yellow-400 hover:scale-110 transition duration-150 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoveredStar ?? userRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-yellow-600 ml-2">
                  {userRating} 星 ({userRating === 5 ? '極佳' : userRating === 4 ? '很好' : userRating === 3 ? '普通' : userRating === 2 ? '較差' : '極差'})
                </span>
              </div>

              <div className="space-y-1">
                <textarea
                  rows={3}
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="分享您對這門課程的學習心得、收穫或是給講師的建議與鼓勵..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-semibold outline-none focus:border-indigo-500 transition shadow-xs"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center shadow-xs cursor-pointer active:scale-95"
                >
                  發佈評價
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 text-center text-gray-500 text-xs italic">
          只有已購買或取得看課權限的學員才能撰寫評價。
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {courseReviews.map((review) => (
          <div key={review.id} className="p-5 bg-white border border-slate-100 rounded-xl shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold font-sans">
                  {review.studentName?.charAt(0) || <User className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800">{review.studentName}</div>
                  <div className="flex text-yellow-400 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 flex items-center font-medium">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {review.date}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-semibold pl-11">
              {review.comment}
            </p>
          </div>
        ))}

        {courseReviews.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-xs italic bg-white rounded-xl border border-slate-100">
            目前本課程尚無學員評價，歡迎成為第一個留下五星好評的學員！
          </div>
        )}
      </div>
    </section>
  );
}
