'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Calendar, Eye, ArrowLeft, User, Tag, Clock, Share2,
  Lock, ShieldAlert, LogIn, ShoppingBag
} from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { sanitizeHtml } from '@/lib/sanitize';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

// 文章內容（前端使用到的欄位）
interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  views: number;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  visibility?: string;
  required_course_ids?: string;
  is_pinned?: boolean;
  locked?: boolean;
  lockType?: string;
}

// 課程精簡資訊（用於付費鎖卡片顯示）
interface CourseSummary {
  id: string;
  title: string;
}

export default function ArticleDetailPage({ params }: ArticlePageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // 主色改由 Context（root layout 伺服器端取一次）提供，不再每頁各自 fetch site-settings
  const primaryColor = useSettings().visual.primaryColor || '#21448e';
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // Advanced course visibility settings
  // 僅需呼叫 setter 以保留 fetch 副作用；目前頁面不直接讀取此清單值
  const [, setPurchasedCourseIds] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<CourseSummary[]>([]);

  useEffect(() => {
    // Fetch specific article by ID or custom Slug
    fetch(`/api/articles?id=${id}`)
      .then(async res => {
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (data && data.title) {
          setArticle({
            id: data.id,
            title: data.title,
            author: data.author || 'BDS 編輯部',
            date: data.date ? data.date.split('T')[0] : '',
            views: data.views || 0,
            category: data.category || '',
            summary: data.summary || '',
            content: data.content || '',
            imageUrl: data.image_url || data.imageUrl || 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=800',
            visibility: data.visibility || 'public',
            required_course_ids: data.required_course_ids || '',
            is_pinned: !!data.is_pinned,
            locked: !!data.locked,
            lockType: data.lockType || 'public'
          });
        } else {
          throw new Error('Invalid article payload');
        }
      })
      .catch(err => {
        // API 失敗或查無此文章時，不以假資料填充，維持空狀態顯示「文章不存在或已下架」
        console.error("無法載入文章內容：", id, err);
        setArticle(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // 3. Fetch current logged-in user course permissions
    fetch('/api/user/courses')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in or guest');
      })
      .then(ids => {
        if (Array.isArray(ids)) {
          setPurchasedCourseIds(ids);
        }
      })
      .catch(() => setPurchasedCourseIds([]));

    // 4. Fetch all public courses to translate ID -> Title on guide card
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllCourses(data);
        }
      })
      .catch(err => console.warn('無法載入公共課程清單：', err));
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.summary,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('文章連結已成功複製至剪貼簿！可直接分享給好友。');
    }
  };

  // Custom premium Lightweight Markdown Content Parser
  const parseInlineMarkdown = (text: string) => {
    if (!text) return '';
    
    // Regex matches **bold** or <span style="color:#xxxxxx">content</span>
    const regex = /(\*\*[^*]+\*\*|<span style="color:\s*#[a-fA-F0-9]{3,6}">[^<]+<\/span>)/g;
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-slate-950 font-black">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('<span style="color:') && part.endsWith('</span>')) {
        const colorMatch = part.match(/color:\s*(#[a-fA-F0-9]{3,6})/);
        const textMatch = part.match(/>([^<]+)</);
        const color = colorMatch ? colorMatch[1] : 'inherit';
        const content = textMatch ? textMatch[1] : '';
        return (
          <span key={i} style={{ color }} className="font-black">
            {content}
          </span>
        );
      }
      return part;
    });
  };

  const renderContent = (markdownText: string) => {
    if (!markdownText) return null;
    // 內容可能以字面 "\n"（反斜線+n，常見於 SQL 單引號字串種子資料）儲存，
    // 先正規化為真正的換行，避免整篇擠成一行而露出 ###、**、--- 等 Markdown 符號
    const normalized = markdownText.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    return normalized.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return (
          <h3 key={idx} className="text-lg font-black text-slate-800 mt-8 mb-4 border-b border-slate-50 pb-2.5 flex items-center select-none text-left">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h2 key={idx} className="text-xl font-black text-slate-800 mt-10 mb-5 border-b border-slate-100 pb-3 flex items-center select-none text-left">
            <span className="w-2 h-5 bg-indigo-600 rounded-full mr-2.5" style={{ backgroundColor: primaryColor }}></span>
            {trimmed.replace(/^##\s*/, '')}
          </h2>
        );
      }
      if (trimmed.startsWith('---')) {
        return <hr key={idx} className="my-8 border-slate-100 select-none" />;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return (
          <div key={idx} className="flex items-start my-2.5 pl-4 text-xs md:text-sm font-semibold text-slate-600 leading-relaxed text-left">
            <span className="text-indigo-600 font-extrabold mr-2 select-none" style={{ color: primaryColor }}>•</span>
            <p className="flex-1">{parseInlineMarkdown(trimmed.replace(/^[-*]\s*/, ''))}</p>
          </div>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-3 select-none" />;
      }
      return (
        <p key={idx} className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed mb-5 text-left">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  const isHTML = (str: string) => {
    if (!str) return false;
    return /<[a-z][\s\S]*>/i.test(str);
  };

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20 font-sans text-slate-700">
      
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-slate-100 select-none">
        <div className="max-w-[800px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link 
            href="/articles"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> 返回專欄列表
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 cursor-pointer transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[800px] mx-auto px-6 py-10 space-y-8">
        
        {loading ? (
          <div className="py-32 text-center text-slate-400 font-semibold text-xs select-none">
            專欄文章內容加載中...
          </div>
        ) : article ? (
          <article className="space-y-8 bg-white rounded-3xl border border-slate-100/70 p-6 md:p-10 shadow-xs">
            
            {/* Category tag & Title */}
            <div className="space-y-4 text-left">
              <span 
                style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black select-none"
              >
                <Tag className="w-3.5 h-3.5 mr-1" />
                {article.category}
              </span>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 leading-snug tracking-tight">
                {article.title}
              </h1>

              {/* Meta information row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-400 font-bold border-t border-b border-slate-50 py-3.5 select-none">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>由 {article.author} 發布</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>累積觀看: {article.views} 次</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>閱讀時間約 {Math.max(1, Math.ceil((article.content?.length ?? 0) / 400))} 分鐘</span>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            {article.imageUrl && (
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs select-none">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (!t.src.endsWith('/images/course-placeholder.svg')) t.src = '/images/course-placeholder.svg';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Summary Box */}
            {article.summary && (
              <div className="p-5 bg-slate-50 rounded-2xl border-l-4 border-indigo-600 text-left text-xs md:text-sm font-semibold text-slate-500 leading-relaxed" style={{ borderLeftColor: primaryColor }}>
                {article.summary}
              </div>
            )}

            {/* Content Body */}
            <div className="prose prose-slate max-w-none pt-4">
              {(() => {
                // 1. 權限檢驗：以後端回傳的 locked / lockType 為準（後端已驗證），
                //    前端不再自行判斷，避免雙重邏輯不一致或被繞過
                const hasAccess = !article.locked;
                const isMemberOnly = article.lockType === 'members';
                const isCoursePurchaserOnly = article.lockType === 'course_purchasers';

                if (hasAccess) {
                  // 渲染文章內容
                  return isHTML(article.content) ? (
                    <div
                      className="text-left text-xs md:text-sm text-slate-600 font-semibold leading-relaxed space-y-4 prose-headings:font-black prose-h2:text-xl prose-h3:text-lg prose-strong:text-slate-900 prose-strong:font-black"
                      // 以 DOMPurify 消毒後才注入，過濾 <script>、on* 事件屬性、javascript: 等 XSS 向量
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
                    />
                  ) : (
                    renderContent(article.content)
                  );
                }

                // 2. 當無權限時，判斷渲染哪種付費鎖
                if (isMemberOnly) {
                  return (
                    <div className="relative pt-6 select-none">
                      <div className="space-y-3 opacity-25 pointer-events-none filter blur-xs">
                        <p className="h-4 bg-slate-200 rounded w-full"></p>
                        <p className="h-4 bg-slate-200 rounded w-5/6"></p>
                        <p className="h-4 bg-slate-200 rounded w-4/6"></p>
                        <p className="h-4 bg-slate-200 rounded w-full"></p>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in duration-200">
                          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-slate-800">付費會員專屬專欄</h3>
                            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                              {session
                                ? '本篇深度產業觀察報告僅限 BDS 付費會員閱讀。訂閱任一會員方案，即可立即解鎖全站會員專屬文章！'
                                : '本篇深度產業觀察報告僅限 BDS 付費會員閱讀。請先登入，並訂閱會員方案以解鎖完整內容。'}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(session ? '/membership' : `/login?callbackUrl=/articles/${id}`)}
                            style={{ backgroundColor: primaryColor }}
                            className="w-full text-white font-bold text-xs py-2.5 rounded-xl transition hover:opacity-90 active:scale-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            {session ? <ShoppingBag className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                            <span>{session ? '前往訂閱會員方案' : '登入以解鎖'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isCoursePurchaserOnly) {
                  const requiredIds = article.required_course_ids ? article.required_course_ids.split(',').filter(Boolean) : [];
                  const lockedCourses = allCourses.filter(c => requiredIds.includes(c.id));

                  return (
                    <div className="relative pt-6 select-none">
                      <div className="space-y-3 opacity-25 pointer-events-none filter blur-xs animate-pulse">
                        <p className="h-4 bg-slate-200 rounded w-full"></p>
                        <p className="h-4 bg-slate-200 rounded w-5/6"></p>
                        <p className="h-4 bg-slate-200 rounded w-4/6"></p>
                        <p className="h-4 bg-slate-200 rounded w-full"></p>
                      </div>
                      
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in duration-200">
                          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div className="space-y-2.5">
                            <h3 className="text-base font-black text-slate-800">付費訂閱學員專屬內容</h3>
                            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                              本篇為 BDS 付費學員限定解鎖之高階產業洞察報告。購買下方任一指定精選課程，即可即刻開通完整閱讀權限！
                            </p>
                          </div>
                          
                          <div className="space-y-3 max-h-[220px] overflow-y-auto">
                            {lockedCourses.length > 0 ? (
                              lockedCourses.map(course => (
                                <div key={course.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-slate-700 truncate">{course.title}</h4>
                                    <p className="text-[9px] text-indigo-600 font-black mt-1">解鎖本專欄文章 + 終身課程複習</p>
                                  </div>
                                  <button 
                                    onClick={() => router.push(`/courses/${course.id}`)}
                                    className="flex-shrink-0 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>去解鎖</span>
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-black text-slate-700 truncate">限定指定付費課程學員解鎖</h4>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">請至課程專區挑選課程以開通權限</p>
                                </div>
                                <button 
                                  onClick={() => router.push(`/courses`)}
                                  className="flex-shrink-0 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>瀏覽課程</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>

          </article>
        ) : (
          <div className="py-20 text-center bg-white border border-slate-100 rounded-3xl p-16 select-none shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">找不到該文章</h3>
            <p className="text-slate-400 text-xs font-semibold">此文章可能已被刪除或下架，請回到文章列表改選其他主題。</p>
            <button
              onClick={() => router.push('/articles')}
              style={{ backgroundColor: primaryColor }}
              className="text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer"
            >
              返回文章專欄
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
