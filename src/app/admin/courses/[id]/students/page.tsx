'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Mail, 
  Phone, 
  Award, 
  Loader2, 
  BookOpen, 
  UserPlus,
  HelpCircle,
  Video,
  Megaphone,
  DollarSign,
  Layers,
  Calendar,
  Clock,
  Edit3
} from 'lucide-react';

export default function CourseStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  // Course Details State
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [netSales, setNetSales] = useState(0);
  const [allUsers, setAllUsers] = useState<any[]>([]); // for add access modal
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Sub Tabs: 'students' | 'chapters' | 'announcements'
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'chapters' | 'announcements'>('students');

  // Search Filter State (for Students tab)
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  // Course Chapters State (Syllabus tab)
  const [chapters, setChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterVideoUrl, setChapterVideoUrl] = useState('');
  const [chapterOrderIndex, setChapterOrderIndex] = useState('1');

  // Course Announcements State (Announcements tab)
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // Add Access Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch course, students, & sales revenue details
  const fetchCourseAndStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/students?courseId=${courseId}`);
      const data = await res.json();

      if (res.ok) {
        setCourse(data.course);
        setStudents(data.students || []);
        setNetSales(data.netSales || 0);
      } else {
        setError(data.error || '無法取得課程學員資料');
      }
    } catch (err) {
      console.error(err);
      setError('連線發生錯誤，無法載入資料');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all registered users to select from in the add modal
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllUsers(data);
      }
    } catch (err) {
      console.error("Fetch all users error:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch chapters list
  const fetchChapters = async () => {
    setLoadingChapters(true);
    try {
      const res = await fetch(`/api/admin/chapters?courseId=${courseId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setChapters(data);
      }
    } catch (err) {
      console.error("Fetch chapters error:", err);
    } finally {
      setLoadingChapters(false);
    }
  };

  // Fetch announcements list
  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await fetch(`/api/admin/courses/announcements?courseId=${courseId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAnnouncements(data);
      }
    } catch (err) {
      console.error("Fetch announcements error:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseAndStudents();
      fetchAllUsers();
    }
  }, [courseId]);

  // Load data based on sub tab selection
  useEffect(() => {
    if (courseId) {
      if (activeSubTab === 'chapters') {
        fetchChapters();
      } else if (activeSubTab === 'announcements') {
        fetchAnnouncements();
      }
    }
  }, [activeSubTab, courseId]);

  // Handle manual student access grant
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast('error', '請選擇一位成員！');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/courses/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          userId: selectedUserId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', '已成功為學員開通此課程觀看權限！');
        setIsModalOpen(false);
        setSelectedUserId('');
        setUserSearch('');
        fetchCourseAndStudents(); // refresh
      } else {
        showToast('error', data.error || '開通失敗');
      }
    } catch (err) {
      console.error(err);
      showToast('error', '連線錯誤，開通權限失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle student individual course access revocation
  const handleRevokeAccess = async (student: any) => {
    if (student.auth_type === 'subscription') {
      showToast('error', '訂閱制會員觀看權限無法在個別課程中刪除！');
      return;
    }

    if (!confirm(`確定要取消學員「${student.name || student.email}」對此課程的觀看權限嗎？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/courses/students?courseId=${courseId}&userId=${student.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', '已成功取消該學員的單堂觀看授權！');
        fetchCourseAndStudents(); // refresh
      } else {
        showToast('error', data.error || '取消授權失敗');
      }
    } catch (err) {
      console.error(err);
      showToast('error', '連線錯誤，取消授權失敗');
    }
  };

  // --- Chapters CRUD handlers ---
  const handleOpenAddChapter = () => {
    setEditingChapter(null);
    setChapterTitle('');
    setChapterVideoUrl('');
    setChapterOrderIndex(String(chapters.length + 1));
    setIsChapterModalOpen(true);
  };

  const handleOpenEditChapter = (chap: any) => {
    setEditingChapter(chap);
    setChapterTitle(chap.title || '');
    setChapterVideoUrl(chap.video_url || '');
    setChapterOrderIndex(String(chap.order_index));
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim()) {
      showToast('error', '請填寫單元標題！');
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = !!editingChapter;
      const url = '/api/admin/chapters';
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload: any = {
        title: chapterTitle,
        video_url: chapterVideoUrl || null,
        order_index: parseInt(chapterOrderIndex) || 1
      };

      if (isEdit) {
        payload.id = editingChapter.id;
      } else {
        payload.course_id = courseId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', isEdit ? '單元已成功更新！' : '新單元已成功建立！');
        setIsChapterModalOpen(false);
        fetchChapters(); // refresh
      } else {
        showToast('error', data.error || '儲存單元失敗');
      }
    } catch (err) {
      console.error(err);
      showToast('error', '連線錯誤，儲存失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChapter = async (chap: any) => {
    if (!confirm(`確定要刪除單元「${chap.title}」嗎？此動作將無法復原。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/chapters?id=${chap.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('success', '單元已刪除');
        fetchChapters();
      } else {
        showToast('error', '刪除失敗');
      }
    } catch (err) {
      console.error(err);
      showToast('error', '連線錯誤，刪除單元失敗');
    }
  };

  // --- Announcements handlers ---
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('error', '請填寫公告標題與詳細內容！');
      return;
    }

    setPostingAnnouncement(true);
    try {
      const res = await fetch('/api/admin/courses/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          title: annTitle,
          content: annContent
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', '課程公告已成功發佈！學員能在播放單元中即時觀看。');
        setAnnTitle('');
        setAnnContent('');
        fetchAnnouncements(); // refresh
      } else {
        showToast('error', data.error || '發佈失敗');
      }
    } catch (err) {
      console.error(err);
      showToast('error', '連線錯誤，發佈公告失敗');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!confirm('確定要刪除這條課程公告嗎？前台學員將立即無法看見該公告。')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/courses/announcements?id=${annId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('success', '公告已刪除');
        fetchAnnouncements();
      } else {
        showToast('error', '刪除失敗');
      }
    } catch (err) {
      console.error(err);
      showToast('error', '刪除公告失敗，連線發生錯誤');
    }
  };

  // Filter students client-side based on search criteria
  const getFilteredStudents = () => {
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

    return result;
  };

  const handleResetSearch = () => {
    setSearchName('');
    setSearchEmail('');
    setSearchPhone('');
  };

  // Get eligible users to add (exclude users who already have access)
  const getEligibleUsersToAdd = () => {
    const existingUserIds = new Set(students.map(s => s.id));
    let filtered = allUsers.filter(u => !existingUserIds.has(u.id));

    if (userSearch.trim()) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone?.includes(userSearch)
      );
    }

    return filtered;
  };

  const formatTaiwanDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}/${mo}/${dy}`;
  };

  const filteredStudents = getFilteredStudents();
  const eligibleUsers = getEligibleUsersToAdd();

  // Statistics calculation
  const totalStudentsCount = students.length;
  const directPurchasedCount = students.filter(s => s.auth_type === 'single').length;
  const subscriptionCount = students.filter(s => s.auth_type === 'subscription').length;

  return (
    <div className="space-y-6 select-none font-sans text-slate-700 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-extrabold animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 mr-2 text-emerald-600" />
          ) : (
            <X className="w-4 h-4 mr-2 text-rose-600" />
          )}
          {toast.message}
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
          <Link href="/admin/courses" className="hover:text-indigo-600 transition flex items-center">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            返回課程列表
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-extrabold">課程控制台</span>
        </div>
        
        {/* Dynamic add buttons based on tab */}
        {activeSubTab === 'chapters' && (
          <button 
            onClick={handleOpenAddChapter}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-extrabold text-xs shadow-md transition flex items-center cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            建立單元
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-xl font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* Course Detail Banner */}
      {course && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 shadow-sm border border-slate-700/30 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
          
          <div className="flex items-center space-x-4 z-10">
            {/* Course Thumbnail */}
            <div className="relative w-20 h-12.5 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50 flex-shrink-0">
              <SafeImage
                src={course.thumbnail_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"}
                alt={course.title || '課程縮圖'}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-[9px] font-black text-indigo-200">
                  {course.category || '線上課程'}
                </span>
                <span className="text-[10px] font-bold text-slate-300">售價: NT$ {course.price?.toLocaleString()}</span>
              </div>
              <h2 className="text-base md:text-lg font-black text-white leading-snug">{course.title}</h2>
            </div>
          </div>

          <div className="flex space-x-2 z-10">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-indigo-950 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition flex items-center cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 mr-1.5 text-indigo-600" />
              手動授權學員
            </button>
          </div>
        </div>
      )}

      {/* Analytics Cards Grid Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 tracking-wider">累計看課學員</div>
            <div className="text-base font-black text-slate-800 mt-0.5">{loading ? '...' : totalStudentsCount} <span className="text-[10px] font-extrabold text-slate-400">人</span></div>
          </div>
        </div>

        {/* Card 2: Single Purchased */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 tracking-wider">單堂授權人數</div>
            <div className="text-base font-black text-slate-800 mt-0.5">{loading ? '...' : directPurchasedCount} <span className="text-[10px] font-extrabold text-slate-400">人</span></div>
          </div>
        </div>

        {/* Card 3: Subscription Active */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 tracking-wider">訂閱會員暢看</div>
            <div className="text-base font-black text-slate-800 mt-0.5">{loading ? '...' : subscriptionCount} <span className="text-[10px] font-extrabold text-slate-400">人</span></div>
          </div>
        </div>

        {/* Card 4: Net Revenue total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 tracking-wider">淨銷售總額</div>
            <div className="text-base font-black text-emerald-600 mt-0.5">
              {loading ? '...' : `NT$ ${netSales.toLocaleString()}`}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation for dynamic Sub-Tab Content */}
      <div className="border-b border-slate-200 flex space-x-6">
        {[
          { id: 'students', label: '觀看學員名冊', icon: Users },
          { id: 'chapters', label: '課程單元 / 章節管理', icon: Layers },
          { id: 'announcements', label: '發佈課程公告', icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`pb-3 text-xs font-extrabold flex items-center border-b-2 transition relative cursor-pointer active:scale-95 ${
                isSelected 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: STUDENTS LIST TABLE */}
      {activeSubTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-in fade-in duration-300">
          
          {/* Students list */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 h-12">
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        學員名稱 / 電子信箱
                      </th>
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        聯絡電話
                      </th>
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        權限分類
                      </th>
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        授權 / 購買日期
                      </th>
                      <th className="px-6 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-right w-24">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-slate-400 font-semibold text-xs">
                          <Loader2 className="w-5 h-5 mx-auto animate-spin text-indigo-600 mb-2" />
                          學員資料載入中...
                        </td>
                      </tr>
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/40 transition odd:bg-white even:bg-slate-50/10">
                          <td className="px-6 py-4">
                            <span className="font-extrabold text-slate-800 text-xs">
                              {student.name || '未命名學員'}
                            </span>
                            <div className="text-slate-400 text-[10px] font-bold mt-1 flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-slate-300" />
                              {student.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-extrabold text-xs">
                            {student.phone ? (
                              <span className="flex items-center">
                                <Phone className="w-3 h-3 mr-1 text-slate-400" />
                                {student.phone}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {student.auth_type === 'subscription' ? (
                              <div className="inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black bg-indigo-50 border border-indigo-100 text-indigo-600 items-center">
                                <Award className="w-3 h-3 mr-1 text-indigo-500" />
                                🏅 訂閱會員暢看
                              </div>
                            ) : (
                              <div className="inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black bg-sky-50 border border-sky-100 text-sky-600 items-center">
                                <BookOpen className="w-3 h-3 mr-1 text-sky-500" />
                                👤 單堂購買 / 授權
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-bold text-[11px]">
                            {formatTaiwanDate(student.purchased_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {student.auth_type === 'subscription' ? (
                              <div className="group relative inline-block">
                                <button
                                  disabled
                                  className="p-1.5 border border-slate-100 text-slate-300 bg-slate-50 rounded-lg cursor-not-allowed flex items-center justify-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute right-0 bottom-8 hidden group-hover:block bg-slate-800 text-white text-[9px] font-extrabold p-2.5 rounded-lg shadow-lg w-48 text-left leading-normal z-30 select-none animate-in fade-in duration-200">
                                  <div className="flex items-start">
                                    <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-indigo-400 flex-shrink-0" />
                                    <span>此學員為「訂閱制會員」，觀看權限受其方案保護，無法單獨在此課程中取消。</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleRevokeAccess(student)}
                                title="取消授權"
                                className="p-1.5 border border-rose-100 hover:border-rose-200 text-rose-500 hover:bg-rose-50/50 rounded-lg transition active:scale-90 cursor-pointer flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-slate-400 italic text-xs font-bold">
                          本課程目前尚無學員擁有觀看權限。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Search filters aside */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-2.5">
                <h3 className="font-extrabold text-slate-800 text-xs">即時搜尋篩選</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block">成員姓名</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="搜尋姓名..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block">電子信箱 (Email)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="搜尋信箱..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block">聯絡電話</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      placeholder="搜尋電話..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={handleResetSearch}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-extrabold text-slate-500 text-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer text-center"
                  >
                    重設
                  </button>
                  <button 
                    type="button"
                    className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-xl font-extrabold text-xs transition select-none flex items-center justify-center cursor-default"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    已套用
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: CURRICULUM & CHAPTERS MANAGEMENT */}
      {activeSubTab === 'chapters' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in fade-in duration-300 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">單元與章節大綱管理</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">安排此課程的線上單元影片大綱，提供 YouTube/Vimeo 等嵌入 ID 給學員學習觀看。</p>
            </div>
          </div>

          {loadingChapters ? (
            <div className="py-24 text-center text-slate-400 font-semibold text-xs flex justify-center items-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-600" />
              載入課程單元大綱中...
            </div>
          ) : chapters.length > 0 ? (
            <div className="space-y-3">
              {chapters.map((chap, idx) => (
                <div 
                  key={chap.id}
                  className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-black text-slate-800 truncate">{chap.title}</h4>
                      {chap.video_url ? (
                        <div className="text-[10px] font-bold text-indigo-600/70 flex items-center">
                          <Video className="w-3.5 h-3.5 mr-1" />
                          影片 ID/網址: <span className="font-mono text-slate-500 ml-1">{chap.video_url}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-extrabold text-amber-500 flex items-center">
                          ⚠️ 尚未綁定學習影片 (草稿)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <span className="text-[10px] font-black text-slate-400 bg-white border px-2 py-0.5 rounded-md">
                      排序: {chap.order_index}
                    </span>
                    <button
                      onClick={() => handleOpenEditChapter(chap)}
                      className="p-1.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition active:scale-90 cursor-pointer flex items-center"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(chap)}
                      className="p-1.5 border border-rose-100 hover:border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg transition active:scale-90 cursor-pointer flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 font-bold text-xs italic">
              本課程目前尚未建立任何單元大綱。請點擊右上角「建立單元」新增。
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT 3: TIMELINE ANNOUNCEMENTS PANEL */}
      {activeSubTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start animate-in fade-in duration-300">
          
          {/* Post announcement Form */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="border-b border-slate-50 pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-xs">發佈全新課程公告</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">發佈後的公告會顯示於學員看課播放器中。</p>
            </div>
            
            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block">公告標題</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="例如：6/5 大師班直播時間敲定！"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block">詳細公告內容</label>
                <textarea 
                  required
                  rows={5}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="請輸入詳細公告內容，可以包含直播連結或學習材料下載說明..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-semibold text-slate-600 leading-relaxed outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              <button 
                type="submit"
                disabled={postingAnnouncement}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center cursor-pointer"
              >
                {postingAnnouncement && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                發佈此課程公告
              </button>
            </form>
          </div>

          {/* Announcements Timeline List */}
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 min-h-[400px]">
            <div className="border-b border-slate-50 pb-2.5 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-xs">歷史公告時間軸</h3>
              {loadingAnnouncements && <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
            </div>

            {loadingAnnouncements ? (
              <div className="py-24 text-center text-slate-400 font-semibold text-xs flex justify-center items-center">
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-indigo-600" />
                載入公告時間軸中...
              </div>
            ) : announcements.length > 0 ? (
              <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
                {announcements.map((ann) => (
                  <div key={ann.id} className="relative group animate-in fade-in duration-300">
                    
                    {/* Circle Node */}
                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 ring-4 ring-white border border-indigo-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    </span>

                    {/* Announcement card body */}
                    <div className="bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 transition space-y-2 relative">
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-800 leading-snug">{ann.title}</h4>
                          <div className="text-[9px] font-bold text-slate-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            發佈於 {formatTaiwanDate(ann.created_at)}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          title="刪除此公告"
                          className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition active:scale-90 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed whitespace-pre-line pt-1 border-t border-slate-100/50">
                        {ann.content}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 font-bold text-xs italic">
                本課程目前尚無歷史公告。請利用左側表單發佈您的第一條公告！
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL 1: ADD / EDIT CHAPTER UNIT */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-sm">
                {editingChapter ? '編輯課程單元' : '建立全新課程單元'}
              </h3>
              <button 
                onClick={() => setIsChapterModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveChapter} className="p-6 space-y-4">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">單元標題 <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="例如：第一單元 - 開發高階客戶的基本溝通模型"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Video URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">影片 ID 或播放網址</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={chapterVideoUrl}
                    onChange={(e) => setChapterVideoUrl(e.target.value)}
                    placeholder="YouTube 影片 ID (例如: dQw4w9WgXcQ)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                  <Video className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[9px] font-bold text-slate-400 leading-normal mt-1">支援 YouTube 影片 ID（11字元）或 Vimeo 播放連結。</p>
              </div>

              {/* Order Index */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">單元播放排序 index</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={chapterOrderIndex}
                  onChange={(e) => setChapterOrderIndex(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                <button 
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-extrabold text-slate-500 text-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer text-center"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  儲存單元大綱
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GRANT STUDENT ACCESS (For Students Tab) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">手動開通學員看課權限</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">請選取系統成員以對其開通此課程</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGrantAccess} className="p-6 space-y-4 flex flex-col flex-1 overflow-hidden">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">搜尋平台成員 (輸入姓名/Email/電話)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setSelectedUserId('');
                    }}
                    placeholder="輸入關鍵字..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">可授權成員清單</label>
                <div className="border border-slate-100 rounded-xl max-h-48 overflow-y-auto p-2.5 space-y-1.5 bg-slate-50/50 scrollbar-thin">
                  {loadingUsers ? (
                    <div className="py-8 text-center text-slate-400 font-semibold text-[10px] flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-indigo-600" />
                      載入成員中...
                    </div>
                  ) : eligibleUsers.length > 0 ? (
                    eligibleUsers.map((user) => {
                      const isSelected = selectedUserId === user.id;
                      return (
                        <div
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                          className={`p-2.5 rounded-xl border flex flex-col space-y-1 cursor-pointer transition select-none ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-50/30' 
                              : 'border-transparent bg-white hover:bg-slate-200/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-800">{user.name || '未命名'}</span>
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-slate-100 border border-slate-200/50 text-slate-400 select-none">
                              {user.role === 'admin' ? '管理員' : user.role === 'instructor' ? '講師' : user.role === 'assistant' ? '助教' : '學員'}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400">{user.email} {user.phone ? `/ ${user.phone}` : ''}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-300 italic text-[10px] font-bold">
                      {userSearch.trim() ? '無符合搜尋條件的未授權成員' : '平台所有成員皆已擁有此課程觀看權限'}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50 flex-shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-extrabold text-slate-500 text-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer text-center"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={submitting || !selectedUserId}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  開通看課權限
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
