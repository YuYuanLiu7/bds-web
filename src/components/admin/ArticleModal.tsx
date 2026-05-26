'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Save, Image as ImageIcon, Link2, Calendar, User, Eye, Tag, FileText, CheckCircle2,
  Bold, Heading2, Heading3, Palette, Link as LinkIcon, Sparkles
} from 'lucide-react';

interface Article {
  id?: string;
  title: string;
  author: string;
  date: string;
  views: number;
  category: string;
  summary: string;
  content: string;
  image_url: string;
  status: 'published' | 'draft';
}

interface ArticleModalProps {
  article?: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArticleModal({ article, isOpen, onClose }: ArticleModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleEditorChange = () => {
    if (editorRef.current) {
      setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
    }
  };

  const execCmd = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleEditorChange();
  };

  const handleLink = () => {
    const url = prompt('請輸入連結網址：', 'https://');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const handleImage = () => {
    const url = prompt('請輸入圖片網址：', 'https://');
    if (url) {
      execCmd('insertImage', url);
    }
  };
  const [formData, setFormData] = useState<Article>({
    title: '',
    author: 'BDS 編輯部',
    date: '',
    views: 0,
    category: '商務開發',
    summary: '',
    content: '',
    image_url: '',
    status: 'published'
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
      if (article) {
        setFormData({
          ...article,
          author: article.author || 'BDS 編輯部',
          summary: article.summary || '',
          content: article.content || '',
          image_url: article.image_url || '',
          date: formatForInput(article.date)
        });
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = article.content || '';
          }
        }, 50);
      } else {
        const now = new Date();
        setFormData({
          title: '',
          author: 'BDS 編輯部',
          date: formatForInput(now.toISOString()),
          views: 0,
          category: '商務開發',
          summary: '',
          content: '',
          image_url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=800',
          status: 'published'
        });
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
          }
        }, 50);
      }
    }
  }, [isOpen, article]);

  if (!isOpen) return null;

  // Handles image uploading to backend
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

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
    } catch (err: any) {
      console.error(err);
      alert('圖片上傳失敗：' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/admin/articles';
      const method = formData.id ? 'PUT' : 'POST';
      
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
    } catch (err: any) {
      console.error(err);
      alert('儲存文章出錯：' + err.message);
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
            <h2 className="text-lg font-black text-slate-800">{formData.id ? '編輯文章' : '撰寫新文章'}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">發布產業洞察、專業觀點或專欄網誌。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-gray-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* Main Info */}
          <div className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Title Input */}
              <div className="md:col-span-2 space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">文章標題</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                    placeholder="輸入文章標題，例如：半導體供應鏈重構..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      作者名稱
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.author}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                      placeholder="作者名稱，如 BDS 編輯部"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                      <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      文章分類
                    </label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold"
                    >
                      <option>商務開發</option>
                      <option>半導體產業</option>
                      <option>職涯成長</option>
                      <option>活動公告</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      發佈時間
                    </label>
                    <input 
                      type="datetime-local" 
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2.2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      模擬瀏覽次數
                    </label>
                    <input 
                      type="number" 
                      min={0}
                      value={formData.views}
                      onChange={e => setFormData({...formData, views: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="md:col-span-1 space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center">
                      <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      封面圖片
                    </span>
                    <label className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer select-none">
                      {uploading ? '上傳中...' : '上傳圖片'}
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
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-[11px] font-semibold"
                    placeholder="圖片網址"
                  />

                  {formData.image_url && (
                    <div className="mt-2.5 relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-100 shadow-xs bg-slate-50 select-none">
                      <img 
                        src={formData.image_url} 
                        alt="Cover Preview" 
                        className="w-full h-full object-cover"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-[10px] font-bold">
                          上傳中...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Summary */}
              <div className="md:col-span-3">
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">文章簡介</label>
                <textarea 
                  value={formData.summary}
                  onChange={e => setFormData({...formData, summary: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition min-h-[60px] text-xs font-semibold leading-relaxed"
                  placeholder="請輸入 100 字左右的文章大綱簡介，這將會顯示在文章卡片列表上..."
                />
              </div>

              {/* Status */}
              <div className="md:col-span-1">
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  發布狀態
                </label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold"
                >
                  <option value="published">發布文章</option>
                  <option value="draft">儲存為草稿</option>
                </select>
              </div>

              {/* Content Block with Kaik-style WYSIWYG Rich Text Toolbar */}
              <div className="md:col-span-3">
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  文章內文 (所見即所得富文本編輯器)
                </label>
                
                <div className="flex flex-col w-full">
                  {/* Toolbar */}
                  <div className="bg-slate-50 border border-slate-200 border-b-0 rounded-t-2xl px-3 py-2 flex items-center justify-between flex-wrap gap-2 select-none">
                    <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                      
                      {/* Bold */}
                      <button
                        type="button"
                        title="粗體"
                        onClick={() => execCmd('bold')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-3 bg-slate-200 mx-1"></div>

                      {/* Heading 2 */}
                      <button
                        type="button"
                        title="標題二"
                        onClick={() => execCmd('formatBlock', '<h2>')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center font-bold text-xs"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Heading 3 */}
                      <button
                        type="button"
                        title="標題三"
                        onClick={() => execCmd('formatBlock', '<h3>')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center font-bold text-xs"
                      >
                        <Heading3 className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-3 bg-slate-200 mx-1"></div>

                      {/* Link */}
                      <button
                        type="button"
                        title="插入連結"
                        onClick={handleLink}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* Image */}
                      <button
                        type="button"
                        title="插入圖片"
                        onClick={handleImage}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-3 bg-slate-200 mx-1"></div>

                      {/* Color Palette Buttons */}
                      <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg py-0.5 px-2">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center">
                          <Palette className="w-3 h-3 mr-1 text-slate-400" />
                          顏色:
                        </span>
                        {[
                          { color: '#e11d48', label: '熱情紅' },
                          { color: '#2563eb', label: '商務藍' },
                          { color: '#16a34a', label: '森林綠' },
                          { color: '#d97706', label: '琥珀黃' },
                          { color: '#7c3aed', label: '極光紫' },
                        ].map(item => (
                          <button
                            key={item.color}
                            type="button"
                            title={item.label}
                            onClick={() => execCmd('foreColor', item.color)}
                            className="w-3.5 h-3.5 rounded-full border border-slate-200 transition transform hover:scale-115 active:scale-95 cursor-pointer"
                            style={{ backgroundColor: item.color }}
                          />
                        ))}
                        {/* Custom Color Input */}
                        <div className="relative flex items-center pl-1 border-l border-slate-100">
                          <input 
                            type="color" 
                            title="自訂顏色"
                            onChange={(e) => execCmd('foreColor', e.target.value)}
                            className="w-3.5 h-3.5 p-0 border-0 rounded cursor-pointer outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-[9px] font-semibold text-slate-400 flex items-center hidden sm:flex">
                      <Sparkles className="w-3 h-3 mr-1 text-indigo-500" />
                      所見即所得：選取文字後即可直接變色或加粗
                    </div>
                  </div>

                  {/* WYSIWYG ContentEditable Area */}
                  <div 
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorChange}
                    className="w-full px-5 py-4 border border-slate-200 border-t-0 rounded-b-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition min-h-[350px] text-xs font-semibold leading-relaxed overflow-y-auto bg-white prose max-w-none prose-headings:font-black prose-h2:text-xl prose-h3:text-lg prose-strong:font-black empty:before:content-[attr(data-placeholder)] before:text-slate-400"
                    style={{ outline: 'none' }}
                    data-placeholder="在此處開始撰寫您的部落格專欄文章，支援所見即所得富文本編輯（粗體、大小標、顏色）..."
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 select-none">
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
              {loading ? '儲存中...' : '發布文章'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
