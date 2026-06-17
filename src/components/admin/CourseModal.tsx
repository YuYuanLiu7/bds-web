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
  Loader2
} from 'lucide-react';

interface Chapter {
  id?: string;
  title: string;
  video_url: string;
  file_url?: string;
  order_index: number;
}

interface Course {
  id?: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  category: string;
  instructor?: string;
  is_published?: boolean;
  is_hidden?: boolean;
  allow_comments?: boolean;
  allow_ratings?: boolean;
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
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null); // tracks which field is uploading (e.g. 'cover', 'course_file', 'chapter-video-idx', 'chapter-file-idx')
  const [deletedChapters, setDeletedChapters] = useState<string[]>([]);
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Course>({
    title: '',
    description: '',
    thumbnail_url: '',
    price: 0,
    category: '業務新手村',
    instructor: 'BDS 團隊',
    is_published: true,
    is_hidden: false,
    allow_comments: true,
    allow_ratings: true,
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
          instructor: course.instructor || 'BDS 團隊',
          is_published: course.is_published !== false,
          is_hidden: !!course.is_hidden,
          allow_comments: course.allow_comments !== false,
          allow_ratings: course.allow_ratings !== false,
          file_url: course.file_url || '',
          video_url: course.video_url || '',
          chapters: (course.chapters || []).map(ch => ({
            ...ch,
            file_url: ch.file_url || ''
          }))
        });
      } else {
        setFormData({
          title: '',
          description: '',
          thumbnail_url: '',
          price: 0,
          category: '業務新手村',
          instructor: 'BDS 團隊',
          is_published: true,
          is_hidden: false,
          allow_comments: true,
          allow_ratings: true,
          file_url: '',
          video_url: '',
          chapters: []
        });
      }
      setDeletedChapters([]);
      setUploadingField(null);
    }
  }, [isOpen, course]);

  if (!isOpen) return null;

  const handleAddChapter = () => {
    setFormData({
      ...formData,
      chapters: [
        ...formData.chapters,
        { title: '', video_url: '', file_url: '', order_index: formData.chapters.length + 1 }
      ]
    });
  };

  const handleChapterChange = (index: number, field: keyof Chapter, value: any) => {
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

  // Helper to handle general file uploads
  const handleGenericUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string, callback: (url: string) => void) => {
    let file = e.target.files?.[0];
    if (!file) return;

    // Convert HEIC image to JPEG if selected
    const isHEIC = 
      file.type === 'image/heic' || 
      file.type === 'image/heif' || 
      /\.(heic|heif)$/i.test(file.name);

    if (isHEIC) {
      try {
        const { ensureClientImageCompatible } = await import('@/lib/image');
        file = await ensureClientImageCompatible(file);
      } catch (err) {
        console.error('HEIC image conversion warning:', err);
      }
    }

    if (fieldKey === 'cover') {
      const objectUrl = URL.createObjectURL(file);
      setLocalCoverPreview(objectUrl);
    }

    setUploadingField(fieldKey);
    const uploadData = new FormData();
    const fileExt = file.name.split('.').pop() || 'file';
    const safeName = `upload-${Date.now()}.${fileExt}`;
    uploadData.append('file', file, safeName);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上傳失敗');

      if (data.url) {
        callback(data.url);
      }
    } catch (err: any) {
      console.error(err);
      alert('檔案上傳失敗：' + err.message);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // 1. Delete removed chapters
      for (const chapterId of deletedChapters) {
        await fetch(`/api/admin/chapters?id=${chapterId}`, {
          method: 'DELETE',
        });
      }

      // 2. Add or update chapters
      for (let i = 0; i < formData.chapters.length; i++) {
        const chapter = formData.chapters[i];
        await fetch('/api/admin/chapters', {
          method: chapter.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...chapter, 
            course_id: courseId,
            order_index: i + 1 // Re-calculate orders
          }),
        });
      }

      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('儲存出錯了，請稍後再試');
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
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">課程描述</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition min-h-[100px]"
                  placeholder="請輸入課程詳細介紹..."
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
                    <option>業務新手村</option>
                    <option>產業大講堂</option>
                    <option>圍爐夜話</option>
                    <option>讀書會</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">售價 (NT$)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold transition"
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
                  <span>課程教材檔案 (下載資源)</span>
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
                        <p className="text-[10px] text-gray-400 mt-1 font-semibold">支援 PNG, JPG, WEBP，建議尺寸 1280x800 px</p>
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
                </div>
              </div>
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
                        <span>章節影片網址 (嵌入網址，支援 Bunny.net / YouTube / 直接上傳影片檔)</span>
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
                            accept="video/*"
                            onChange={(e) => handleGenericUpload(e, `chapter-video-${index}`, (url) => handleChapterChange(index, 'video_url', url))}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Chapter Material File (Link or Upload) */}
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
