'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Save, Image as ImageIcon, Link2, Calendar, User, Eye, Tag, FileText, CheckCircle2,
  Bold, Heading2, Heading3, Palette, Link as LinkIcon, Sparkles,
  Globe, Lock, BookOpen, Pin, ChevronDown, ChevronUp,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Outdent, Indent, Quote, Code, Table, Video,
  Type, Italic, Underline, Strikethrough, Send, FilePlus, Edit3
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
  slug?: string;
  tags?: string;
  seo_title?: string;
  seo_description?: string;
  is_pinned?: boolean;
  visibility?: 'public' | 'members' | 'course_purchasers';
  required_course_ids?: string;
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
  const editorImageInputRef = useRef<HTMLInputElement>(null);

  // Advanced Editor States
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });
  const [currentHeading, setCurrentHeading] = useState('Paragraph');
  const [currentSize, setCurrentSize] = useState('字級');
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  const handleEditorChange = () => {
    if (editorRef.current) {
      setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
    }
  };

  const checkActiveFormats = () => {
    if (typeof window === 'undefined') return;
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
    });

    // Check current block tag
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let parent = selection.getRangeAt(0).startContainer.parentNode as HTMLElement | null;
      let heading = 'Paragraph';
      while (parent && parent !== editorRef.current) {
        if (parent && ['H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'PRE'].includes(parent.tagName)) {
          heading = parent.tagName;
          break;
        }
        parent = parent ? parent.parentNode as HTMLElement | null : null;
      }
      setCurrentHeading(heading);
    }
  };

  const execCmd = (command: string, value: string = '') => {
    if (isHtmlMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (command === 'formatBlock') {
      const cleanTag = value.replace(/[<>]/g, '').toUpperCase();
      try {
        document.execCommand(command, false, cleanTag);
      } catch (e) {
        document.execCommand(command, false, value);
      }
    } else {
      document.execCommand(command, false, value);
    }
    handleEditorChange();
    checkActiveFormats();
  };

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      setIsHtmlMode(false);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = formData.content || '';
        }
      }, 50);
    } else {
      if (editorRef.current) {
        setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
      }
      setIsHtmlMode(true);
    }
  };

  const handleLink = () => {
    const url = prompt('請輸入連結網址：', 'https://');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const handleImage = () => {
    if (editorImageInputRef.current) {
      editorImageInputRef.current.click();
    }
  };

  const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        execCmd('insertImage', data.url);
      }
    } catch (err: any) {
      console.error(err);
      alert('圖片上傳失敗：' + err.message);
    } finally {
      setUploading(false);
      if (editorImageInputRef.current) {
        editorImageInputRef.current.value = '';
      }
    }
  };

  const [courses, setCourses] = useState<any[]>([]);
  const [activePanel, setActivePanel] = useState<string>('publish');

  const [formData, setFormData] = useState<Article>({
    title: '',
    author: 'BDS 編輯部',
    date: '',
    views: 0,
    category: '商務開發',
    summary: '',
    content: '',
    image_url: '',
    status: 'published',
    slug: '',
    tags: '',
    seo_title: '',
    seo_description: '',
    is_pinned: false,
    visibility: 'public',
    required_course_ids: ''
  });

  const handleCourseToggle = (courseId: string) => {
    const currentIds = formData.required_course_ids ? formData.required_course_ids.split(',').filter(Boolean) : [];
    let newIds;
    if (currentIds.includes(courseId)) {
      newIds = currentIds.filter(id => id !== courseId);
    } else {
      newIds = [...currentIds, courseId];
    }
    setFormData(prev => ({ ...prev, required_course_ids: newIds.join(',') }));
  };

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
      setIsHtmlMode(false);
      // 獲取課程列表清單
      fetch('/api/admin/courses_full')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCourses(data);
          }
        })
        .catch(err => console.warn('無法載入課程清單：', err));

      if (article) {
        setFormData({
          ...article,
          author: article.author || 'BDS 編輯部',
          summary: article.summary || '',
          content: article.content || '',
          image_url: article.image_url || '',
          date: formatForInput(article.date),
          slug: article.slug || '',
          tags: article.tags || '',
          seo_title: article.seo_title || '',
          seo_description: article.seo_description || '',
          is_pinned: !!article.is_pinned,
          visibility: article.visibility || 'public',
          required_course_ids: article.required_course_ids || ''
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
          status: 'published',
          slug: '',
          tags: '',
          seo_title: '',
          seo_description: '',
          is_pinned: false,
          visibility: 'public',
          required_course_ids: ''
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
      <style>{`
        .wysiwyg-editor {
          font-size: 14px !important;
          line-height: 1.7 !important;
          color: #334155 !important;
        }
        .wysiwyg-editor p {
          margin-bottom: 0.85rem !important;
        }
        .wysiwyg-editor h1 {
          font-size: 1.85rem !important;
          font-weight: 800 !important;
          color: #1e293b !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.6rem !important;
          display: block !important;
          line-height: 1.3 !important;
        }
        .wysiwyg-editor h2 {
          font-size: 1.45rem !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
          display: block !important;
          line-height: 1.4 !important;
        }
        .wysiwyg-editor h3 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: #334155 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.4rem !important;
          display: block !important;
        }
        .wysiwyg-editor h4 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          color: #475569 !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.3rem !important;
          display: block !important;
        }
        .wysiwyg-editor ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-bottom: 0.85rem !important;
        }
        .wysiwyg-editor ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-bottom: 0.85rem !important;
        }
        .wysiwyg-editor blockquote {
          border-left: 4px solid #818cf8 !important;
          padding-left: 1rem !important;
          color: #64748b !important;
          font-style: italic !important;
          margin: 1.25rem 0 !important;
          background-color: #f8fafc !important;
          padding-top: 0.6rem !important;
          padding-bottom: 0.6rem !important;
          border-radius: 0 0.375rem 0.375rem 0 !important;
        }
        .wysiwyg-editor pre {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          padding: 1rem !important;
          border-radius: 0.5rem !important;
          font-family: monospace !important;
          font-size: 12px !important;
          overflow-x: auto !important;
          margin: 1.25rem 0 !important;
        }
        .wysiwyg-editor img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0.75rem !important;
          margin: 1.25rem 0 !important;
          display: block !important;
        }
        .wysiwyg-editor table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 1.25rem 0 !important;
        }
        .wysiwyg-editor th, .wysiwyg-editor td {
          border: 1px solid #e2e8f0 !important;
          padding: 10px 14px !important;
          text-align: left !important;
        }
      `}</style>
      
      <input 
        type="file" 
        ref={editorImageInputRef}
        accept="image/*"
        onChange={handleEditorImageUpload}
        className="hidden"
      />
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 select-none">
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center">
              {formData.id ? (
                <Edit3 className="w-5 h-5 mr-2 text-indigo-600" />
              ) : (
                <FilePlus className="w-5 h-5 mr-2 text-indigo-600" />
              )}
              {formData.id ? '編輯文章' : '撰寫新文章'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">發布產業洞察、專業觀點報告與學員限定文章。</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition text-gray-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
          
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Editor & Cover (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">文章標題</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-sm font-bold text-slate-800 placeholder:text-slate-300"
                    placeholder="例如：半導體供應鏈重構：業務經理必須掌握的轉型思維與契機"
                  />
                </div>

                {/* WYSIWYG Content Area */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    文章內文 (所見即所得富文本編輯器)
                  </label>
                  
                  <div className="flex flex-col w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white">
                    {/* Toolbar */}
                    <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2.5 flex flex-col gap-2.5 select-none text-xs font-semibold">
                      {/* Row 1: Basic Formats & Blocks */}
                      <div className="flex items-center space-x-1 flex-wrap gap-y-1.5">
                        
                        {/* Heading Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setShowHeadingDropdown(!showHeadingDropdown);
                              setShowListDropdown(false);
                              setShowSizeDropdown(false);
                            }}
                            className="flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-xs font-black text-slate-700 bg-white cursor-pointer transition min-w-[70px] justify-between"
                          >
                            <span>
                              {currentHeading === 'Paragraph' ? '內文' : currentHeading}
                            </span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </button>
                          {showHeadingDropdown && (
                            <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 font-bold text-xs">
                              {[
                                { label: '一般內文 (P)', value: '<p>', name: 'Paragraph' },
                                { label: '標題一 (H1)', value: '<h1>', name: 'H1' },
                                { label: '標題二 (H2)', value: '<h2>', name: 'H2' },
                                { label: '標題三 (H3)', value: '<h3>', name: 'H3' },
                                { label: '標題四 (H4)', value: '<h4>', name: 'H4' },
                              ].map(item => (
                                <button
                                  key={item.name}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    execCmd('formatBlock', item.value);
                                    setCurrentHeading(item.name);
                                    setShowHeadingDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* List Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setShowListDropdown(!showListDropdown);
                              setShowHeadingDropdown(false);
                              setShowSizeDropdown(false);
                            }}
                            className="flex items-center px-2 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer bg-white"
                          >
                            <List className="w-3.5 h-3.5" />
                            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
                          </button>
                          {showListDropdown && (
                            <div className="absolute left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 font-bold text-xs">
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  execCmd('insertUnorderedList');
                                  setShowListDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center"
                              >
                                <List className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                項目列表
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  execCmd('insertOrderedList');
                                  setShowListDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center"
                              >
                                <ListOrdered className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                編號列表
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="w-px h-4 bg-slate-200 mx-1"></div>

                        {/* Bold */}
                        <button
                          type="button"
                          title="粗體"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('bold')}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeFormats.bold ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>

                        {/* Italic */}
                        <button
                          type="button"
                          title="斜體"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('italic')}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeFormats.italic ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>

                        {/* Underline */}
                        <button
                          type="button"
                          title="底線"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('underline')}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeFormats.underline ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        >
                          <Underline className="w-3.5 h-3.5" />
                        </button>

                        {/* Strikethrough */}
                        <button
                          type="button"
                          title="刪除線"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('strikeThrough')}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeFormats.strikeThrough ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                        </button>

                        {/* Link */}
                        <button
                          type="button"
                          title="插入連結"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleLink}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-slate-200 mx-1"></div>

                        {/* Alignments */}
                        <button
                          type="button"
                          title="靠左對齊"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('justifyLeft')}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeFormats.justifyLeft ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          title="置中對齊"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('justifyCenter')}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeFormats.justifyCenter ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          title="靠右對齊"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('justifyRight')}
                          className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeFormats.justifyRight ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-slate-200 mx-1"></div>

                        {/* Indents */}
                        <button
                          type="button"
                          title="減少縮排"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('outdent')}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
                        >
                          <Outdent className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          title="增加縮排"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('indent')}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
                        >
                          <Indent className="w-3.5 h-3.5" />
                        </button>

                        {/* Quote */}
                        <button
                          type="button"
                          title="引用段落"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('formatBlock', '<blockquote>')}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
                        >
                          <Quote className="w-3.5 h-3.5" />
                        </button>

                        {/* Code block */}
                        <button
                          type="button"
                          title="程式碼區塊"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => execCmd('formatBlock', '<pre>')}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Row 2: Advanced Size, Color & Medias */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
                          
                          {/* Font Size Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setShowSizeDropdown(!showSizeDropdown);
                                setShowHeadingDropdown(false);
                                setShowListDropdown(false);
                              }}
                              className="flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-xs font-black text-slate-700 bg-white cursor-pointer transition min-w-[70px] justify-between"
                            >
                              <span>{currentSize}</span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>
                            {showSizeDropdown && (
                              <div className="absolute left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 font-bold text-xs">
                                {[
                                  { label: '小 (12px)', value: '2', name: '12px' },
                                  { label: '中 (14px)', value: '3', name: '14px' },
                                  { label: '大 (18px)', value: '4', name: '18px' },
                                  { label: '超大 (24px)', value: '5', name: '24px' },
                                  { label: '巨大 (32px)', value: '6', name: '32px' },
                                ].map(item => (
                                  <button
                                    key={item.name}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      execCmd('fontSize', item.value);
                                      setCurrentSize(item.name);
                                      setShowSizeDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Text Color (A) */}
                          <div className="relative flex items-center border border-slate-200 rounded-lg p-1 bg-white hover:bg-slate-50 transition cursor-pointer select-none">
                            <span className="text-[10px] font-black text-slate-500 px-1">A</span>
                            <input 
                              type="color" 
                              title="文字顏色"
                              onMouseDown={(e) => e.preventDefault()}
                              onChange={(e) => execCmd('foreColor', e.target.value)}
                              className="w-5 h-5 p-0 border-0 rounded cursor-pointer outline-none bg-transparent"
                            />
                          </div>

                          {/* Background Color (Highlight) */}
                          <div className="relative flex items-center border border-slate-200 rounded-lg p-1 bg-white hover:bg-slate-50 transition cursor-pointer select-none">
                            <span className="text-[10px] font-black bg-yellow-200 text-slate-700 px-1 rounded">ab</span>
                            <input 
                              type="color" 
                              title="文字背景高亮"
                              onMouseDown={(e) => e.preventDefault()}
                              onChange={(e) => execCmd('hiliteColor', e.target.value)}
                              className="w-5 h-5 p-0 border-0 rounded cursor-pointer outline-none bg-transparent"
                            />
                          </div>

                          <div className="w-px h-4 bg-slate-200 mx-1"></div>

                          {/* Image */}
                          <button
                            type="button"
                            title="插入圖片網址"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleImage}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer flex items-center justify-center bg-white"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Video */}
                          <button
                            type="button"
                            title="插入影片"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const url = prompt('請輸入影片網址（支援 YouTube 或 Vimeo 連結）：', 'https://');
                              if (url) {
                                let embedUrl = url;
                                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                                  const match = url.match(regExp);
                                  if (match && match[2].length === 11) {
                                    embedUrl = `https://www.youtube.com/embed/${match[2]}`;
                                  }
                                }
                                const iframeHtml = `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allowfullscreen class="w-full aspect-video rounded-xl my-4"></iframe>`;
                                execCmd('insertHTML', iframeHtml);
                              }
                            }}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer flex items-center justify-center bg-white"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </button>

                          {/* Table */}
                          <button
                            type="button"
                            title="插入表格"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const rows = parseInt(prompt('請輸入行數（Rows）：', '3') || '3');
                              const cols = parseInt(prompt('請輸入列數（Cols）：', '3') || '3');
                              if (rows > 0 && cols > 0) {
                                let tableHtml = '<table class="min-w-full border-collapse border border-slate-200 my-4 text-xs font-semibold">';
                                for (let i = 0; i < rows; i++) {
                                  tableHtml += '<tr>';
                                  for (let j = 0; j < cols; j++) {
                                    tableHtml += '<td class="border border-slate-200 p-2 text-slate-600">單格內容</td>';
                                  }
                                  tableHtml += '</tr>';
                                }
                                tableHtml += '</table>';
                                execCmd('insertHTML', tableHtml);
                              }
                            }}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer flex items-center justify-center bg-white"
                          >
                            <Table className="w-3.5 h-3.5" />
                          </button>

                        </div>

                        {/* HTML code mode toggle */}
                        <button
                          type="button"
                          title="HTML 原始碼模式"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={toggleHtmlMode}
                          className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${isHtmlMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </div>

                    {/* Rich text body area or HTML code view */}
                    {isHtmlMode ? (
                      <textarea
                        value={formData.content}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, content: e.target.value }));
                        }}
                        className="w-full px-5 py-4 outline-none font-mono text-xs bg-slate-900 text-slate-100 min-h-[350px] max-h-[450px] focus:ring-0 resize-none border-0"
                        placeholder="請輸入 HTML 原始碼..."
                      />
                    ) : (
                      <div 
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorChange}
                        onKeyUp={checkActiveFormats}
                        onMouseUp={checkActiveFormats}
                        onFocus={checkActiveFormats}
                        className="w-full px-5 py-4 outline-none transition min-h-[350px] max-h-[450px] overflow-y-auto bg-white wysiwyg-editor empty:before:content-[attr(data-placeholder)] before:text-slate-300"
                        style={{ outline: 'none' }}
                        data-placeholder="在這裡以所見即所得的方式撰寫您的專欄內容，支援顏色、粗體、連結、圖片與結構標題..."
                      />
                    )}
                  </div>
                </div>

                {/* Excerpt / Summary */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">文章簡介 (顯示於列表卡片)</label>
                  <textarea 
                    value={formData.summary}
                    onChange={e => setFormData({...formData, summary: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition min-h-[70px] text-xs font-semibold leading-relaxed text-slate-600 placeholder:text-slate-300"
                    placeholder="請輸入 100 字左右的文章大綱簡介，這將會顯示在文章卡片列表上，對於搜尋引擎抓取也非常重要..."
                  />
                </div>

                {/* Featured Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center">
                        <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        封面精選圖片
                      </span>
                      <label className="text-[9px] text-indigo-600 hover:text-indigo-800 font-black cursor-pointer select-none">
                        {uploading ? '圖片上傳中...' : '📸 上傳檔案'}
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
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-600 placeholder:text-slate-300"
                      placeholder="圖片 URL 路徑"
                    />
                  </div>

                  <div>
                    {formData.image_url && (
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-50 select-none">
                        <img
                          src={formData.image_url}
                          alt="封面圖片預覽"
                          className="w-full h-full object-cover"
                          onError={(e) => { const t = e.currentTarget; if (!t.src.endsWith('/images/course-placeholder.svg')) t.src = '/images/course-placeholder.svg'; }}
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

              {/* Right Column: Settings Panel (lg:col-span-4) */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Panel 1: 發布設定 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActivePanel(activePanel === 'publish' ? '' : 'publish')}
                    className="w-full px-5 py-3.5 bg-slate-100/50 flex justify-between items-center border-b border-slate-200/80 font-black text-xs text-slate-700 select-none cursor-pointer"
                  >
                    <span className="flex items-center">
                      <Send className="w-4 h-4 mr-2 text-indigo-500" />
                      發布與置頂設定
                    </span>
                    {activePanel === 'publish' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {activePanel === 'publish' && (
                    <div className="p-5 space-y-4 border-t border-white/50 bg-white">
                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          發布狀態
                        </label>
                        <select 
                          value={formData.status}
                          onChange={e => setFormData({...formData, status: e.target.value as any})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold text-slate-700"
                        >
                          <option value="published">🟢 立即公開發布</option>
                          <option value="draft">🟡 儲存為草稿</option>
                        </select>
                      </div>

                      {/* Date */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          發佈時間 (排程)
                        </label>
                        <input 
                          type="datetime-local" 
                          required
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-600"
                        />
                      </div>

                      {/* Author */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          文章作者
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.author}
                          onChange={e => setFormData({...formData, author: e.target.value})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-600"
                          placeholder="作者名稱"
                        />
                      </div>

                      {/* Views */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          初始模擬觀看次數
                        </label>
                        <input 
                          type="number" 
                          min={0}
                          value={formData.views}
                          onChange={e => setFormData({...formData, views: parseInt(e.target.value) || 0})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-600"
                        />
                      </div>

                      {/* Pinned Switch */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 select-none">
                        <span className="text-xs font-bold text-slate-600 flex items-center">
                          <Pin className="w-3.5 h-3.5 mr-1 text-indigo-500 rotate-45" />
                          將此文章置頂顯示
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!formData.is_pinned}
                            onChange={e => setFormData({...formData, is_pinned: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                    </div>
                  )}
                </div>

                {/* Panel 2: 分類與標籤 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActivePanel(activePanel === 'meta' ? '' : 'meta')}
                    className="w-full px-5 py-3.5 bg-slate-100/50 flex justify-between items-center border-b border-slate-200/80 font-black text-xs text-slate-700 select-none cursor-pointer"
                  >
                    <span className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-indigo-500" />
                      分類與標籤設定
                    </span>
                    {activePanel === 'meta' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {activePanel === 'meta' && (
                    <div className="p-5 space-y-4 border-t border-white/50 bg-white">
                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                          <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          選擇文章分類
                        </label>
                        <select 
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold text-slate-700"
                        >
                          <option>商務開發</option>
                          <option>半導體產業</option>
                          <option>職涯成長</option>
                          <option>活動公告</option>
                        </select>
                      </div>

                      {/* Tags */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          標籤 Tags (多個標籤請用英文逗號隔開)
                        </label>
                        <input 
                          type="text" 
                          value={formData.tags || ''}
                          onChange={e => setFormData({...formData, tags: e.target.value})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-600 placeholder:text-slate-300"
                          placeholder="例如：BD, 談判技巧, 科技業"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel 3: 閱讀權限與解鎖 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActivePanel(activePanel === 'visibility' ? '' : 'visibility')}
                    className="w-full px-5 py-3.5 bg-slate-100/50 flex justify-between items-center border-b border-slate-200/80 font-black text-xs text-slate-700 select-none cursor-pointer"
                  >
                    <span className="flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-indigo-500" />
                      閱讀權限與付費鎖定
                    </span>
                    {activePanel === 'visibility' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {activePanel === 'visibility' && (
                    <div className="p-5 space-y-4 border-t border-white/50 bg-white">
                      {/* Access Level Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                          <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          誰可以閱讀這篇文章？
                        </label>
                        <select 
                          value={formData.visibility || 'public'}
                          onChange={e => setFormData({...formData, visibility: e.target.value as any})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition bg-white text-xs font-semibold text-slate-700"
                        >
                          <option value="public">🔓 所有人免費公開閱讀</option>
                          <option value="members">👥 僅限登入會員閱讀</option>
                          <option value="course_purchasers">🎓 限定特定課程學員解鎖</option>
                        </select>
                      </div>

                      {/* Course Purchaser checklist (Dynamically show when selected) */}
                      {formData.visibility === 'course_purchasers' && (
                        <div className="space-y-2 border-t border-slate-100 pt-3 select-none">
                          <label className="block text-[9px] font-black text-indigo-600 uppercase tracking-wider flex items-center">
                            <BookOpen className="w-3.5 h-3.5 mr-1" />
                            勾選可解鎖此文章的 BDS 課程：
                          </label>
                          
                          {courses.length > 0 ? (
                            <div className="max-h-[150px] overflow-y-auto space-y-2.5 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                              {courses.map(course => {
                                const isChecked = formData.required_course_ids ? formData.required_course_ids.split(',').filter(Boolean).includes(course.id) : false;
                                return (
                                  <label key={course.id} className="flex items-start space-x-2.5 text-xs text-slate-600 font-bold hover:text-slate-800 cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleCourseToggle(course.id)}
                                      className="mt-0.5 w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="flex-1 leading-normal text-[11px] truncate" title={course.title}>
                                      {course.title}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic py-2 text-center">
                              尚未建立任何課程，請先至課程管理新增課程。
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Panel 4: 自訂網址與 SEO */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActivePanel(activePanel === 'seo' ? '' : 'seo')}
                    className="w-full px-5 py-3.5 bg-slate-100/50 flex justify-between items-center border-b border-slate-200/80 font-black text-xs text-slate-700 select-none cursor-pointer"
                  >
                    <span className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-indigo-500" />
                      自訂網址與 SEO 設定
                    </span>
                    {activePanel === 'seo' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {activePanel === 'seo' && (
                    <div className="p-5 space-y-4 border-t border-white/50 bg-white">
                      {/* Slug */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          自訂網址路徑 (Slug)
                        </label>
                        <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition">
                          <span className="px-3 bg-slate-100 text-[10px] font-bold text-slate-400 border-r border-slate-200 flex items-center">
                            /articles/
                          </span>
                          <input 
                            type="text" 
                            value={formData.slug || ''}
                            onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-')})}
                            className="w-full px-3 py-1.8 text-xs font-semibold text-slate-600 bg-white outline-none"
                            placeholder="my-post-link"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 leading-normal font-medium">限輸入小寫英文、數字與底線。留空將使用文章 ID 作為路徑。</p>
                      </div>

                      {/* SEO Title */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          SEO 搜尋引擎標題 (SEO Title)
                        </label>
                        <input 
                          type="text" 
                          value={formData.seo_title || ''}
                          onChange={e => setFormData({...formData, seo_title: e.target.value})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition text-xs font-semibold text-slate-600 placeholder:text-slate-300"
                          placeholder="預設將使用文章標題"
                        />
                      </div>

                      {/* SEO Description */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          SEO 搜尋引擎描述 (SEO Description)
                        </label>
                        <textarea 
                          value={formData.seo_description || ''}
                          onChange={e => setFormData({...formData, seo_description: e.target.value})}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition min-h-[50px] text-xs font-semibold leading-relaxed text-slate-600 placeholder:text-slate-300"
                          placeholder="預設將使用文章簡介"
                        />
                      </div>

                      {/* Google Search Snippet Preview */}
                      <div className="border-t border-slate-100 pt-3 select-none text-left">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">
                          Google 搜尋結果即時模擬預覽：
                        </label>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <div className="text-[10px] text-slate-400 font-medium truncate flex items-center">
                            <span>https://bds.fu-notes.com</span>
                            <span className="text-slate-300 mx-1">›</span>
                            <span>articles</span>
                            <span className="text-slate-300 mx-1">›</span>
                            <span className="text-indigo-600 font-semibold">{formData.slug || 'untitled'}</span>
                          </div>
                          <div className="text-indigo-700 text-xs font-semibold leading-normal hover:underline line-clamp-1">
                            {formData.seo_title || formData.title || '請輸入文章標題...'}
                          </div>
                          <div className="text-[9px] text-slate-500 font-medium leading-normal line-clamp-2">
                            {formData.seo_description || formData.summary || '文章大綱簡介，可用來吸引搜尋讀者點擊...'}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 px-8 py-5 border-t border-slate-100 bg-slate-50/20 select-none font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition text-xs font-bold cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md active:scale-98 transition flex items-center cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {loading ? '儲存中...' : (formData.id ? '儲存修改' : '發表文章')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
