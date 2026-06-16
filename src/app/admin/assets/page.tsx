'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Search, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  File,
  Trash2, 
  Copy, 
  Check, 
  ExternalLink,
  Loader2,
  X,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Download,
  UploadCloud,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAssetsPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // all, image, video, document, other
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // list or grid
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10, 20, 50

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media items from backend
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setMedia(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load media files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Upload file logic
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    const fileExt = file.name.split('.').pop() || 'png';
    const safeName = `upload-${Date.now()}.${fileExt}`;
    formData.append('file', file, safeName);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '上傳失敗');
    }
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Support multi-file upload sequentially
      for (let i = 0; i < files.length; i++) {
        let file = files[i];

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

        await uploadFile(file);
      }
      showToast(`已成功上傳 ${files.length} 個檔案至素材庫！`);
      fetchMedia(); // Refresh list
    } catch (err: any) {
      console.error("Upload file error:", err);
      alert('上傳失敗：' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // clear input value
      }
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = e.dataTransfer.files;
      setUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          await uploadFile(files[i]);
        }
        showToast(`已成功上傳 ${files.length} 個檔案至素材庫！`);
        fetchMedia(); // Refresh list
      } catch (err: any) {
        console.error("Upload drop error:", err);
        alert('上傳失敗：' + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  // Delete handler
  const handleDelete = async (item: any) => {
    if (confirm(`確定要永久刪除素材「${item.name}」嗎？這將會從雲端/伺服器中永久移除此檔案，使用此連結之網頁可能將失效。`)) {
      try {
        const res = await fetch(`/api/admin/media?name=${encodeURIComponent(item.name)}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          showToast('檔案已成功刪除！');
          setMedia(prev => prev.filter(m => m.id !== item.id));
          setSelectedIds(prev => prev.filter(id => id !== item.id));
        } else {
          const err = await res.json();
          alert('刪除失敗：' + (err.error || '未知錯誤'));
        }
      } catch (err) {
        console.error("Delete file error:", err);
        alert('刪除發生錯誤，請重試。');
      }
    }
  };

  // Bulk Delete handler
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) return;

    if (confirm(`確定要永久刪除這 ${count} 個素材檔案嗎？這將會從雲端/伺服器中永久移除這些檔案，使用這些連結之網頁可能將失效。`)) {
      setLoading(true);
      try {
        let successCount = 0;
        let failCount = 0;

        // Delete sequentially using Promise.all to run concurrently
        const deletePromises = selectedIds.map(async (id) => {
          const item = media.find(m => m.id === id);
          if (!item) return;

          try {
            const res = await fetch(`/api/admin/media?name=${encodeURIComponent(item.name)}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (e) {
            failCount++;
          }
        });

        await Promise.all(deletePromises);
        
        showToast(`批量刪除完成！成功：${successCount} 個，失敗：${failCount} 個。`);
        fetchMedia(); // Refresh list
        setSelectedIds([]);
      } catch (err) {
        console.error("Bulk delete error:", err);
        alert('批量刪除時發生錯誤。');
      } finally {
        setLoading(false);
      }
    }
  };

  // Copy link to clipboard
  const handleCopyLink = (item: any) => {
    let fullUrl = item.url;
    if (fullUrl.startsWith('/')) {
      fullUrl = window.location.origin + fullUrl;
    }

    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedMedia.map(m => m.id);
      setSelectedIds(prev => {
        const otherIds = prev.filter(id => !pageIds.includes(id));
        return [...otherIds, ...pageIds];
      });
    } else {
      const pageIds = paginatedMedia.map(m => m.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  // Filter & Search Logic
  const filteredMedia = media.filter(m => {
    // 1. Search Query filter
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Type filter
    if (selectedType === 'all') return matchesSearch;
    if (selectedType === 'image') return matchesSearch && m.type === 'image';
    if (selectedType === 'video') return matchesSearch && m.type === 'video';
    if (selectedType === 'document') return matchesSearch && m.type === 'document';
    if (selectedType === 'other') return matchesSearch && m.type !== 'image' && m.type !== 'video' && m.type !== 'document';
    
    return matchesSearch;
  });

  // Pagination Logic
  const totalItems = filteredMedia.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  
  // Adjust current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedMedia = filteredMedia.slice(startIndex, startIndex + pageSize);

  // Check if all items on the current page are selected
  const isAllPageItemsSelected = paginatedMedia.length > 0 && paginatedMedia.every(m => selectedIds.includes(m.id));

  // 將檔案類型轉為中文顯示
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'image':
        return '圖片';
      case 'video':
        return '影片';
      case 'document':
        return '文件';
      default:
        return '其他';
    }
  };

  // File type helper
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-indigo-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-sky-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-amber-500" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <FolderOpen className="w-6 h-6 mr-2 text-indigo-600" />
            素材庫
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            集中上傳與管理您的課程封面圖、簡報講義檔案、Banner 及輔助媒體素材。
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> 上傳中...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1.5" /> 上傳檔案
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-xl font-bold animate-in fade-in duration-200 shadow-sm flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {toastMsg}
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 transition flex flex-col items-center justify-center text-center gap-2 ${
          dragActive 
            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' 
            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
        }`}
      >
        <UploadCloud className={`w-10 h-10 ${dragActive ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
        <div>
          <span className="font-bold text-xs">將檔案拖曳至此處</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">支援多檔案上傳，單一檔案上限為 5GB</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Left Side: Type Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: '全部' },
            { id: 'image', label: '圖片' },
            { id: 'video', label: '影片' },
            { id: 'document', label: '文件' },
            { id: 'other', label: '其他' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedType(tab.id);
                setCurrentPage(1); // reset page
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Side: Search & View Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // reset page
              }}
              placeholder="搜尋檔案名稱"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="列表檢視"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="網格檢視"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 px-5 py-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-800">
            <AlertCircle className="w-4.5 h-4.5 text-indigo-600" />
            <span>已選取 {selectedIds.length} 個項目</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              取消選擇
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              批量刪除
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-20 text-center text-slate-400 italic font-semibold flex flex-col items-center justify-center space-y-2 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span>載入媒體素材檔案中...</span>
        </div>
      ) : paginatedMedia.length > 0 ? (
        viewMode === 'list' ? (
          /* List View (Table) */
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-5 w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={isAllPageItemsSelected}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4">檔案名稱</th>
                    <th className="py-4 px-4 w-28 text-right">檔案大小</th>
                    <th className="py-4 px-4 w-28 text-center">類型</th>
                    <th className="py-4 px-4 w-36 text-center">上傳日期</th>
                    <th className="py-4 px-5 w-36 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {paginatedMedia.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-slate-50/50 transition ${
                          isSelected ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-5 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        
                        {/* Preview & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3 max-w-lg md:max-w-xl">
                            {/* Icon / Mini-Thumbnail */}
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.type === 'image' && item.url ? (
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                getFileIcon(item.type)
                              )}
                            </div>
                            {/* Text */}
                            <div className="overflow-hidden">
                              <span 
                                onClick={() => handleCopyLink(item)}
                                className="block font-bold text-slate-800 hover:text-indigo-600 cursor-pointer truncate"
                                title="點選複製網址"
                              >
                                {item.name}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 block mt-0.5 select-all">
                                {item.url}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Size */}
                        <td className="py-3 px-4 text-right text-slate-600 font-bold">
                          {item.size}
                        </td>

                        {/* Type Tag */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                            item.type === 'image' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            item.type === 'video' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                            item.type === 'document' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                            {getTypeLabel(item.type)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-center text-slate-400">
                          {item.date}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Link */}
                            <button
                              onClick={() => handleCopyLink(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition active:scale-95 cursor-pointer"
                              title="複製連結"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* Open Original */}
                            <Link
                              href={item.url}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition active:scale-95 cursor-pointer flex items-center justify-center"
                              title="檢視原檔"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-95 cursor-pointer"
                              title="刪除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedMedia.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  className={`bg-white border rounded-2xl overflow-hidden flex flex-col group hover:shadow-md transition relative ${
                    isSelected ? 'border-indigo-600 ring-1 ring-indigo-600/30' : 'border-slate-100'
                  }`}
                >
                  {/* Select Checkbox (top left) */}
                  <div className="absolute top-3 left-3 z-10">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4 bg-white/80 backdrop-blur-sm"
                    />
                  </div>

                  {/* File Preview block */}
                  <div className="aspect-[16/10] bg-slate-50 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
                    {item.type === 'image' && item.url ? (
                      <img 
                        src={item.url} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                      />
                    ) : (
                      <div className="scale-150">
                        {getFileIcon(item.type)}
                      </div>
                    )}
                    
                    {/* Hover Overlay Actions */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-2.5">
                      <button 
                        onClick={() => handleCopyLink(item)}
                        className="p-2 bg-white text-slate-700 hover:text-indigo-600 rounded-lg shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center"
                        title="複製連結"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <Link 
                        href={item.url} 
                        target="_blank"
                        className="p-2 bg-white text-slate-700 hover:text-indigo-600 rounded-lg shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center"
                        title="開啟檔案"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(item)}
                        className="p-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center"
                        title="刪除檔案"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* File info */}
                  <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-xs truncate max-w-full" title={item.name}>
                        {item.name}
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1">
                        <span>大小: {item.size}</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-black text-slate-500">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 mt-2 flex justify-between items-center">
                      <span>上傳：{item.date}</span>
                      <span 
                        className="font-bold text-indigo-600 text-[9px] truncate max-w-[100px] select-all cursor-pointer" 
                        title="點選網址進行複製" 
                        onClick={() => handleCopyLink(item)}
                      >
                        {copiedId === item.id ? '已複製！' : '複製連結'}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="py-20 text-center text-slate-400 italic font-semibold border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 shadow-sm flex flex-col items-center justify-center gap-2">
          <span>素材庫目前是空的。請上傳一些照片或文件！</span>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Label */}
          <div className="text-xs font-bold text-slate-400">
            顯示第 <span className="text-slate-700">{startIndex + 1}</span> 至 <span className="text-slate-700">{endIndex}</span> 筆，共 <span className="text-slate-700">{totalItems}</span> 筆
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span>每頁顯示:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1); // reset to page 1
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-700 text-xs font-bold focus:border-indigo-600 cursor-pointer"
              >
                <option value={10}>10 筆</option>
                <option value={20}>20 筆</option>
                <option value={50}>50 筆</option>
              </select>
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-500 transition cursor-pointer"
                title="最前頁"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-500 transition cursor-pointer"
                title="上一頁"
              >
                <span className="text-xs font-bold flex items-center">上一頁</span>
              </button>

              {/* Page Number Labels */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  // Only show current page, first, last, and surrounding pages to avoid clutter
                  if (
                    pNum === 1 || 
                    pNum === totalPages || 
                    (pNum >= currentPage - 1 && pNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`w-7.5 h-7.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentPage === pNum
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  } else if (
                    (pNum === 2 && currentPage > 3) || 
                    (pNum === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return <span key={pNum} className="text-xs text-slate-400 font-bold px-0.5">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-500 transition cursor-pointer"
                title="下一頁"
              >
                <span className="text-xs font-bold flex items-center">下一頁</span>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-500 transition cursor-pointer"
                title="最後頁"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
