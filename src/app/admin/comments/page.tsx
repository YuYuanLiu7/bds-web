'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Search, Trash2, Check, BookOpen, Clock, Filter, CornerDownRight, User } from 'lucide-react';
import Link from 'next/link';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);

  // Helper to save comments to localStorage and dispatch update event
  const saveComments = (updated: any[]) => {
    setComments(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bds_course_comments', JSON.stringify(updated));
      // Dispatch storage event to update other components in the same window
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Load comments on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bds_course_comments');
      if (stored) {
        setComments(JSON.parse(stored));
      } else {
        const defaultMock = [
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
    }
  }, []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [courseFilter, setCourseFilter] = useState('all');

  // Inline Reply state
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<{[key: string]: string}>({});

  const handleApprove = (id: string) => {
    saveComments(comments.map(c => c.id === id ? { ...c, status: 'approved' } : c));
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此留言嗎？')) {
      saveComments(comments.filter(c => c.id !== id));
    }
  };

  const handleSendReply = (id: string) => {
    const text = replyTextMap[id];
    if (!text || !text.trim()) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    saveComments(comments.map(c => 
      c.id === id 
        ? { ...c, reply: text, replyDate: formattedDate, status: 'approved' } 
        : c
    ));
    setReplyTextMap({ ...replyTextMap, [id]: '' });
    setActiveReplyId(null);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCourseFilter('all');
  };

  const uniqueCourses = Array.from(new Set(comments.map(c => c.course).filter(Boolean)));

  const filteredComments = comments.filter(c => {
    const student = c.student || '';
    const text = c.text || '';
    const matchesSearch = student.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          text.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesCourse = courseFilter === 'all' || c.course === courseFilter;
    
    return matchesSearch && matchesStatus && matchesCourse;
  });

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <MessageSquare className="w-7 h-7 mr-2 text-indigo-600" />
            留言管理
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">審核與回覆學員在各課程章節底下的提問、學習筆記與互動討論。</p>
        </div>
      </div>

      {/* Main Grid: Comments on Left, Filters on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Column: Comments List (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold select-none">
            <span>
              篩選出 <span className="text-slate-700 font-extrabold">{filteredComments.length}</span> 則留言
            </span>
            {(searchQuery || statusFilter !== 'all' || courseFilter !== 'all') && (
              <button 
                onClick={handleResetFilters}
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
              >
                重設篩選條件
              </button>
            )}
          </div>

          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div 
                key={comment.id} 
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4"
              >
                {/* Header Row: Student name, Date, Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase flex-shrink-0">
                      {comment.student?.charAt(0) || <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-sm">{comment.student}</div>
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center mt-0.5">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {comment.date}
                      </div>
                    </div>
                  </div>

                  <span className={`inline-flex px-2 py-0.5 rounded border font-black text-[9px] ${
                    comment.status === 'approved' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : 'bg-amber-50 border-amber-100 text-amber-600'
                  }`}>
                    {comment.status === 'approved' ? '已核准' : '待審核'}
                  </span>
                </div>

                {/* Comment Text */}
                <div className="pl-0 sm:pl-12">
                  <p className="text-slate-700 text-xs font-semibold leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    {comment.text}
                  </p>

                  {/* Reply Block */}
                  {comment.reply && (
                    <div className="mt-3 bg-indigo-50/30 border border-indigo-50 p-4 rounded-xl relative select-none">
                      <div className="flex items-center text-[10px] font-bold text-indigo-600 mb-1">
                        <CornerDownRight className="w-3.5 h-3.5 mr-1" />
                        BDS 團隊 (管理員) 回覆：
                        <span className="text-slate-400 font-semibold ml-auto">{comment.replyDate}</span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed font-semibold pl-4">
                        {comment.reply}
                      </p>
                    </div>
                  )}

                  {/* Inline Reply Form */}
                  {activeReplyId === comment.id && (
                    <div className="mt-3 bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100 animate-in slide-in-from-top-2 duration-150">
                      <textarea 
                        placeholder="請輸入回覆學員的內容..."
                        value={replyTextMap[comment.id] || ''}
                        onChange={e => setReplyTextMap({...replyTextMap, [comment.id]: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-600 transition"
                        rows={2}
                      />
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setActiveReplyId(null)}
                          className="px-3 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold transition"
                        >
                          取消
                        </button>
                        <button 
                          onClick={() => handleSendReply(comment.id)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center shadow-xs cursor-pointer active:scale-95"
                        >
                          傳送回覆
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer metadata & Action triggers */}
                  <div className="mt-4 flex flex-col sm:flex-row justify-between sm:items-center border-t border-slate-50 pt-3 gap-2 text-[10px] font-bold text-slate-400">
                    <div className="flex items-center min-w-0 max-w-md truncate">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5 text-slate-300 flex-shrink-0" />
                      <span className="text-slate-500 mr-1.5">{comment.course}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-400 ml-1.5 truncate">{comment.chapter}</span>
                    </div>

                    <div className="flex items-center space-x-2 justify-end flex-shrink-0">
                      {comment.status === 'pending' && (
                        <button 
                          onClick={() => handleApprove(comment.id)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition inline-flex items-center cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> 審核通過
                        </button>
                      )}
                      
                      {!comment.reply && activeReplyId !== comment.id && (
                        <button 
                          onClick={() => setActiveReplyId(comment.id)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition inline-flex items-center cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" /> 回覆留言
                        </button>
                      )}

                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 rounded-lg transition inline-flex items-center py-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}

            {filteredComments.length === 0 && (
              <div className="py-24 text-center text-slate-400 italic text-sm bg-white rounded-2xl border border-slate-100 shadow-sm">
                目前沒有任何符合篩選條件的留言。
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Filter Sidebar (lg:col-span-1) */}
        <div className="lg:col-span-1 space-y-4 select-none">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <h3 className="font-extrabold text-slate-800 text-xs pb-3 border-b border-slate-50 uppercase tracking-wider flex items-center">
              <Filter className="w-4 h-4 mr-1.5 text-indigo-600" />
              留言篩選
            </h3>

            <div className="space-y-4">
              
              {/* Search input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">關鍵字搜尋</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="搜尋學員姓名、留言內容"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">審核狀態</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition bg-white"
                >
                  <option value="all">全部狀態</option>
                  <option value="pending">🟡 待審核</option>
                  <option value="approved">🟢 已核准</option>
                </select>
              </div>

              {/* Course Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">所屬課程</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition bg-white"
                >
                  <option value="all">所有課程</option>
                  {uniqueCourses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
