import { getCourseById } from "@/lib/courses";
import { canAccess } from "@/lib/entitlements";
import { getUserByEmail } from "@/lib/users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import Link from "next/link";
import { ChevronLeft, Play, Check } from "lucide-react";
import LearnExtraDetails from "@/components/LearnExtraDetails";
import ChapterCompleteButton from "@/components/ChapterCompleteButton";
import { isBunnyVideo, signBunnyEmbedUrl } from "@/lib/bunny";
import { signStorageUrl } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { sanitizeHtml } from "@/lib/sanitize";

export default async function ChapterPage({ params }: { params: Promise<{ id: string, chapterId: string }> }) {
  const { id, chapterId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=/courses/${id}/learn/${chapterId}`);
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    redirect("/login");
  }

  const hasAccess = await canAccess({ id: user.id, role: user.role }, { kind: 'course', id });
  if (!hasAccess) {
    redirect(`/courses/${id}`);
  }

  const course = await getCourseById(id);
  if (!course) {
    redirect("/courses");
  }

  const currentChapter = course.chapters.find(c => c.id === chapterId);
  if (!currentChapter) {
    redirect(`/courses/${id}/learn`);
  }

  // 🔒 影片防盜：此頁已通過登入＋課程存取權驗證，於伺服器端簽發「短效」網址，
  //    不把可永久存取的原始網址暴露給前端。
  //    - Bunny 影片：簽發短效（30 分鐘）Embed Token 網址；未設 Bunny env 時維持原值（degrade）。
  //    - Supabase 自架上傳（protected:// 或舊的公開網址）：以 signStorageUrl 簽短效網址。
  //    - 其他外部網址（YouTube/Vimeo）：signStorageUrl 原樣返回，交由播放器處理。
  let videoUrl = currentChapter.video_url || '';
  if (videoUrl) {
    if (isBunnyVideo(videoUrl)) {
      const signed = signBunnyEmbedUrl(videoUrl);
      if (signed) videoUrl = signed;
    } else {
      videoUrl = await signStorageUrl(videoUrl);
    }
  }

  // 教材附件（付費內容）：同樣簽短效網址後才交給前端顯示，不外流永久連結
  const chapterFileUrl = await signStorageUrl((currentChapter as { file_url?: string }).file_url || '');
  const courseFileUrl = await signStorageUrl((course as { file_url?: string }).file_url || '');

  // 課程公告：此頁已通過 canAccess，於伺服器端取該課程公告顯示給學員（後台發佈的公告）。
  const { data: announcementsData } = await supabase
    .from('course_announcements')
    .select('title, content, created_at')
    .eq('course_id', id)
    .order('created_at', { ascending: false });
  const announcements = (announcementsData || []) as { title: string; content: string; created_at: string }[];
  const chapterContentHtml = (currentChapter as { content_html?: string | null }).content_html || '';

  // 學習進度：查此 (user, course) 已完成章節集合。以「章節完成」為單位（不做秒數回報）。
  // 側邊清單據此顯示 ✓、主內容區帶入本章完成狀態，並計算整體進度百分比。
  const { data: progressData } = await supabase
    .from('course_progress')
    .select('chapter_id')
    .eq('user_id', user.id)
    .eq('course_id', id)
    .eq('completed', true);
  const completedSet = new Set(
    (progressData || []).map((r: { chapter_id: string }) => r.chapter_id)
  );
  const totalChapters = course.chapters.length;
  const completedCount = course.chapters.filter((c) => completedSet.has(c.id)).length;
  const progressPercent =
    totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-slate-950 via-[#0B0F19] to-indigo-950/40 text-white overflow-hidden relative font-sans">
      
      {/* Premium Ambient Background Glows (Dark Mode version) */}
      <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      {/* Sidebar - Course Content */}
      <div className="w-full lg:w-80 border-r border-slate-800/80 flex flex-col h-1/3 lg:h-full bg-slate-950/70 backdrop-blur-md relative z-10">
        <div className="p-4 border-b border-gray-800">
          <Link href={`/courses/${id}`} className="flex items-center text-gray-400 hover:text-white transition mb-4 text-sm">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回課程介紹
          </Link>
          <h2 className="font-bold text-lg line-clamp-2">{course.title}</h2>
          {/* 本課程整體進度（已完成章節數 / 總章節數） */}
          {totalChapters > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>本課程進度</span>
                <span>{completedCount}/{totalChapters}（{progressPercent}%）</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {course.chapters.map((chapter, index) => {
            const isDone = completedSet.has(chapter.id);
            return (
            <Link
              key={chapter.id}
              href={`/courses/${id}/learn/${chapter.id}`}
              className={`flex items-center p-4 hover:bg-gray-800 transition border-b border-gray-800/50 ${chapter.id === chapterId ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${isDone ? 'bg-emerald-500' : chapter.id === chapterId ? 'bg-blue-500' : 'bg-gray-700'}`}>
                {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Play className="w-3 h-3 fill-white" />}
              </div>
              <span className={`text-sm ${chapter.id === chapterId ? 'text-white font-medium' : 'text-gray-400'}`}>
                {index + 1}. {chapter.title}
              </span>
            </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content - Video Player */}
      <div className="flex-1 flex flex-col h-2/3 lg:h-full overflow-y-auto">
        <div className="p-0 lg:p-8 max-w-5xl mx-auto w-full pb-20">
          <div className="bg-black lg:rounded-2xl overflow-hidden shadow-2xl">
            {videoUrl ? (
              <VideoPlayer url={videoUrl} />
            ) : (
              <div className="aspect-video bg-gray-800 flex items-center justify-center italic text-gray-500">
                本章節尚未上傳影片
              </div>
            )}
          </div>
          
          <div className="p-6 lg:px-0">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold">{currentChapter.title}</h1>
              {/* 章節「標示完成 / 已完成」切換（樂觀更新） */}
              <ChapterCompleteButton
                courseId={course.id}
                chapterId={currentChapter.id}
                initialCompleted={completedSet.has(currentChapter.id)}
              />
            </div>
            <div className="h-px bg-gray-800 w-full mb-6"></div>
            {(currentChapter as { description?: string | null }).description ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {(currentChapter as { description?: string | null }).description}
                </p>
              </div>
            ) : null}

            {/* 章節圖文 / 簡報連結（後台 content_html，淨化後顯示） */}
            {chapterContentHtml && (
              <div
                className="prose prose-invert max-w-none mt-4 text-sm text-gray-300 leading-relaxed prose-a:text-blue-400"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(chapterContentHtml) }}
              />
            )}

            {/* 課程公告（後台發佈，學員可見） */}
            {announcements.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">📢 課程公告</h2>
                <div className="space-y-3">
                  {announcements.map((a, i) => (
                    <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <div className="font-bold text-white text-sm">{a.title}</div>
                        <div className="text-[11px] text-slate-500 flex-shrink-0">{(a.created_at || '').slice(0, 10)}</div>
                      </div>
                      <div
                        className="text-sm text-gray-400 leading-relaxed prose prose-invert max-w-none prose-a:text-blue-400"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.content || '') }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extra details (Attachments & Comment section) */}
            <LearnExtraDetails 
              courseId={course.id}
              courseTitle={course.title}
              chapterId={currentChapter.id}
              chapterTitle={currentChapter.title}
              studentName={user.name || user.email}
              allowComments={course.allow_comments !== false}
              chapterFileUrl={chapterFileUrl}
              courseFileUrl={courseFileUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
