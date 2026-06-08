'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  MessageSquare, 
  Send, 
  User, 
  CornerDownRight, 
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface LearnExtraDetailsProps {
  courseId: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
  studentName: string;
  allowComments: boolean;
  chapterFileUrl?: string;
  courseFileUrl?: string;
}

interface Comment {
  id: string;
  student: string;
  course: string;
  chapter: string;
  text: string;
  date: string;
  status: 'pending' | 'approved';
  reply: string | null;
  replyDate: string | null;
}

export default function LearnExtraDetails({
  courseId,
  courseTitle,
  chapterId,
  chapterTitle,
  studentName,
  allowComments,
  chapterFileUrl,
  courseFileUrl
}: LearnExtraDetailsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Load comments from localStorage
  const loadComments = () => {
    try {
      const stored = localStorage.getItem('bds_course_comments');
      if (stored) {
        setComments(JSON.parse(stored));
      } else {
        // Initialize default mock data if not set
        const defaultMock: Comment[] = [
          { 
            id: 'mock-1', 
            student: '陳玟妤', 
            course: 'BDS爐邊對談 Vol.3｜商務開發心法', 
            chapter: '第一章：初探商務開發開發的核心指標', 
            text: '請問講師，對於在ODM硬體廠做業務的新手，會建議怎麼切入這個指標的練習？謝謝！', 
            date: '2026-05-25 09:15', 
            status: 'pending',
            reply: null,
            replyDate: null
          },
          { 
            id: 'mock-2', 
            student: '楊力樺', 
            course: 'BDS爐邊對談 Vol.2｜一站式破解業務求職難題', 
            chapter: '第二章：外商業務履歷的黃金撰寫公式', 
            text: '這章寫的黃金公式真的很受用！我試著修改了履歷，投遞後真的接到兩家外商的面試通知！', 
            date: '2026-05-24 15:30', 
            status: 'approved',
            reply: '太棒了！恭喜力樺，外商面試的核心在於對過去專案成果的「量化數據」呈現，祝你面試順利！',
            replyDate: '2026-05-24 18:00'
          },
          { 
            id: 'mock-3', 
            student: '林恩', 
            course: 'BDS爐邊對談 Vol.1｜業務表達及提案關鍵', 
            chapter: '第三章：高階提案的開場破冰思維', 
            text: '請問如果是在實體客戶拜訪時，有什麼比較好用的拜訪開頭話術推薦嗎？', 
            date: '2026-05-23 20:45', 
            status: 'approved',
            reply: null,
            replyDate: null
          }
        ];
        localStorage.setItem('bds_course_comments', JSON.stringify(defaultMock));
        setComments(defaultMock);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadComments();
    
    // Listen for storage changes (e.g. from admin panel approving/replying)
    const handleStorageChange = () => {
      loadComments();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter comments for current chapter
  // Show approved comments, and pending comments created by the current student
  const filteredComments = comments.filter(c => 
    c.course === courseTitle && 
    c.chapter === chapterTitle && 
    (c.status === 'approved' || (c.student === studentName && c.status === 'pending'))
  );

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newCommentObj: Comment = {
      id: `comment-${Date.now()}`,
      student: studentName,
      course: courseTitle,
      chapter: chapterTitle,
      text: newComment,
      date: formattedDate,
      status: 'pending', // Pending admin approval
      reply: null,
      replyDate: null
    };

    const updated = [newCommentObj, ...comments];
    localStorage.setItem('bds_course_comments', JSON.stringify(updated));
    setComments(updated);
    setNewComment('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  return (
    <div className="space-y-8 mt-6">
      
      {/* 1. Downloader / Attachments Section */}
      {(chapterFileUrl || courseFileUrl) && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-400" /> 教材檔案下載
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chapter File */}
            {chapterFileUrl && (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm backdrop-blur-xs">
                <div className="flex items-center space-x-3 overflow-hidden mr-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-white truncate">本單元教材講義</div>
                    <div className="text-[10px] text-slate-400 truncate">專屬本影片單元的學習資源</div>
                  </div>
                </div>
                <a 
                  href={chapterFileUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center flex-shrink-0 cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> 下載
                </a>
              </div>
            )}

            {/* Course File */}
            {courseFileUrl && (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm backdrop-blur-xs">
                <div className="flex items-center space-x-3 overflow-hidden mr-2">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-white truncate">本課程總體教材</div>
                    <div className="text-[10px] text-slate-400 truncate">包含課程所有章節的整合學習資源</div>
                  </div>
                </div>
                <a 
                  href={courseFileUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center flex-shrink-0 cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> 下載
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Comments Discussion Section */}
      <div className="space-y-4 border-t border-slate-800/80 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-400" /> 問題與討論
          </h3>
          <span className="text-[11px] text-slate-500 font-bold bg-slate-900 px-2.5 py-1 rounded-md">
            {filteredComments.length} 則留言
          </span>
        </div>

        {allowComments ? (
          <div className="space-y-6">
            {/* New Comment Input */}
            <form onSubmit={handleSubmitComment} className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                  {studentName?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-bold text-slate-300">{studentName}</span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="提問或分享心得...（留言將在管理員審核後公開）"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Notification Toast */}
            {showSuccessToast && (
              <div className="bg-blue-950/40 border border-blue-900 text-blue-400 p-3 rounded-lg text-xs font-semibold flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                您的留言已送出，目前正處於「待審核」狀態。管理員核准後將會公開顯示。
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <div key={comment.id} className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3">
                  {/* Student Header */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                        {comment.student?.charAt(0) || 'U'}
                      </div>
                      <span className="font-bold text-slate-200">{comment.student}</span>
                      {comment.status === 'pending' && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md font-bold">
                          待審核
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center font-medium">
                      <Clock className="w-3 h-3 mr-1" /> {comment.date}
                    </span>
                  </div>

                  {/* Comment Text */}
                  <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                    {comment.text}
                  </p>

                  {/* Admin Reply */}
                  {comment.reply && (
                    <div className="pl-6 border-l-2 border-indigo-500/30 mt-2 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-bold text-indigo-400 flex items-center bg-indigo-500/10 px-1.5 py-0.5 rounded-md text-[9px]">
                            <ShieldCheck className="w-3 h-3 mr-1" /> 管理員回覆
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {comment.replyDate}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-300/90 pl-5 leading-relaxed bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-950/50">
                        {comment.reply}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {filteredComments.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  本單元目前尚無留言討論。歡迎發送您的第一個提問！
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-950/60 border border-slate-900 rounded-xl text-center text-slate-500 text-xs italic">
            本課程已關閉留言討論功能。
          </div>
        )}
      </div>

    </div>
  );
}
