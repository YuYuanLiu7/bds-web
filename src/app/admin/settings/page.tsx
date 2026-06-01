'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, 
  Power, 
  Info, 
  Award, 
  HelpCircle, 
  Bell, 
  Mail, 
  Megaphone, 
  ShieldCheck, 
  Building2, 
  FlaskConical,
  X,
  Save,
  Check,
  Image as ImageIcon,
  Sliders,
  Link2,
  Settings
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Settings mock state
  const [siteName, setSiteName] = useState('BDS By Doing So');
  const [siteDesc, setSiteDesc] = useState('橋接理論與實踐，深耕硬體、半導體與醫材產業。');
  const [customDomain, setCustomDomain] = useState('bds.fu-notes.com');
  
  // PayUni credentials
  const [merId, setMerId] = useState('MS12345678');
  const [hashKey, setHashKey] = useState('YOUR_PAYUNI_HASH_KEY');
  const [hashIv, setHashIv] = useState('YOUR_PAYUNI_HASH_IV');
  const [payuniMode, setPayuniMode] = useState('sandbox');

  // Dynamic homepage visual settings state
  const [logoUrl, setLogoUrl] = useState('');
  const [slogan, setSlogan] = useState('');
  const [slides, setSlides] = useState<any[]>([]);
  const [secImage1, setSecImage1] = useState({ imageUrl: '', link: '' });
  const [secImage2, setSecImage2] = useState({ imageUrl: '', link: '' });
  const [primaryColor, setPrimaryColor] = useState('#21448e');
  const [isVisualLoading, setIsVisualLoading] = useState(false);

  // Image Uploading specific states
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Helper to extract filename from URL or path
  const getFileName = (url: string) => {
    if (!url) return '尚未上傳任何圖片';
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      const lastPart = parts[parts.length - 1];
      return lastPart.split('?')[0] || '已上傳的圖片';
    } catch (e) {
      return '已選擇圖片';
    }
  };

  // Fetch current visual settings from the API
  const fetchVisualSettings = async () => {
    setIsVisualLoading(true);
    try {
      const res = await fetch('/api/admin/site-settings');
      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.logoUrl || '');
        setSlogan(data.slogan || '');
        setSlides(data.carouselSlides || []);
        setSecImage1(data.sectionImage1 || { imageUrl: '', link: '' });
        setSecImage2(data.sectionImage2 || { imageUrl: '', link: '' });
        setPrimaryColor(data.primaryColor || '#21448e');
      }
    } catch (err) {
      console.error("Failed to fetch homepage site settings:", err);
    } finally {
      setIsVisualLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualSettings();
  }, []);

  const handleSave = (msg: string) => {
    setActiveModal(null);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Submit handler for homepage visual settings
  const handleSaveVisual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor,
          logoUrl,
          slogan,
          carouselSlides: slides,
          sectionImage1: secImage1,
          sectionImage2: secImage2
        })
      });

      if (res.ok) {
        handleSave('前台首頁視覺、輪播圖與 Banner 圖片已儲存成功！');
      } else {
        const errData = await res.json();
        alert('儲存失敗：' + (errData.error || '未知錯誤'));
      }
    } catch (err) {
      console.error("Save settings error:", err);
      alert('連線失敗，請確認開發伺服器狀態。');
    }
  };

  // Handler to update specific slide fields
  const handleSlideChange = (index: number, field: string, value: string) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    setSlides(updatedSlides);
  };

  // Single-file uploader for general visual fields (logo, banners)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldSetter: (url: string) => void,
    fieldId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        fieldSetter(data.url);
      } else {
        const err = await res.json();
        alert('圖片上傳失敗：' + (err.error || '未知錯誤'));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert('上傳失敗，請確認後台伺服器正常運行中。');
    } finally {
      setUploadingField(null);
    }
  };

  // Slide-specific image uploader
  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fieldId = `slide-${index}`;
    setUploadingField(fieldId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        handleSlideChange(index, 'imageUrl', data.url);
      } else {
        const err = await res.json();
        alert('投影片上傳失敗：' + (err.error || '未知錯誤'));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert('上傳失敗，請確認後台伺服器正常運行中。');
    } finally {
      setUploadingField(null);
    }
  };

  const settingGroups = [
    {
      title: '全站設定',
      items: [
        { id: 'general', name: '基本資訊', desc: '網站基本資料與簡短描述設定', icon: Globe },
        { id: 'visual', name: '前台視覺與圖片', desc: '直覺上傳前台輪播圖、中下段 Banner 圖片與連結', icon: ImageIcon },
        { id: 'status', name: '上線狀態', desc: '管理網站對外開放與上線狀態', icon: Power },
        { id: 'contact', name: '聯絡資訊', desc: '設定社群媒體、聯絡地址及客服聯絡資料', icon: Info },
        { id: 'domain', name: '自訂網域', desc: '設定專屬網域名稱與網誌轉址', icon: Award },
        { id: 'faq', name: '常見問題', desc: '設定網站與學員的常見問題集', icon: HelpCircle }
      ]
    },
    {
      title: '通知',
      items: [
        { id: 'admin-notif', name: '管理員通知', desc: '設定接收訂單成立、留言提問等收件信箱', icon: Bell },
        { id: 'member-notif', name: '會員通知', desc: '自訂會員通知與訂單成立信件內容', icon: Mail },
        { id: 'announcement', name: '佈告欄', desc: '顯示於學員學習中心的公告訊息', icon: Megaphone }
      ]
    },
    {
      title: '合規',
      items: [
        { id: 'compliance', name: '組織詳情', desc: '設定網站國家及個人或組織營運類型', icon: ShieldCheck }
      ]
    },
    {
      title: '金流與提領',
      items: [
        { id: 'payout', name: '提領帳戶 (PayUni 金流)', desc: '設定偏好的 PayUni 商店金流串接與金鑰', icon: Building2 }
      ]
    },
    {
      title: '進階',
      items: [
        { id: 'beta', name: 'Beta 功能', desc: '試用我們正在開發中的最新實驗功能', icon: FlaskConical }
      ]
    }
  ];

  return (
    <div className="space-y-8 select-none font-sans text-slate-700">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-xl font-extrabold text-slate-800 flex items-center">
          <Settings className="w-6.5 h-6.5 mr-2 text-indigo-600" />
          設定
        </h1>
        <p className="text-slate-400 text-xs mt-1 font-semibold">自訂與配置您的 BDS 平台屬性、金流閘道器及系統通知參數。</p>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-xl font-bold animate-in fade-in duration-200 shadow-sm flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {successMsg}
        </div>
      )}

      {/* Settings Portal Grid */}
      <div className="space-y-8">
        {settingGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setActiveModal(item.id)}
                  className="bg-white border border-slate-100 hover:border-indigo-600/30 rounded-2xl p-5 flex items-start space-x-4 cursor-pointer hover:shadow-md transition group select-none"
                >
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition truncate">
                      {item.name}
                    </span>
                    <span className="block text-xs text-slate-400 font-semibold mt-1.5 leading-normal">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --------------------------------- MODALS --------------------------------- */}

      {/* Dynamic Homepage Visual & Upload Settings Modal */}
      {activeModal === 'visual' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800 text-sm">前台首頁視覺與圖片管理 (支援上傳)</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isVisualLoading ? (
              <div className="p-8 text-center text-slate-400 italic">正在載入首頁設定值...</div>
            ) : (
              <form onSubmit={handleSaveVisual} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                
                {/* 1. Brand Visuals */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
                    <Sliders className="w-3.5 h-3.5 mr-1 text-indigo-500" /> 品牌基本視覺與標語
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">品牌主色碼</label>
                      <div className="flex space-x-2">
                        <input 
                          type="color" 
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none uppercase"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">首頁標語 (Slogan)</label>
                      <input 
                        type="text" 
                        value={slogan}
                        onChange={(e) => setSlogan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 transition"
                        placeholder="請輸入宣傳標語"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Logo Upload (Read-Only URL Display & Direct Upload) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">網域 Logo 圖片</label>
                    <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between space-x-4 shadow-sm hover:border-indigo-600/20 transition">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt="Logo Preview" 
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          )}
                          {uploadingField === 'logo' && (
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                              <span className="text-[8px] font-bold animate-pulse">UPLOADING</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold text-slate-700 truncate">
                            {logoUrl ? getFileName(logoUrl) : '尚未上傳 Logo 圖片'}
                          </span>
                          <span className="block text-[9px] text-slate-400 truncate font-mono mt-0.5 select-all">
                            {logoUrl || '無網址資料'}
                          </span>
                        </div>
                      </div>
                      <label className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer select-none flex-shrink-0 flex items-center justify-center hover:shadow-sm active:scale-95">
                        {uploadingField === 'logo' ? '上傳中...' : '更換圖片'}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setLogoUrl, 'logo')}
                          className="hidden"
                          disabled={uploadingField !== null}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Hero Carousel Slides */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
                    <ImageIcon className="w-3.5 h-3.5 mr-1 text-indigo-500" /> 首頁大尺寸輪播圖 (Hero Carousel)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    設定頂端自動輪播的三張大圖。您不能使用複製貼上網址的方式，請直接點選海報圖片進行「上傳」更新。
                  </p>
                  
                  {slides.map((slide, sIdx) => (
                    <div key={slide.id} className="p-4 bg-white rounded-xl border border-slate-100 space-y-3 hover:border-slate-200 transition shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">首頁投影片廣告 #{sIdx + 1}</div>
                        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span>已就緒</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Slide Image Upload Box */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">投影片海報圖片</label>
                          <div className="relative aspect-[21/9] w-full rounded-lg border border-slate-200/80 overflow-hidden bg-slate-50 group flex items-center justify-center">
                            {slide.imageUrl ? (
                              <img 
                                src={slide.imageUrl} 
                                alt={`Slide ${sIdx + 1} Preview`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-slate-300" />
                            )}
                            
                            {/* Upload Overlay */}
                            <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition select-none">
                              <span className="text-[10px] font-extrabold tracking-wider bg-black/40 px-3 py-1.5 rounded-lg border border-white/20">點選上傳新海報</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleSlideUpload(e, sIdx)}
                                className="hidden"
                                disabled={uploadingField !== null}
                              />
                            </label>

                            {uploadingField === `slide-${sIdx}` && (
                              <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                                <span className="text-[9px] font-bold animate-pulse">圖片上傳中...</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                            <span className="truncate max-w-[150px]" title={slide.imageUrl}>
                              {slide.imageUrl ? getFileName(slide.imageUrl) : '尚未上傳海報'}
                            </span>
                            <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-bold select-none active:scale-95">
                              [ 更換圖片 ]
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleSlideUpload(e, sIdx)}
                                className="hidden"
                                disabled={uploadingField !== null}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Slide Redirection Link */}
                        <div className="space-y-2 flex flex-col justify-between py-0.5">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">點擊跳轉路徑 (Link)</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                <Link2 className="w-3.5 h-3.5" />
                              </div>
                              <input 
                                type="text" 
                                value={slide.link}
                                onChange={(e) => handleSlideChange(sIdx, 'link', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-8 pr-3 py-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
                                placeholder="/courses"
                                required
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-1">
                              點擊投影片廣告後要跳轉的前端相對路徑（例如：`/courses`）。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Section Banners */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center">
                    <Link2 className="w-3.5 h-3.5 mr-1 text-indigo-500" /> 中段與下段通欄 Banner 廣告圖
                  </h3>
                  
                  {/* Banner 1 (Mid-section) */}
                  <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-3 hover:border-slate-200 transition shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">中段廣告區塊 Banner (所有課程上方)</div>
                      <div className="flex items-center space-x-1.5 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        <span>首頁通欄 (中)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Image Upload Box */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Banner 廣告圖</label>
                        <div className="relative aspect-[21/6] w-full rounded-lg border border-slate-200/80 overflow-hidden bg-slate-50 group flex items-center justify-center">
                          {secImage1.imageUrl ? (
                            <img 
                              src={secImage1.imageUrl} 
                              alt="Banner 1 Preview" 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                          
                          {/* Upload Overlay */}
                          <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition select-none">
                            <span className="text-[10px] font-extrabold tracking-wider bg-black/40 px-3 py-1.5 rounded-lg border border-white/20">點選上傳圖片</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, (url) => setSecImage1({ ...secImage1, imageUrl: url }), 'banner1')}
                              className="hidden"
                              disabled={uploadingField !== null}
                            />
                          </label>

                          {uploadingField === 'banner1' && (
                            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                              <span className="text-[9px] font-bold animate-pulse">圖片上傳中...</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                          <span className="truncate max-w-[150px]" title={secImage1.imageUrl}>
                            {secImage1.imageUrl ? getFileName(secImage1.imageUrl) : '尚未上傳廣告圖'}
                          </span>
                          <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-bold select-none active:scale-95">
                            [ 更換圖片 ]
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, (url) => setSecImage1({ ...secImage1, imageUrl: url }), 'banner1')}
                              className="hidden"
                              disabled={uploadingField !== null}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Redirection Link */}
                      <div className="space-y-2 flex flex-col justify-between py-0.5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">點擊跳轉路徑 (Link)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                              <Link2 className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              type="text" 
                              value={secImage1.link}
                              onChange={(e) => setSecImage1({ ...secImage1, link: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-8 pr-3 py-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
                              placeholder="/courses"
                              required
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-1">
                            中段廣告的點擊跳轉路徑。當點擊這個通欄 Banner 時，學員將被導航至該位置。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner 2 (Bottom-section) */}
                  <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-3 hover:border-slate-200 transition shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">下段廣告區塊 Banner (課程列表下方)</div>
                      <div className="flex items-center space-x-1.5 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        <span>首頁通欄 (下)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Image Upload Box */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Banner 廣告圖</label>
                        <div className="relative aspect-[21/6] w-full rounded-lg border border-slate-200/80 overflow-hidden bg-slate-50 group flex items-center justify-center">
                          {secImage2.imageUrl ? (
                            <img 
                              src={secImage2.imageUrl} 
                              alt="Banner 2 Preview" 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                          
                          {/* Upload Overlay */}
                          <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition select-none">
                            <span className="text-[10px] font-extrabold tracking-wider bg-black/40 px-3 py-1.5 rounded-lg border border-white/20">點選上傳圖片</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, (url) => setSecImage2({ ...secImage2, imageUrl: url }), 'banner2')}
                              className="hidden"
                              disabled={uploadingField !== null}
                            />
                          </label>

                          {uploadingField === 'banner2' && (
                            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                              <span className="text-[9px] font-bold animate-pulse">圖片上傳中...</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold px-0.5">
                          <span className="truncate max-w-[150px]" title={secImage2.imageUrl}>
                            {secImage2.imageUrl ? getFileName(secImage2.imageUrl) : '尚未上傳廣告圖'}
                          </span>
                          <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-bold select-none active:scale-95">
                            [ 更換圖片 ]
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, (url) => setSecImage2({ ...secImage2, imageUrl: url }), 'banner2')}
                              className="hidden"
                              disabled={uploadingField !== null}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Redirection Link */}
                      <div className="space-y-2 flex flex-col justify-between py-0.5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">點擊跳轉路徑 (Link)</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                              <Link2 className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              type="text" 
                              value={secImage2.link}
                              onChange={(e) => setSecImage2({ ...secImage2, link: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-8 pr-3 py-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
                              placeholder="/courses"
                              required
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-1">
                            下段廣告的點擊跳轉路徑。當點擊這個下段通欄 Banner 時，學員將被導航至該位置。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 pt-2 pb-4">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center cursor-pointer">
                    <Save className="w-4 h-4 mr-1.5" /> 儲存前台視覺設定
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* General Settings Modal */}
      {activeModal === 'general' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm">基本資訊設定</span>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave('網站基本資訊已成功更新！'); }} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">網站學校名稱</label>
                <input 
                  type="text" 
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">簡短描述</label>
                <textarea 
                  rows={3}
                  value={siteDesc}
                  onChange={(e) => setSiteDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center active:scale-98">
                <Save className="w-4 h-4 mr-1.5" /> 儲存設定
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Domain Modal */}
      {activeModal === 'domain' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm">自訂網域</span>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave('自訂網域變更成功！'); }} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">主網域名稱 (Custom Domain FQDN)</label>
                <input 
                  type="text" 
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  placeholder="domain.com"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center active:scale-98">
                <Save className="w-4 h-4 mr-1.5" /> 儲存自訂網域
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PayUni Golden Flow Payout Modal */}
      {activeModal === 'payout' && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm">PayUni 商店與提領帳戶金流設定</span>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSave('PayUni 金流密鑰已儲存成功！'); }} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">商店代號 (MerID)</label>
                  <input 
                    type="text" 
                    value={merId}
                    onChange={(e) => setMerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">API 版本</label>
                  <input 
                    type="text" 
                    value="2.0" 
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 outline-none"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">HashKey</label>
                <input 
                  type="password" 
                  value={hashKey}
                  onChange={(e) => setHashKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">HashIV</label>
                <input 
                  type="password" 
                  value={hashIv}
                  onChange={(e) => setHashIv(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">金流環境</label>
                <div className="flex space-x-6 pt-1">
                  <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payout_mode" 
                      checked={payuniMode === 'sandbox'} 
                      onChange={() => setPayuniMode('sandbox')}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mr-2" 
                    />
                    測試環境 (Sandbox)
                  </label>
                  <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payout_mode" 
                      checked={payuniMode === 'production'} 
                      onChange={() => setPayuniMode('production')}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mr-2" 
                    />
                    正式環境 (Production)
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center active:scale-98">
                <Save className="w-4 h-4 mr-1.5" /> 儲存金流參數
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Alert modal placeholder for un-implemented modal panels */}
      {(activeModal && activeModal !== 'general' && activeModal !== 'domain' && activeModal !== 'payout' && activeModal !== 'visual') && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 animate-in zoom-in-95 duration-200 space-y-4 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">功能展示模式</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                本項目「{settingGroups.flatMap(g => g.items).find(i => i.id === activeModal)?.name}」設定介面已就緒，目前處於功能展示與對標模式。
              </p>
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
