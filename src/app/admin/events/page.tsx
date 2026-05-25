'use client';

import { useState } from 'react';
import { Calendar, Search, Plus, MapPin, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([
    { id: '1', title: 'BDS 半導體業務核心思維實戰營', date: '2026-06-15 14:00', location: '線上直播 (Zoom)', attendees: 48, status: 'upcoming', type: '付費活動' },
    { id: '2', title: '醫材商務開發與法規布局沙龍', date: '2026-05-18 19:30', location: '台北市大安區信義路四段', attendees: 32, status: 'completed', type: '付費活動' },
    { id: '3', title: 'BDS 爐邊對話：硬體 ODM 的全球銷售戰略', date: '2026-04-10 20:00', location: '線上直播 (Zoom)', attendees: 75, status: 'completed', type: '免費活動' }
  ]);

  const formatTaiwanDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    const hr = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yr}年${mo}月${dy}日 ${hr}:${min}`;
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <span className="material-symbols-outlined mr-2 text-indigo-600" style={{ fontSize: '26px' }}>event</span>
            活動
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">管理您的實體線下沙龍、線上研討會與直播講座。</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98">
          <Plus className="w-4 h-4 mr-1.5" /> 建立活動
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold">
            共 <span className="text-slate-700 font-extrabold">{events.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{events.length}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 h-12">
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/2">活動資訊</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">活動時間</th>
                  <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">地點 / 人數</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {event.status === 'upcoming' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px]">
                            報名中
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold text-[10px]">
                            已結束
                          </span>
                        )}
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-400 font-bold text-[9px]">
                          {event.type}
                        </span>
                      </div>
                      <Link href={`/admin/events/${event.id}`} className="block font-bold text-blue-600 hover:text-blue-800 transition text-sm mt-1.5">
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold text-xs">
                      {formatTaiwanDate(event.date)}
                    </td>
                    <td className="px-6 py-4 space-y-1 text-slate-400 font-medium text-xs">
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        已報名人數: <span className="text-slate-600 font-bold ml-1">{event.attendees}人</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1 lg:order-first">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2.5 border-b border-slate-50">活動篩選</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">活動名稱</label>
                <input 
                  type="text" 
                  placeholder="搜尋活動名稱"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer">
                <Search className="w-3.5 h-3.5 mr-1" /> 搜尋活動
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
