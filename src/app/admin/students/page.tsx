'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Download, Search, RefreshCw, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search Filters State
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setStudents(data);
        setFilteredStudents(data);
      } else {
        setError(data.error || '無法取得學員資料');
      }
    } catch (err) {
      console.error(err);
      setError('連線發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let result = [...students];

    if (searchName.trim()) {
      result = result.filter(s => s.name?.toLowerCase().includes(searchName.toLowerCase()));
    }
    if (searchEmail.trim()) {
      result = result.filter(s => s.email?.toLowerCase().includes(searchEmail.toLowerCase()));
    }
    if (searchPhone.trim()) {
      result = result.filter(s => s.phone?.includes(searchPhone));
    }

    setFilteredStudents(result);
  };

  const handleReset = () => {
    setSearchName('');
    setSearchEmail('');
    setSearchPhone('');
    setFilteredStudents(students);
  };

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
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <span className="material-symbols-outlined mr-2 text-indigo-600" style={{ fontSize: '26px' }}>people</span>
            成員
          </h1>
        </div>
        
        {/* Export and action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 bg-white text-xs font-bold transition shadow-sm">
            <span className="material-symbols-outlined mr-1.5" style={{ fontSize: '16px' }}>download</span>
            匯出所有學員 (CSV)
          </button>
          <button className="flex items-center px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 bg-white text-xs font-bold transition shadow-sm">
            <span className="material-symbols-outlined mr-1.5" style={{ fontSize: '16px' }}>download</span>
            Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-xl font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* Main Grid: Left is Table list, Right is Filter Aside */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Students List Table */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Item Count row */}
          <div className="text-xs text-slate-400 font-bold">
            共 <span className="text-slate-700 font-extrabold">{filteredStudents.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{Math.min(25, filteredStudents.length)}</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 h-12">
                    <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-2/3">
                      名稱 / 電子信箱 / 聯絡電話
                    </th>
                    <th className="px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">
                      加入時間
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="py-24 text-center text-slate-400 font-semibold text-sm">
                        資料載入中...
                      </td>
                    </tr>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition odd:bg-white even:bg-slate-50/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Link 
                              href={`/admin/students/${student.id}`}
                              className="font-bold text-blue-600 hover:text-blue-800 transition text-sm"
                            >
                              {student.name || '未命名學員'}
                            </Link>
                          </div>
                          <div className="text-slate-400 text-xs font-medium mt-1">
                            {student.email} {student.phone ? `/ ${student.phone}` : '/ —'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold text-xs">
                          {formatTaiwanDate(student.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-24 text-center text-slate-400 italic text-sm">
                        查無符合篩選條件的成員。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Search filters aside */}
        <div className="lg:col-span-1 lg:order-first">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="border-b border-slate-50 pb-2.5">
              <h3 className="font-bold text-slate-800 text-sm">進階篩選</h3>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">學生姓名</label>
                <input 
                  type="text" 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="搜尋學員姓名"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">學生信箱</label>
                <input 
                  type="text" 
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="搜尋信箱"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">學生電話</label>
                <input 
                  type="text" 
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="搜尋聯絡電話"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  type="button"
                  onClick={handleReset}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 text-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                >
                  重設
                </button>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  搜尋
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
