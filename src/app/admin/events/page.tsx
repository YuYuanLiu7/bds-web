'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  MapPin, 
  Users, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  ArrowLeft,
  Filter,
  Layers,
  Compass,
  AlertCircle
} from 'lucide-react';
import EventModal from '@/components/admin/EventModal';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'upcoming', 'completed'
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setEvents(data);
      } else {
        setError(data.error || '無法取得活動資料');
        setEvents([]);
      }
    } catch (err) {
      console.error(err);
      setError('連線至資料庫發生錯誤，請確認 events 資料表是否已建立。');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAdd = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`確定要刪除活動「${title}」嗎？此動作無法復原。`)) return;

    try {
      const res = await fetch(`/api/admin/events?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('刪除失敗');
      
      fetchEvents();
    } catch (err: any) {
      alert('刪除失敗：' + err.message);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTaiwanDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const hr = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const wDay = weekDays[d.getDay()];
      
      return `${yr}/${mo}/${dy} (${wDay}) ${hr}:${min}`;
    } catch {
      return dateStr;
    }
  };

  // Get distinct categories dynamically
  const uniqueCategories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));

  // Filter logic
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          e.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <Calendar className="w-6.5 h-6.5 mr-2 text-indigo-600" />
            活動列表
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">管理您的實體線下沙龍、線上研討會與直播講座。</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition flex items-center cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 建立活動
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl font-bold text-xs flex items-start space-x-3 leading-relaxed">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-extrabold mb-1">提示：系統無法載入活動資料表</p>
            <p className="font-medium text-rose-500 mb-3">若這是您首次部署此功能，請先在您的 Supabase SQL 編輯器中執行我們為您準備的 `db/add_events_table.sql` 腳本建立對應資料表。</p>
            <div className="flex items-center space-x-2">
              <button 
                onClick={fetchEvents}
                className="bg-white border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-rose-100/30 transition cursor-pointer"
              >
                重新載入試試
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Table List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold select-none">
            <span>
              篩選出 <span className="text-slate-700 font-extrabold">{filteredEvents.length}</span> 項活動
            </span>
            {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button 
                onClick={handleResetFilters}
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
              >
                重設篩選條件
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="py-24 text-center text-slate-400 font-semibold text-xs select-none">
                活動資料載入中...
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 h-12 text-slate-500 font-bold select-none">
                      <th className="px-6 text-xs uppercase tracking-wider w-[42%]">活動資訊</th>
                      <th className="px-6 text-xs uppercase tracking-wider w-[23%]">活動時間</th>
                      <th className="px-6 text-xs uppercase tracking-wider w-[20%]">地點 / 人數</th>
                      <th className="px-6 text-xs uppercase tracking-wider w-[15%] text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-50/40 transition">
                        
                        {/* Event Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1 select-none">
                            {event.status === 'upcoming' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-[9px] uppercase tracking-wider">
                                報名中
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                                已結束
                              </span>
                            )}
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100/50 text-indigo-600 font-bold text-[9px] select-none">
                              {event.type}
                            </span>
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-400 font-bold text-[9px] select-none">
                              {event.category}
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => handleEdit(event)}
                            className="block font-black text-slate-800 hover:text-indigo-600 transition text-sm mt-2 text-left hover:underline truncate w-full"
                          >
                            {event.title}
                          </button>
                          
                          {event.description && (
                            <p className="text-[11px] text-slate-400 truncate mt-1 max-w-sm font-semibold select-none leading-relaxed">
                              {event.description}
                            </p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-500 font-bold text-xs leading-relaxed select-none">
                          {formatTaiwanDate(event.date)}
                        </td>

                        {/* Location / Attendees */}
                        <td className="px-6 py-4 space-y-1.5 text-slate-400 font-semibold text-xs leading-relaxed select-none">
                          <div className="flex items-center truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-300 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1 text-slate-300 flex-shrink-0" />
                            <span>
                              累積報名: <strong className="text-slate-600 font-black ml-1">{event.attendees}人</strong>
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEdit(event)}
                              title="編輯活動"
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Copy ID Button */}
                            <button
                              onClick={() => handleCopyId(event.id)}
                              title="複製活動 ID"
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer relative"
                            >
                              {copiedId === event.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(event.id, event.title)}
                              title="刪除活動"
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 italic text-xs select-none">
                找不到符合搜尋與篩選條件的活動。
              </div>
            )}
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1 lg:order-first space-y-4 select-none">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            
            <h3 className="font-extrabold text-slate-800 text-xs pb-3 border-b border-slate-50 uppercase tracking-wider flex items-center">
              <Filter className="w-4 h-4 mr-1.5 text-indigo-600" />
              活動篩選
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
                    placeholder="搜尋活動標題、地點"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                  活動狀態
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                >
                  <option value="all">全部活動</option>
                  <option value="upcoming">進行中</option>
                  <option value="completed">已結束</option>
                </select>
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">活動分類</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                >
                  <option value="all">所有分類</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="工作坊">工作坊</option>
                  <option value="線上讀書會">線上讀書會</option>
                  <option value="線下聚會">線下聚會</option>
                </select>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Modal structure */}
      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchEvents();
        }} 
        event={editingEvent} 
      />

    </div>
  );
}
