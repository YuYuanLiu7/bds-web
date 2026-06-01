'use client';

import { useState } from 'react';
import { FolderOpen, Search, Plus, Image as ImageIcon, Video, FileText, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminMediaPage() {
  const [media, setMedia] = useState([
    { id: '1', name: 'BDS_Vol3_Cover.png', size: '1.2 MB', type: 'image', dimensions: '1280x800', date: '2026-05-25' },
    { id: '2', name: 'Intro_Teaser_720p.mp4', size: '45.0 MB', type: 'video', dimensions: '1280x720', date: '2026-05-18' },
    { id: '3', name: 'ODM_Business_Strategy.pdf', size: '2.4 MB', type: 'document', dimensions: '—', date: '2026-05-12' }
  ]);

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此素材嗎？這可能會導致使用此素材的課程圖片或影片無法正常顯示。')) {
      setMedia(media.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
            <FolderOpen className="w-6.5 h-6.5 mr-2 text-indigo-600" />
            媒體素材庫
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">集中上傳與管理您的課程封面圖、簡報講義檔案、Banner 及輔助媒體素材。</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center cursor-pointer active:scale-98">
          <Plus className="w-4 h-4 mr-1.5" /> 上傳新檔案
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Gallery Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="text-xs text-slate-400 font-bold">
            共 <span className="text-slate-700 font-extrabold">{media.length}</span> 項，顯示 <span className="text-slate-700 font-extrabold">1-{media.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {media.map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition">
                {/* File Preview block */}
                <div className="aspect-[16/10] bg-slate-50 flex items-center justify-center border-b border-slate-50 relative">
                  {item.type === 'image' && <ImageIcon className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition duration-300" />}
                  {item.type === 'video' && <Video className="w-10 h-10 text-sky-400 group-hover:scale-110 transition duration-300" />}
                  {item.type === 'document' && <FileText className="w-10 h-10 text-amber-400 group-hover:scale-110 transition duration-300" />}
                  
                  {/* Hover Delete Action Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 bg-white text-rose-600 hover:bg-rose-50 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* File info */}
                <div className="p-4 space-y-2">
                  <div className="font-bold text-slate-800 text-xs truncate max-w-full" title={item.name}>
                    {item.name}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                    <span>大小: {item.size}</span>
                    <span>規格: {item.dimensions}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-50">
                    上傳於: {item.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Aside */}
        <div className="lg:col-span-1 lg:order-first">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2.5 border-b border-slate-50">素材篩選</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">檔案名稱</label>
                <input 
                  type="text" 
                  placeholder="搜尋檔案名稱"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center cursor-pointer">
                <Search className="w-3.5 h-3.5 mr-1" /> 搜尋素材
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
