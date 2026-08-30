'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Save, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  Plus, 
  FileText, 
  Link as LinkIcon, 
  EyeOff, 
  MessageSquare, 
  Star,
  Upload,
  Loader2,
  Users,
  Search,
  Presentation
} from 'lucide-react';
import { uploadFile, uploadLargeFile, uploadVideoToBunny } from '@/lib/admin-upload';
import { useToast } from '@/components/Toast';
import RichTextEditor from './RichTextEditor';

interface Chapter {
  id?: string;
  title: string;
  video_url: string;
  file_url?: string;
  content_html?: string; // 圖文 / 簡報連結區塊（可貼簡報連結或補充說明）
  order_index: number;
}

// 課程類型：付費課程 / 免費課程（名單磁鐵）
type CourseType = 'paid' | 'free';

export interface Course {
  id?: string;
  title: string;
  subtitle?: string;            // 課程副標題
  description: string;
  thumbnail_url: string;
  price: number;
  category: string;
  slug?: string;                // 銷售網址代稱（組成 /courses/<slug>）
  points?: string;              // 課程要點（多行）
  total_hours?: string;         // 總課程時數
  start_date?: string;          // 開課日期（YYYY-MM-DD）
  course_type?: CourseType;     // paid / free
  instructor?: string;
  is_published?: boolean;
  is_hidden?: boolean;
  is_featured?: boolean;        // 設為精選（暢銷課程標籤）
  show_student_count?: boolean; // 是否顯示學員數
  allow_comments?: boolean;
  allow_ratings?: boolean;
  seo_title?: string;           // 自訂 SEO 標題
  seo_description?: string;     // 自訂 SEO 描述
  seo_no_index?: boolean;       // true = 不要收錄（no-index）
  file_url?: string;
  video_url?: string;
  chapters: Chapter[];
}

