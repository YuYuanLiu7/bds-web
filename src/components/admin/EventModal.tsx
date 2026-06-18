'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Image as ImageIcon, Link2, Calendar, MapPin, Users, Award, Tag, Compass } from 'lucide-react';
import SafeImage from '@/components/SafeImage';

export interface Event {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  price_display: string;
  date: string;
  location: string;
  attendees: number;
  status: 'upcoming' | 'completed';
  type: string;
  category: string;
  registration_url: string;
}

interface EventModalProps {
  event?: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventModal({ event, isOpen, onClose }: EventModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    image_url: '',
    price: 0,
    price_display: '',
    date: '',
    location: '',
    attendees: 0,
    status: 'upcoming',
    type: '線上實戰營',
    category: '工作坊',
    registration_url: ''
  });

  // Helper: Convert any date to YYYY-MM-DDTHH:MM for datetime-local input
  const formatForInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setFormData({
          ...event,
          description: event.description || '',
          image_url: event.image_url || '',
          price_display: event.price_display || '',
          location: event.location || '',
          registration_url: event.registration_url || '',
          date: formatForInput(event.date)
        });
      } else {
        // Set standard tomorrow 14:00 as default
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);
        
        setFormData({
          title: '',
          description: '',
          image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
          price: 0,
          price_display: '',
          date: formatForInput(tomorrow.toISOString()),
          location: '線上直播 (Zoom)',
          attendees: 0,
          status: 'upcoming',
          type: '線上實戰營',
          category: '工作坊',
          registration_url: ''
        });
      }
    }
  }, [isOpen, event]);

  if (!isOpen) return null;

  // Handles image uploading to backend
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);
    const uploadData = new FormData();
    const fileExt = file.name.split('.').pop() || 'png';
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
        setFormData(prev => ({ ...prev, image_url: data.url }));
      }
    } catch (err) {
      console.error(err);
      alert('圖片上傳失敗：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/admin/events';
      const method = formData.id ? 'PUT' : 'POST';
      
      // Convert local input date string to standard ISO format
      const finalDate = formData.date ? new Date(formData.date).toISOString() : new Date().toISOString();

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: finalDate
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '儲存失敗');
      }

      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('儲存活動出錯：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans text-slate-700">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 select-none">
          <div>
            <h2 className="text-lg font-black text-slate-800">{formData.id ? '編輯活動' : '新增活動'}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">請填寫以下欄位以發佈或更新您的活動頁面。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Basic Info */}
            <div className="space-y-5">
              
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">活動名稱</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                  placeholder="例如：BDS 半導體業務核心思維實戰營"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">活動描述</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition min-h-[100px] text-xs font-semibold leading-relaxed"
                  placeholder="請輸入活動的精簡介紹，將顯示在活動列表卡片中..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                    <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    活動分類
                  </label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold"
                  >
                    <option>工作坊</option>
                    <option>線上讀書會</option>
                    <option>線下聚會</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                    <Compass className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    活動型態
                  </label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold"
                  >
                    <option>線上實戰營</option>
                    <option>線下沙龍</option>
                    <option>線上講座</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">售價 (NT$)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                    顯示價格
                    <span className="text-[10px] text-slate-400 font-medium ml-1.5">(選填，留空會自動格式化)</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.price_display}
                    onChange={e => setFormData({...formData, price_display: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                    placeholder="如：免費活動、NT$ 1,980"
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Date, Location, Image cover & link */}
            <div className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    活動日期與時間
                  </label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    已報名人數
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    value={formData.attendees}
                    onChange={e => setFormData({...formData, attendees: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    活動地點
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                    placeholder="線上直播 (Zoom) 或 線下地址"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                    <Award className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    活動狀態
                  </label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as Event['status']})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold"
                  >
                    <option value="upcoming">即將舉行</option>
                    <option value="completed">已結束</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                  <Link2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  外部報名/會議連結
                  <span className="text-[10px] text-slate-400 font-medium ml-1.5">(選填，如 Accupass、Zoom 等)</span>
                </label>
                <input 
                  type="text" 
                  value={formData.registration_url}
                  onChange={e => setFormData({...formData, registration_url: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                  placeholder="https://..."
                />
              </div>

              {/* Cover Image Upload Block */}
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center">
                    <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    活動封面圖片
                  </span>
                  
                  {/* File Uploader Button */}
                  <label className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer select-none">
                    {uploading ? '上傳中...' : '選擇本地圖片上傳'}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden" 
                    />
                  </label>
                </label>

                <input 
                  type="text" 
                  required
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                  placeholder="圖片連結，或使用上方上傳功能"
                />

                {formData.image_url && (
                  <div className="mt-3 relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-100 shadow-xs bg-slate-50 select-none group">
                    <SafeImage
                      src={formData.image_url}
                      alt="活動封面預覽"
                      className="w-full h-full object-cover"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
                        正在上傳並儲存圖片...
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition text-xs font-bold cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md active:scale-98 transition flex items-center cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {loading ? '儲存中...' : '儲存活動'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
