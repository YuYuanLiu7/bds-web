'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Image as ImageIcon, Video, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';

interface Chapter {
  id?: string;
  title: string;
  video_url: string;
  order_index: number;
}

interface Course {
  id?: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  category: string;
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
  const [formData, setFormData] = useState<Course>(course || {
    title: '',
    description: '',
    thumbnail_url: '',
    price: 0,
    category: '業務新手村',
    chapters: []
  });

  if (!isOpen) return null;

  const handleAddChapter = () => {
    setFormData({
      ...formData,
      chapters: [
        ...formData.chapters,
        { title: '', video_url: '', order_index: formData.chapters.length + 1 }
      ]
    });
  };

  const handleChapterChange = (index: number, field: keyof Chapter, value: string | number) => {
    const newChapters = [...formData.chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setFormData({ ...formData, chapters: newChapters });
  };

  const handleRemoveChapter = (index: number) => {
    const newChapters = formData.chapters.filter((_, i) => i !== index);
    setFormData({ ...formData, chapters: newChapters });
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

      // 儲存章節 (這部分邏輯可以再優化為一併處理)
      const savedCourse = await res.json();
      const courseId = formData.id || savedCourse.id;

      for (const chapter of formData.chapters) {
        await fetch('/api/admin/chapters', {
          method: chapter.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...chapter, course_id: courseId }),
        });
      }

      onClose();
      router.refresh();
    } catch (err) {
      alert('儲存出錯了，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">{formData.id ? '編輯課程' : '新增課程'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">課程名稱</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  placeholder="例如：半導體業務入門"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">課程分類</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white"
                >
                  <option>業務新手村</option>
                  <option>產業大講堂</option>
                  <option>圍爐夜話</option>
                  <option>讀書會</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">售價 (NT$)</label>
                <input 
                  type="number" 
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" /> 封面圖片網址
                </label>
                <input 
                  type="text" 
                  value={formData.thumbnail_url}
                  onChange={e => setFormData({...formData, thumbnail_url: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  placeholder="https://..."
                />
                {formData.thumbnail_url && (
                  <div className="mt-4 relative aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                    <Image src={formData.thumbnail_url} alt="Preview" fill className="object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100"></div>

          {/* Chapters Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Video className="w-5 h-5 mr-2 text-blue-500" /> 課程章節與影片
              </h3>
              <button 
                type="button"
                onClick={handleAddChapter}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> 新增章節
              </button>
            </div>

            <div className="space-y-4">
              {formData.chapters.map((chapter, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group transition hover:border-blue-200 hover:bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="章節名稱"
                      value={chapter.title}
                      onChange={e => handleChapterChange(index, 'title', e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                    />
                    <input 
                      type="text" 
                      placeholder="Bunny.net 或 YouTube 影片網址"
                      value={chapter.video_url}
                      onChange={e => handleChapterChange(index, 'video_url', e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveChapter(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.chapters.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 text-sm">
                  尚未新增任何章節，請點擊右上方「新增章節」。
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
            className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 transition"
          >
            取消
          </button>
          <button 
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-200 disabled:bg-gray-400 flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? '儲存中...' : '儲存課程'}
          </button>
        </div>
      </div>
    </div>
  );
}