interface CourseModalProps {
  course?: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseModal({ course, isOpen, onClose }: CourseModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null); // tracks which field is uploading (e.g. 'cover', 'course_file', 'chapter-video-idx', 'chapter-file-idx')
  const [deletedChapters, setDeletedChapters] = useState<string[]>([]);
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);
  // 課程類別下拉：優先讀「課程類別管理」的資料，讀不到才用預設四項（向後相容）
  const DEFAULT_CATEGORIES = ['業務新手村', '產業大講堂', '圍爐夜話', '讀書會'];
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES);
  const [formData, setFormData] = useState<Course>({
    title: '',
    subtitle: '',
    description: '',
    thumbnail_url: '',
    price: 0,
    category: '業務新手村',
    slug: '',
    points: '',
    total_hours: '',
    start_date: '',
    course_type: 'paid',
    instructor: 'BDS 團隊',
    is_published: true,
    is_hidden: false,
    is_featured: false,
    show_student_count: false,
    allow_comments: true,
    allow_ratings: true,
    seo_title: '',
    seo_description: '',
    seo_no_index: false,
    file_url: '',
    video_url: '',
    chapters: []
  });

  // Sync formData when isOpen or course changes
  useEffect(() => {
    if (isOpen) {
      setLocalCoverPreview(null);
      if (course) {
        setFormData({
          ...course,
          subtitle: course.subtitle || '',
          slug: course.slug || '',
          points: course.points || '',
          total_hours: course.total_hours || '',
          start_date: course.start_date ? String(course.start_date).slice(0, 10) : '',
          course_type: course.course_type === 'free' ? 'free' : 'paid',
          instructor: course.instructor || 'BDS 團隊',
          is_published: course.is_published !== false,
          is_hidden: !!course.is_hidden,
          is_featured: !!course.is_featured,
          show_student_count: !!course.show_student_count,
          allow_comments: course.allow_comments !== false,
          allow_ratings: course.allow_ratings !== false,
          seo_title: course.seo_title || '',
          seo_description: course.seo_description || '',
          seo_no_index: !!course.seo_no_index,
          file_url: course.file_url || '',
          video_url: course.video_url || '',
          chapters: (course.chapters || []).map(ch => ({
            ...ch,
            file_url: ch.file_url || '',
            content_html: ch.content_html || ''
          }))
        });
      } else {
        setFormData({
          title: '',
          subtitle: '',
          description: '',
          thumbnail_url: '',
          price: 0,
          category: '業務新手村',
          slug: '',
          points: '',
          total_hours: '',
          start_date: '',
          course_type: 'paid',
          instructor: 'BDS 團隊',
          is_published: true,
          is_hidden: false,
          is_featured: false,
          show_student_count: false,
          allow_comments: true,
          allow_ratings: true,
          seo_title: '',
          seo_description: '',
          seo_no_index: false,
          file_url: '',
          video_url: '',
          chapters: []
        });
      }
      setDeletedChapters([]);
      setUploadingField(null);
    }
  }, [isOpen, course]);

  // 開啟時載入「課程類別管理」的分類，供下拉選單使用（讀不到就維持預設四項）
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    fetch('/api/admin/course-categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!alive) return;
        const names = Array.isArray(rows)
          ? rows.map((c: { name?: string }) => c?.name).filter((n): n is string => !!n)
          : [];
        if (names.length > 0) setCategoryOptions(names);
      })
      .catch(() => { /* 讀不到就用預設 */ });
    return () => { alive = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddChapter = () => {
    setFormData({
      ...formData,
      chapters: [
        ...formData.chapters,
        { title: '', video_url: '', file_url: '', content_html: '', order_index: formData.chapters.length + 1 }
      ]
    });
  };

  const handleChapterChange = (index: number, field: keyof Chapter, value: string | number) => {
    const newChapters = [...formData.chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setFormData({ ...formData, chapters: newChapters });
  };

  const handleRemoveChapter = (index: number) => {
    const chapterToRemove = formData.chapters[index];
    if (chapterToRemove.id) {
      setDeletedChapters([...deletedChapters, chapterToRemove.id]);
    }
    const newChapters = formData.chapters.filter((_, i) => i !== index);
    setFormData({ ...formData, chapters: newChapters });
  };

  // 通用檔案上傳處理（統一走共用上傳模組）
  const handleGenericUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 封面圖片先以本機預覽呈現，提升上傳等待體驗
    if (fieldKey === 'cover') {
      const objectUrl = URL.createObjectURL(file);
      setLocalCoverPreview(objectUrl);
    }

    setUploadingField(fieldKey);
    try {
      // 三種上傳路徑：
      //  - 封面/縮圖（cover）：小圖片走一般上傳（public、4.5MB、含 HEIC 轉換）。
      //  - 章節影片（chapter-video-*）：直傳 Bunny Stream（串流大檔的正確去處，可傳長片、金鑰不外洩）。
      //  - 課程檔/章節教材（文件）：走 Supabase 大檔直傳（protected 私有桶）。
      let url: string;
      if (fieldKey === 'cover') {
        url = await uploadFile(file, 'public');
      } else if (fieldKey.startsWith('chapter-video')) {
        url = await uploadVideoToBunny(file);
      } else {
        url = await uploadLargeFile(file, 'protected');
      }
      callback(url);
    } catch (err) {
      console.error(err);
      toast.error('檔案上傳失敗：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 必填欄位驗證（儲存鈕位於 form 之外，HTML5 required 不生效，改由此處明確把關）
    if (!formData.title.trim()) {
      toast.error('請輸入課程名稱');
      return;
    }
    if (!Number.isFinite(formData.price) || formData.price < 0) {
      toast.error('請輸入有效的售價（0 或以上的數字）');
      return;
    }
    const emptyChapterIndex = formData.chapters.findIndex(ch => !ch.title.trim());
    if (emptyChapterIndex !== -1) {
      toast.error(`第 ${emptyChapterIndex + 1} 個章節的名稱不可空白`);
      return;
    }

    setLoading(true);

    try {
      const url = '/api/admin/courses';
      const method = formData.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('儲存失敗');

      const savedCourse = await res.json();
      const courseId = formData.id || savedCourse.id;

      // 1. Delete removed chapters（檢查每次回應，失敗即中止並提示，避免靜默吞掉錯誤）
      for (const chapterId of deletedChapters) {
        const delRes = await fetch(`/api/admin/chapters?id=${chapterId}`, {
          method: 'DELETE',
        });
        if (!delRes.ok) throw new Error('章節刪除失敗，請重試');
      }

      // 2. Add or update chapters（同樣檢查每次回應）
      for (let i = 0; i < formData.chapters.length; i++) {
        const chapter = formData.chapters[i];
        const chRes = await fetch('/api/admin/chapters', {
          method: chapter.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...chapter,
            course_id: courseId,
            order_index: i + 1 // Re-calculate orders
          }),
        });
        if (!chRes.ok) throw new Error(`章節「${chapter.title || i + 1}」儲存失敗，請重試`);
      }

      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('儲存出錯了，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col font-sans">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">{formData.id ? '編輯課程' : '新增課程'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">課程名稱</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition"
                  placeholder="例如：半導體業務入門"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">課程副標題</label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition"
                  placeholder="例如：從零開始建立你的業務開發系統"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">銷售網址代稱 (Slug)</label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition"
                  placeholder="例如：semiconductor-sales-101"
                />
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                  將組成銷售網址：https://bds.fu-notes.com/courses/
                  <span className="font-bold text-gray-600">{formData.slug?.trim() || '<slug>'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">課程簡介</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
                  placeholder="請輸入課程詳細介紹（可用標題、清單、粗體、顏色、連結、圖片、表格…）"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">課程要點</label>
                <RichTextEditor
                  value={formData.points || ''}
                  onChange={(html) => setFormData(prev => ({ ...prev, points: html }))}
                  placeholder="條列課程重點，例如：學會客戶痛點分析、掌握報價與談判技巧、建立長期客戶關係（可用清單、粗體、顏色…）"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">課程分類</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold transition bg-white cursor-pointer"
                  >
                    {/* 若目前課程的分類不在清單中（例如舊資料），仍保留為可選項，避免被清掉 */}
                    {formData.category && !categoryOptions.includes(formData.category) && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">分類清單來自「課程 → 課程類別」管理；在那裡新增/調整。</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">課程類型</label>
                  <select
                    value={formData.course_type || 'paid'}
                    onChange={e => {
                      const nextType = (e.target.value === 'free' ? 'free' : 'paid') as CourseType;
                      // 免費課程（名單磁鐵）售價一律為 0
                      setFormData(prev => ({
                        ...prev,
                        course_type: nextType,
                        price: nextType === 'free' ? 0 : prev.price,
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold transition bg-white cursor-pointer"
                  >
                    <option value="paid">付費課程</option>
                    <option value="free">免費課程（名單磁鐵）</option>
                  </select>
                </div>
              </div>

              {/* 售價：免費課程時隱藏（售價固定為 0） */}
              {formData.course_type !== 'free' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">售價 (NT$)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">總課程時數</label>
                  <input
                    type="text"
                    value={formData.total_hours || ''}
                    onChange={e => setFormData({...formData, total_hours: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition"
                    placeholder="例如：6 小時"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">開課日期</label>
                  <input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={e => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">授課講師</label>
                <input 
                  type="text" 
                  value={formData.instructor || ''}
                  onChange={e => setFormData({...formData, instructor: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition"
                  placeholder="例如：BDS 團隊"
                />
              </div>

              {/* Course-wide Attachment File Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>課程教材檔案 (下載資源) <span className="text-[10px] font-semibold text-gray-400 normal-case ml-1.5">(PDF/Word/Excel/PPT/ZIP，單檔上限 5GB)</span></span>
                  {uploadingField === 'course_file' && <span className="text-[10px] text-blue-600 font-bold flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 上傳中...</span>}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.file_url || ''}
                    onChange={e => setFormData({...formData, file_url: e.target.value})}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-semibold transition"
                    placeholder="講義 PDF 連結，或點右側上傳"
                  />
                  <div className="relative">
                    <button 
                      type="button" 
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" /> 上傳檔案
                    </button>
                    <input 
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                      onChange={(e) => handleGenericUpload(e, 'course_file', (url) => setFormData(prev => ({ ...prev, file_url: url })))}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Course Promo Video Embed URL */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center">
                  <LinkIcon className="w-3.5 h-3.5 mr-1.5" /> 課程宣傳影片網址 (嵌入網址)
                </label>
                <input 
                  type="text" 
                  value={formData.video_url || ''}
                  onChange={e => setFormData({...formData, video_url: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs font-semibold transition"
                  placeholder="例如：https://www.youtube.com/embed/..."
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" /> 課程封面圖片
                </label>
                
                <div className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 hover:bg-gray-100/50 transition relative group cursor-pointer">
                  {uploadingField === 'cover' ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="text-xs font-bold text-gray-500">正在上傳圖片中...</span>
                    </div>
                  ) : (localCoverPreview || formData.thumbnail_url) ? (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                      <img
                        src={localCoverPreview || formData.thumbnail_url}
                        alt="課程封面預覽"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { const t = e.currentTarget; if (!t.src.endsWith('/images/course-placeholder.svg')) t.src = '/images/course-placeholder.svg'; }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/60 px-3.5 py-2 rounded-xl">重新選取圖片</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                      <div className="p-3 bg-white rounded-full shadow-xs text-gray-400 group-hover:text-blue-500 transition">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">點擊上傳課程封面圖片</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-semibold">支援 PNG, JPG, WEBP (限制 4.5MB 以下，建議尺寸 1280x800 px)</p>
                      </div>
                    </div>
                  )}

                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleGenericUpload(e, 'cover', (url) => setFormData(prev => ({ ...prev, thumbnail_url: url })))}
                    disabled={uploadingField !== null}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>

              {/* Course Options & Switches */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200/50">控制與權限選項</h4>
                
                <div className="space-y-3">
                  {/* is_published */}
                  <label className="flex items-start space-x-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={!!formData.is_published}
                      onChange={e => setFormData({...formData, is_published: e.target.checked})}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition">將此課程立即公開發布</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">開啟後學員可在前台直接購買與瀏覽。</p>
                    </div>
                  </label>

                  {/* is_hidden */}
                  <label className="flex items-start space-x-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={!!formData.is_hidden}
                      onChange={e => setFormData({...formData, is_hidden: e.target.checked})}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition flex items-center">
                        <EyeOff className="w-3.5 h-3.5 mr-1 text-amber-500" /> 隱藏此課程
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">開啟後在前台課程列表隱藏，僅能以直達網址點閱與購買。</p>
                    </div>
                  </label>

                  {/* allow_comments */}
                  <label className="flex items-start space-x-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={!!formData.allow_comments}
                      onChange={e => setFormData({...formData, allow_comments: e.target.checked})}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition flex items-center">
                        <MessageSquare className="w-3.5 h-3.5 mr-1 text-sky-500" /> 開放學員留言
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">開啟後學員可在各影片章節單元下方留言討論。</p>
                    </div>
                  </label>

                  {/* allow_ratings */}
                  <label className="flex items-start space-x-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={!!formData.allow_ratings}
                      onChange={e => setFormData({...formData, allow_ratings: e.target.checked})}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition flex items-center">
                        <Star className="w-3.5 h-3.5 mr-1 text-yellow-500 fill-yellow-500/20" /> 開放學員評價
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">開啟後學員可在課程首頁填寫評分、撰寫文字心得評價。</p>
                    </div>
                  </label>

                  {/* is_featured：設為精選（暢銷課程標籤） */}
                  <label className="flex items-start space-x-3 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={!!formData.is_featured}
                      onChange={e => setFormData({...formData, is_featured: e.target.checked})}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition flex items-center">
                        <Star className="w-3.5 h-3.5 mr-1 text-orange-500 fill-orange-500/20" /> 設為精選課程
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">開啟後會在銷售頁顯示「暢銷課程」標籤。</p>
                    </div>
                  </label>

                  {/* show_student_count：是否顯示學員數（預設不顯示） */}
                  <label className="flex items-start space-x-3 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={!!formData.show_student_count}
                      onChange={e => setFormData({...formData, show_student_count: e.target.checked})}
                      className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-emerald-500" /> 顯示學員數
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">開啟後銷售頁會顯示已報名學員人數（預設不顯示）。</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100"></div>

          {/* SEO Section (搜尋引擎最佳化) */}
          <div className="space-y-5">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-teal-600" /> SEO 搜尋引擎設定
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">自訂 SEO 標題</label>
              <input
                type="text"
                value={formData.seo_title || ''}
                onChange={e => setFormData({...formData, seo_title: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition"
                placeholder="留空則自動使用課程名稱"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">自訂 SEO 描述</label>
              <textarea
                value={formData.seo_description || ''}
                onChange={e => setFormData({...formData, seo_description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition min-h-[80px]"
                placeholder="留空則自動使用課程描述。建議 80～160 字，用於搜尋結果摘要。"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">搜尋引擎收錄</label>
              <select
                value={formData.seo_no_index ? 'noindex' : 'index'}
                onChange={e => setFormData({...formData, seo_no_index: e.target.value === 'noindex'})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold transition bg-white cursor-pointer"
              >
                <option value="index">允許收錄（預設）</option>
                <option value="noindex">不要收錄（no-index）</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1.5 font-medium">「不要收錄」會加上 noindex，避免此頁出現在 Google 等搜尋結果中。</p>
            </div>
          </div>

          <div className="h-px bg-gray-100"></div>

          {/* Chapters Section (章節管理) */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center">
                <Video className="w-5 h-5 mr-2 text-indigo-600" /> 課程章節與影片教材管理
              </h3>
              <button 
                type="button"
                onClick={handleAddChapter}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-lg active:scale-95 transition"
              >
                <Plus className="w-4 h-4 mr-1" /> 新增章節單元
              </button>
            </div>

            <div className="space-y-4">
              {formData.chapters.map((chapter, index) => (
                <div key={index} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200/60 relative group transition hover:border-blue-300 hover:bg-white shadow-xs">
                  
                  {/* Left Index Badge */}
                  <span className="absolute -left-2 top-6 bg-slate-200 text-slate-600 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>

                  <div className="space-y-4 pl-2">
                    {/* Row 1: Title */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">章節名稱</label>
                      <input 
                        type="text" 
                        required
                        placeholder="例如：單元 1 - 認識客戶與痛點分析"
                        value={chapter.title}
                        onChange={e => handleChapterChange(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs font-semibold focus:border-blue-500 bg-white"
                      />
                    </div>

                    {/* Row 2: Video (Link or Upload) */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase flex justify-between items-center">
                        <span>章節影片網址 (嵌入網址，支援 Bunny.net / YouTube / 直接上傳影片檔：MP4/WEBM/MOV/AVI/M4V/MKV/WMV/FLV，單檔上限 5GB、建議 1080p)</span>
                        {uploadingField === `chapter-video-${index}` && <span className="text-[10px] text-blue-600 font-bold flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 上傳影片中...</span>}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="請輸入影片嵌入 URL，或點右側按鈕上傳影片"
                          value={chapter.video_url}
                          onChange={e => handleChapterChange(index, 'video_url', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs font-semibold focus:border-blue-500 bg-white"
                        />
                        <div className="relative">
                          <button 
                            type="button" 
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5 mr-1" /> 上傳影片
                          </button>
                          <input
                            type="file"
                            accept="video/*,.mkv,.flv,.avi,.wmv,.m4v"
                            onChange={(e) => handleGenericUpload(e, `chapter-video-${index}`, (url) => handleChapterChange(index, 'video_url', url))}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      </div>
                      {/* 支援格式說明 */}
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                        支援格式：影片 MP4 / MOV / AVI / M4V / WebM / MKV / WMV；音訊 MP3；文件 DOC / DOCX / PPT / PPTX / XLS / XLSX / PDF；圖片 JPG / PNG；壓縮 ZIP。影片單檔上限 5GB。
                      </p>
                    </div>

                    {/* Row 3: 圖文 / 簡報連結區塊 (content_html) */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase flex items-center">
                        <Presentation className="w-3.5 h-3.5 mr-1 text-violet-500" /> 圖文 / 簡報連結 (選填)
                      </label>
                      <textarea
                        placeholder="可貼上簡報連結（Google 簡報 / Canva 等）或補充圖文說明，多行文字"
                        value={chapter.content_html || ''}
                        onChange={e => handleChapterChange(index, 'content_html', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs font-semibold focus:border-blue-500 bg-white min-h-[70px]"
                      />
                    </div>

                    {/* Row 4: Chapter Material File (Link or Upload) */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase flex justify-between items-center">
                        <span>本單元教材講義 (選填)</span>
                        {uploadingField === `chapter-file-${index}` && <span className="text-[10px] text-blue-600 font-bold flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 上傳講義中...</span>}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="本單元講義下載連結，或點右側上傳講義"
                          value={chapter.file_url || ''}
                          onChange={e => handleChapterChange(index, 'file_url', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs font-semibold focus:border-blue-500 bg-white"
                        />
                        <div className="relative">
                          <button 
                            type="button" 
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" /> 上傳講義
                          </button>
                          <input 
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                            onChange={(e) => handleGenericUpload(e, `chapter-file-${index}`, (url) => handleChapterChange(index, 'file_url', url))}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    type="button"
                    onClick={() => handleRemoveChapter(index)}
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shadow-2xs cursor-pointer"
                    title="刪除此章節"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.chapters.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 text-sm">
                  尚未新增任何章節，請點擊右上方「新增章節單元」進行建立。
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 flex justify-end space-x-4 bg-gray-50/50">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 transition cursor-pointer text-xs"
          >
            取消
          </button>
          <button 
            type="submit"
            disabled={loading || uploadingField !== null}
            onClick={handleSubmit}
            className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:bg-gray-400 flex items-center cursor-pointer text-xs active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 儲存中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> 儲存課程
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
