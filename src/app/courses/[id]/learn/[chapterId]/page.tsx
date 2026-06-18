import { getCourseById, checkCourseAccess } from "@/lib/courses";
import { getUserByEmail } from "@/lib/users";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import Link from "next/link";
import { ChevronLeft, Play } from "lucide-react";
import LearnExtraDetails from "@/components/LearnExtraDetails";
import { isBunnyVideo, signBunnyEmbedUrl } from "@/lib/bunny";

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

  const hasAccess = await checkCourseAccess(user.id, id);
  if (!hasAccess && user.role !== 'admin') {
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

  // 🔒 影片防盜：此頁已通過登入＋課程存取權驗證，於伺服器端為 Bunny 影片簽發
  //    短效（6 小時）Token 嵌入網址，不把可永久存取的原始網址暴露給前端。
  //    未設定 Bunny env 時維持原值（degrade，仍可播放未啟用 token 的影片）。
  let videoUrl = currentChapter.video_url || '';
  if (videoUrl && isBunnyVideo(videoUrl)) {
    const signed = signBunnyEmbedUrl(videoUrl);
    if (signed) videoUrl = signed;
  }

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
        </div>
        <div className="flex-1 overflow-y-auto">
          {course.chapters.map((chapter, index) => (
            <Link 
              key={chapter.id}
              href={`/courses/${id}/learn/${chapter.id}`}
              className={`flex items-center p-4 hover:bg-gray-800 transition border-b border-gray-800/50 ${chapter.id === chapterId ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${chapter.id === chapterId ? 'bg-blue-500' : 'bg-gray-700'}`}>
                <Play className="w-3 h-3 fill-white" />
              </div>
              <span className={`text-sm ${chapter.id === chapterId ? 'text-white font-medium' : 'text-gray-400'}`}>
                {index + 1}. {chapter.title}
              </span>
            </Link>
          ))}
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
            <h1 className="text-2xl font-bold mb-4">{currentChapter.title}</h1>
            <div className="h-px bg-gray-800 w-full mb-6"></div>
            {(currentChapter as { description?: string | null }).description ? (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {(currentChapter as { description?: string | null }).description}
                </p>
              </div>
            ) : null}

            {/* Extra details (Attachments & Comment section) */}
            <LearnExtraDetails 
              courseId={course.id}
              courseTitle={course.title}
              chapterId={currentChapter.id}
              chapterTitle={currentChapter.title}
              studentName={user.name || user.email}
              allowComments={course.allow_comments !== false}
              chapterFileUrl={(currentChapter as { file_url?: string }).file_url || ''}
              courseFileUrl={(course as { file_url?: string }).file_url || ''}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
