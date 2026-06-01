'use client';

import { useState } from 'react';
import { MessageSquare, Search, Trash2, Check, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([
    { id: '1', student: '陳玟妤', course: 'BDS爐邊對談 Vol.3｜商務開發心法', chapter: '第一章：初探商務開發開發的核心指標', text: '請問講師，對於在ODM硬體廠做業務的新手，會建議怎麼切入這個指標的練習？謝謝！', date: '2026-05-25 09:15', status: 'pending' },
    { id: '2', student: '楊力樺', course: 'BDS爐邊對談 Vol.2｜一站式破解業務求職難題', chapter: '第二章：外商業務履歷的黃金撰寫公式', text: '這章寫的黃金公式真的很受用！我試著修改了履歷，投遞後真的接到兩家外商的面試通知！', date: '2026-05-24 15:30', status: 'approved' },
    { id: '3', student: '林恩', course: 'BDS爐邊對談 Vol.1｜業務表達及提案關鍵', chapter: '第三章：高階提案的開場破冰思維', text: '請問如果是在實體客戶拜訪時，有什麼比較好用的拜訪開頭話術推薦嗎？', date: '2026-05-23 20:45', status: 'approved' }
  ]);

  const handleApprove = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, status: 'approved' } : c));
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此留言嗎？')) {
      setComments(comments.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <MessageSquare className="w-6.5 h-6.5 mr-2 text-indigo-600" />
            留言
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">審核與管理學員在各課程章節底下的提問、學習筆記與課程互動討論。</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="text-xs text-slate-400 font-bold">
          共 <span className="text-slate-700 font-extrabold">{comments.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{comments.length}</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 h-12">
                <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">學員 / 來源章節</th>
                <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">留言內容</th>
                <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm">{comment.student}</div>
                    <div className="text-slate-400 text-[10px] font-semibold flex items-center mt-1 max-w-xs truncate">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {comment.course}
                    </div>
                    <div className="text-slate-400 text-[10px] font-medium truncate max-w-xs mt-0.5">
                      {comment.chapter}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 text-xs leading-relaxed font-semibold">{comment.text}</p>
                    <div className="flex items-center text-[10px] text-slate-400 font-semibold mt-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {comment.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {comment.status === 'pending' && (
                      <button 
                        onClick={() => handleApprove(comment.id)}
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition active:scale-95 cursor-pointer inline-flex items-center"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> 審核通過
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition inline-flex items-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
