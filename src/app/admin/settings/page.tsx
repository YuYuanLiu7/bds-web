'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, 
  Power, 
  ImageIcon, 
  HelpCircle, 
  Mail, 
  Megaphone, 
  Building2, 
  X, 
  Save, 
  Check, 
  Plus, 
  Trash2, 
  Pencil, 
  Link2, 
  Settings 
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. General & Contact
  const [siteName, setSiteName] = useState('');
  const [siteDesc, setSiteDesc] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [communityUrl, setCommunityUrl] = useState('');

  // 2. Front Visual (from API site-settings)
  const [logoUrl, setLogoUrl] = useState('');
  const [slogan, setSlogan] = useState('');
  const [slides, setSlides] = useState<any[]>([]);
  const [secImage1, setSecImage1] = useState({ imageUrl: '', link: '' });
  const [secImage2, setSecImage2] = useState({ imageUrl: '', link: '' });
  const [primaryColor, setPrimaryColor] = useState('#21448e');
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // 3. Status
  const [siteStatus, setSiteStatus] = useState('online');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // 4. FAQs
  const [faqs, setFaqs] = useState<any[]>([]);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [faqForm, setFaqForm] = useState({ q: '', a: '' });

  // 5. Announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingAnnouncementIndex, setEditingAnnouncementIndex] = useState<number | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ content: '', url: '', status: 'published' });

  // 6. Notifications
  const [adminEmail, setAdminEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');

  // 7. PayUni Gateways
  const [merId, setMerId] = useState('');
  const [hashKey, setHashKey] = useState('');
  const [hashIv, setHashIv] = useState('');
  const [payuniMode, setPayuniMode] = useState('sandbox');

  // Load settings from localStorage and API
  useEffect(() => {
    // 1. General
    setSiteName(localStorage.getItem('bds_site_name') || 'BDS By Doing So');
    setSiteDesc(localStorage.getItem('bds_site_desc') || '橋接理論與實踐，深耕硬體、半導體與醫材產業。');
    setContactEmail(localStorage.getItem('bds_contact_email') || 'bydoingso@gmail.com');
    setCommunityUrl(localStorage.getItem('bds_community_url') || 'https://discord.gg/bds');

    // 2. Status
    setSiteStatus(localStorage.getItem('bds_site_status') || 'online');
    setMaintenanceMessage(localStorage.getItem('bds_maintenance_message') || '為了提供更高品質的學習體驗，我們目前正在進行系統升級維護，預計將於明早 06:00 完成。');

    // 3. FAQs
    const savedFaqs = localStorage.getItem('bds_faqs');
    if (savedFaqs) {
      try { setFaqs(JSON.parse(savedFaqs)); } catch (e) {}
    } else {
      const defaultFaqs = [
        { q: '如何開始選購與學習 BDS 的實戰課程？', a: '您只需在 BDS 首頁或課程列表頁面中，點選您感興趣的課程。點擊「立即購買」或「立即選購」後，系統會自動引導您進入 PayUni 安全金流結帳流程。付款完成後，系統會即時開通您的權限，您可以在頂端點擊「我的學習」直接開始看課觀看影片！' },
        { q: 'BDS 平台支援哪些付款方式？', a: 'BDS 目前唯一指定與台灣領先金流平台 PayUni（統一金流）合作。我們支援「信用卡線上一次付清」與「ATM 虛擬帳號轉帳匯款」。所有交易皆通過 256-bit SSL 資訊安全加密，保證您的付款資訊百分之百安全無虞。' },
        { q: '購買課程後，觀看期限是多久？可以退款嗎？', a: '在 BDS 購買的任何單門實戰課程皆享有「終身無限次觀看」的權益，沒有時間與次數限制。由於數位內容與影音商品在購買開通後即可完整觀看，若您有特殊的個人因素退款需求，請在購買後 7 天內（且觀看進度不超過第一章節 10%）與我們聯絡，我們將由專人為您審核辦理。' },
        { q: '付款完成後，我該如何確認我的課程已經開通？', a: '當您完成信用卡付款或 ATM 轉帳匯款成功後，PayUni 金流系統會發送通知給我們，系統會在 1 秒鐘內自動為您的註冊帳號開通對應課程權限。您可以登入後至頂端點選「我的學習」確認；同時您也會在您的信箱中收到一封訂單成立與權限開通的通知信件。' },
        { q: '我們有學員專屬的交流社群或 Discord 群組嗎？', a: '有的！BDS 非常重視學員的實戰交流。凡是購買過 BDS 任一課程或訂閱方案的學員，皆可在課程學習播放器的公告區或您的電子郵件信箱中，獲得專屬「Discord 業務表達與 BD 核心沙龍交流群」的邀請連結。在這裡您可以隨時向講師提問，並與數百位同行精英交流合作！' }
      ];
      setFaqs(defaultFaqs);
      localStorage.setItem('bds_faqs', JSON.stringify(defaultFaqs));
    }

    // 4. Announcements
    const savedAnn = localStorage.getItem('bds_announcements');
    if (savedAnn) {
      try { setAnnouncements(JSON.parse(savedAnn)); } catch (e) {}
    } else {
      const defaultAnn = [
        { content: '🎉 賀！硬體業務新手村課程突破 200 人選修！專屬學習群組加碼開放。', url: '/courses', status: 'published' }
      ];
      setAnnouncements(defaultAnn);
      localStorage.setItem('bds_announcements', JSON.stringify(defaultAnn));
    }

    // 5. Email notifications
    setAdminEmail(localStorage.getItem('bds_admin_email') || 'admin@bydoingso.com');
    setEmailSubject(localStorage.getItem('bds_email_subject') || '【BDS By Doing So】您的課程已開通成功！');
    setEmailTemplate(localStorage.getItem('bds_email_template') || '親愛的學員您好，感謝您購買 BDS 課程！系統已成功開通您的看課權限。');

    // 6. PayUni Gateways
    setMerId(localStorage.getItem('bds_mer_id') || 'MS12345678');
    setHashKey(localStorage.getItem('bds_hash_key') || 'YOUR_PAYUNI_HASH_KEY');
    setHashIv(localStorage.getItem('bds_hash_iv') || 'YOUR_PAYUNI_HASH_IV');
    setPayuniMode(localStorage.getItem('bds_payuni_mode') || 'sandbox');

    // Fetch Front visual settings
    fetchVisualSettings();
  }, []);

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
      console.error("Failed to fetch visual settings:", err);
    } finally {
      setIsVisualLoading(false);
    }
  };

  const handleShowToast = (msg: string) => {
    setActiveModal(null);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bds_site_name', siteName);
    localStorage.setItem('bds_site_desc', siteDesc);
    localStorage.setItem('bds_contact_email', contactEmail);
    localStorage.setItem('bds_community_url', communityUrl);
    handleShowToast('基本資訊與聯絡方式設定已儲存成功！');
  };

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
        handleShowToast('前台首頁視覺與圖片設定已儲存成功！');
      } else {
        alert('儲存失敗，請檢查 API 回應');
      }
    } catch (err) {
      console.error("Visual settings save error:", err);
    }
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bds_site_status', siteStatus);
    localStorage.setItem('bds_maintenance_message', maintenanceMessage);
    handleShowToast('網站上線與運作狀態設定已儲存！');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bds_admin_email', adminEmail);
    localStorage.setItem('bds_email_subject', emailSubject);
    localStorage.setItem('bds_email_template', emailTemplate);
    handleShowToast('郵件與通知設定已儲存！');
  };

  const handleSavePayUni = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bds_mer_id', merId);
    localStorage.setItem('bds_hash_key', hashKey);
    localStorage.setItem('bds_hash_iv', hashIv);
    localStorage.setItem('bds_payuni_mode', payuniMode);
    handleShowToast('PayUni 金流金鑰設定已儲存成功！');
  };

  // FAQ Manager helpers
  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.q || !faqForm.a) return;
    
    let newFaqs;
    if (editingFaqIndex !== null) {
      newFaqs = faqs.map((f, idx) => idx === editingFaqIndex ? faqForm : f);
      setEditingFaqIndex(null);
    } else {
      newFaqs = [...faqs, faqForm];
    }
    setFaqs(newFaqs);
    localStorage.setItem('bds_faqs', JSON.stringify(newFaqs));
    setFaqForm({ q: '', a: '' });
  };

  const handleDeleteFaq = (index: number) => {
    const newFaqs = faqs.filter((_, idx) => idx !== index);
    setFaqs(newFaqs);
    localStorage.setItem('bds_faqs', JSON.stringify(newFaqs));
  };

  // Announcement Manager helpers
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.content) return;

    let newAnn;
    if (editingAnnouncementIndex !== null) {
      newAnn = announcements.map((a, idx) => idx === editingAnnouncementIndex ? announcementForm : a);
      setEditingAnnouncementIndex(null);
    } else {
      newAnn = [...announcements, announcementForm];
    }
    setAnnouncements(newAnn);
    localStorage.setItem('bds_announcements', JSON.stringify(newAnn));
    setAnnouncementForm({ content: '', url: '', status: 'published' });
  };

  const handleDeleteAnnouncement = (index: number) => {
    const newAnn = announcements.filter((_, idx) => idx !== index);
    setAnnouncements(newAnn);
    localStorage.setItem('bds_announcements', JSON.stringify(newAnn));
  };

  // Image Upload general uploader
  const handleGeneralImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void, fieldId: string) => {
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

    setUploadingField(fieldId);
    const data = new FormData();
    const fileExt = file.name.split('.').pop() || 'png';
    const safeName = `upload-${Date.now()}.${fileExt}`;
    data.append('file', file, safeName);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data
      });
      if (res.ok) {
        const result = await res.json();
        setter(result.url);
      } else {
        alert('圖片上傳失敗');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
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

    setUploadingField(`slide-${idx}`);
    const data = new FormData();
    const fileExt = file.name.split('.').pop() || 'png';
    const safeName = `upload-${Date.now()}.${fileExt}`;
    data.append('file', file, safeName);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data
      });
      if (res.ok) {
        const result = await res.json();
        const updated = [...slides];
        updated[idx] = { ...updated[idx], imageUrl: result.url };
        setSlides(updated);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setUploadingField(null);
    }
  };

  const settingGroups = [
    {
      title: '全站設定',
      items: [
        { id: 'general', name: '基本資訊與聯絡方式', desc: '網站名稱、簡介描述、客服信箱與 Discord 交流群連結設定', icon: Globe },
        { id: 'visual', name: '首頁視覺與圖片', desc: '上傳前台 Logo、首頁輪播圖、中下段通欄 Banner 圖片與跳轉連結', icon: ImageIcon },
        { id: 'status', name: '上線與運作狀態', desc: '管理網站是否對外公開，或是切換至全站維護模式', icon: Power },
        { id: 'faq', name: '常見問題管理', desc: '新增、編輯與刪除前台呈現的學員常見問題集 (FAQ)', icon: HelpCircle }
      ]
    },
    {
      title: '通知與內容',
      items: [
        { id: 'announcement', name: '系統佈告欄公告', desc: '發布與編輯顯示於學員看課中心頂端的公告訊息', icon: Megaphone },
        { id: 'notifications', name: '郵件通知設定', desc: '配置系統接收通知與發送付款成功信件之模板與信箱', icon: Mail }
      ]
    },
    {
      title: '金流閘道器',
      items: [
        { id: 'payout', name: 'PayUni 金流金鑰', desc: '配置唯一的 PayUni 商店金鑰（MerID、HashKey、HashIV）與金流環境', icon: Building2 }
      ]
    }
  ];

  return (
    <div className="space-y-6 select-none font-sans text-slate-700">
      
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

      {/* Settings Grid */}
      <div className="space-y-6">
        {settingGroups.map((group, idx) => (
          <div key={idx} className="space-y-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {group.items.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setActiveModal(item.id)}
                  className="bg-white border border-slate-100 hover:border-indigo-500/30 rounded-2xl p-5 flex items-start space-x-4 cursor-pointer hover:shadow-md transition group select-none"
                >
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition truncate">
                      {item.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-semibold mt-1.5 leading-normal">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal 1: General & Contact */}
      {activeModal === 'general' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">基本資訊與聯絡方式</span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleSaveGeneral} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">平台網站名稱</label>
                <input 
                  type="text" 
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">平台簡介描述</label>
                <textarea 
                  rows={3}
                  value={siteDesc}
                  onChange={(e) => setSiteDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">官方客服聯絡信箱 (Email)</label>
                <input 
                  type="email" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">學員 Discord 交流群連結</label>
                <input 
                  type="url" 
                  value={communityUrl}
                  onChange={(e) => setCommunityUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-98 cursor-pointer">
                儲存基本資訊
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Front Visual */}
      {activeModal === 'visual' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <span className="font-extrabold text-slate-800 text-xs">首頁視覺與圖片管理</span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            {isVisualLoading ? (
              <div className="p-8 text-center text-slate-400 italic">載入視覺設定中...</div>
            ) : (
              <form onSubmit={handleSaveVisual} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                
                {/* Visual Settings */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">品牌視覺與 Slogan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400">主要品牌色碼</label>
                      <div className="flex space-x-2">
                        <input 
                          type="color" 
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 outline-none uppercase"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400">前台首頁宣傳語 (Slogan)</label>
                      <input 
                        type="text" 
                        value={slogan}
                        onChange={(e) => setSlogan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400">前台 Logo 圖片</label>
                    <div className="flex space-x-2 items-center bg-white p-2 rounded-lg border border-slate-200/80">
                      <div className="w-10 h-8 rounded border bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                        {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" /> : <ImageIcon className="w-4 h-4 text-slate-300" />}
                        {uploadingField === 'logo' && <div className="absolute inset-0 bg-black/50 text-[8px] text-white flex items-center justify-center">...</div>}
                      </div>
                      <input 
                        type="text" 
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold text-slate-600 outline-none"
                      />
                      <label className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-[10px] font-bold cursor-pointer select-none">
                        上傳 Logo
                        <input type="file" accept="image/*" onChange={(e) => handleGeneralImageUpload(e, setLogoUrl, 'logo')} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Hero Carousel */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">首頁輪播海報廣告 (Hero Carousel)</h3>
                  {slides.map((slide, sIdx) => (
                    <div key={slide.id || sIdx} className="bg-white border border-slate-100 p-3 rounded-lg space-y-2.5">
                      <div className="text-[9px] font-bold text-indigo-600 uppercase">投影片廣告 #{sIdx + 1}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400">上傳投影片圖片</label>
                          <div className="aspect-[21/9] w-full rounded border overflow-hidden bg-slate-50 relative flex items-center justify-center">
                            {slide.imageUrl ? <img src={slide.imageUrl} alt="Slide" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-300" />}
                            {uploadingField === `slide-${sIdx}` && <div className="absolute inset-0 bg-black/60 text-xs text-white flex items-center justify-center">上傳中...</div>}
                            <label className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[9px] cursor-pointer transition select-none">
                              點此上傳
                              <input type="file" accept="image/*" onChange={(e) => handleSlideUpload(e, sIdx)} className="hidden" />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2 flex flex-col justify-end">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400">跳轉相對路徑</label>
                            <input 
                              type="text" 
                              value={slide.link} 
                              onChange={(e) => {
                                const updated = [...slides];
                                updated[sIdx].link = e.target.value;
                                setSlides(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-[10px] font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Banner 1 & 2 */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">通欄 Banner 廣告區塊</h3>
                  {/* Banner 1 */}
                  <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                    <div className="text-[9px] font-bold text-slate-500">中段通欄廣告 (課程列表上方)</div>
                    <div className="flex space-x-2 items-center">
                      <input 
                        type="text" 
                        value={secImage1.imageUrl}
                        onChange={(e) => setSecImage1({ ...secImage1, imageUrl: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px]"
                        placeholder="圖片網址"
                      />
                      <label className="bg-indigo-50 text-indigo-600 px-3 py-1 text-[10px] font-bold cursor-pointer select-none">
                        上傳 Banner
                        <input type="file" accept="image/*" onChange={(e) => handleGeneralImageUpload(e, (url) => setSecImage1({ ...secImage1, imageUrl: url }), 'banner1')} className="hidden" />
                      </label>
                    </div>
                    <input 
                      type="text" 
                      value={secImage1.link} 
                      onChange={(e) => setSecImage1({ ...secImage1, link: e.target.value })}
                      placeholder="跳轉路徑 (例如: /courses)"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px]"
                    />
                  </div>
                  {/* Banner 2 */}
                  <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                    <div className="text-[9px] font-bold text-slate-500">下段通欄廣告 (課程列表下方)</div>
                    <div className="flex space-x-2 items-center">
                      <input 
                        type="text" 
                        value={secImage2.imageUrl}
                        onChange={(e) => setSecImage2({ ...secImage2, imageUrl: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px]"
                        placeholder="圖片網址"
                      />
                      <label className="bg-indigo-50 text-indigo-600 px-3 py-1 text-[10px] font-bold cursor-pointer select-none">
                        上傳 Banner
                        <input type="file" accept="image/*" onChange={(e) => handleGeneralImageUpload(e, (url) => setSecImage2({ ...secImage2, imageUrl: url }), 'banner2')} className="hidden" />
                      </label>
                    </div>
                    <input 
                      type="text" 
                      value={secImage2.link} 
                      onChange={(e) => setSecImage2({ ...secImage2, link: e.target.value })}
                      placeholder="跳轉路徑 (例如: /membership)"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center">
                    <Save className="w-4 h-4 mr-1.5" /> 儲存前台視覺設定
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 3:的上線與維護狀態 */}
      {activeModal === 'status' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">運作狀態管理</span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleSaveStatus} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">網站上上線狀態</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${siteStatus === 'online' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="siteStatus" 
                      value="online"
                      checked={siteStatus === 'online'}
                      onChange={() => setSiteStatus('online')}
                      className="sr-only"
                    />
                    正常運作中 (Online)
                  </label>
                  <label className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${siteStatus === 'maintenance' ? 'border-amber-600 bg-amber-50/30 text-amber-700' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="siteStatus" 
                      value="maintenance"
                      checked={siteStatus === 'maintenance'}
                      onChange={() => setSiteStatus('maintenance')}
                      className="sr-only"
                    />
                    維護模式 (Maintenance)
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">維護公告文字（顯示於前台）</label>
                <textarea 
                  rows={3}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="例如: 我們目前正在進行系統例行維護，預計將於明天早晨 06:00 完成。"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition resize-none leading-relaxed"
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-98 cursor-pointer">
                儲存狀態設定
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: FAQ Manager */}
      {activeModal === 'faq' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <span className="font-extrabold text-slate-800 text-xs">常見問題管理 (FAQ Editor)</span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {/* FAQ Form */}
              <form onSubmit={handleAddFaq} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase">{editingFaqIndex !== null ? '編輯問題' : '新增問題項目'}</div>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="輸入問題，例如：如何申請退款？"
                    value={faqForm.q}
                    onChange={(e) => setFaqForm({ ...faqForm, q: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    required
                  />
                  <textarea 
                    placeholder="輸入解答內容，以簡潔有力、條理清晰的文字描述..."
                    rows={2}
                    value={faqForm.a}
                    onChange={(e) => setFaqForm({ ...faqForm, a: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold resize-none"
                    required
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center cursor-pointer ml-auto">
                  <Plus className="w-3.5 h-3.5 mr-1" /> {editingFaqIndex !== null ? '更新項目' : '加入清單'}
                </button>
              </form>

              {/* FAQ Items List */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">常見問題清單 ({faqs.length})</div>
                {faqs.length > 0 ? (
                  faqs.map((faq, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 flex items-start justify-between space-x-3 shadow-xs hover:border-slate-200/80 transition">
                      <div className="text-left space-y-1">
                        <div className="text-xs font-bold text-slate-800 flex items-start">
                          <span className="text-indigo-500 font-extrabold mr-1.5">Q.</span> {faq.q}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold leading-relaxed pl-3.5">
                          {faq.a}
                        </div>
                      </div>
                      <div className="flex space-x-1 flex-shrink-0">
                        <button 
                          onClick={() => {
                            setEditingFaqIndex(idx);
                            setFaqForm(faq);
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFaq(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-400 italic text-[11px]">清單中尚無任何問答項目</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Announcement Manager */}
      {activeModal === 'announcement' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <span className="font-extrabold text-slate-800 text-xs">系統佈告欄公告發布</span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {/* Form */}
              <form onSubmit={handleAddAnnouncement} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase">{editingAnnouncementIndex !== null ? '編輯公告內容' : '發布全站公告'}</div>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="輸入公告標語或文字，例如：BDS 業務表達群組今日正式上線囉！"
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="跳轉連結路徑 (選填，例如：/membership)"
                    value={announcementForm.url}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, url: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center cursor-pointer ml-auto">
                  <Plus className="w-3.5 h-3.5 mr-1" /> {editingAnnouncementIndex !== null ? '儲存修改' : '發布公告'}
                </button>
              </form>

              {/* Announcements list */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">公告列表 ({announcements.length})</div>
                {announcements.length > 0 ? (
                  announcements.map((ann, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between space-x-3 shadow-xs hover:border-slate-200/80 transition">
                      <div className="text-left space-y-1">
                        <div className="text-xs font-bold text-slate-800">
                          {ann.content}
                        </div>
                        {ann.url && (
                          <div className="text-[9px] text-indigo-500 font-bold font-mono">
                            跳轉網址：{ann.url}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-1 flex-shrink-0">
                        <button 
                          onClick={() => {
                            setEditingAnnouncementIndex(idx);
                            setAnnouncementForm(ann);
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAnnouncement(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-400 italic text-[11px]">目前尚無任何公告項目</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Email templates config */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">郵件與系統通知設定</span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleSaveNotifications} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">管理員提醒收信信箱 (Admin Email)</label>
                <input 
                  type="email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">付款成功會員通知信主旨</label>
                <input 
                  type="text" 
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">付款成功會員通知信內容範本</label>
                <textarea 
                  rows={4}
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none resize-none leading-relaxed"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-98 cursor-pointer">
                儲存郵件設定
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: PayUni Gateways */}
      {activeModal === 'payout' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-slate-800 text-xs">PayUni 金流金鑰設定</span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleSavePayUni} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">商店代號 (MerID)</label>
                  <input 
                    type="text" 
                    value={merId}
                    onChange={(e) => setMerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">API 版本</label>
                  <input 
                    type="text" 
                    value="2.0" 
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 outline-none"
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">HashKey</label>
                <input 
                  type="password" 
                  value={hashKey}
                  onChange={(e) => setHashKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">HashIV</label>
                <input 
                  type="password" 
                  value={hashIv}
                  onChange={(e) => setHashIv(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">金流運行環境</label>
                <div className="flex space-x-6 pt-1">
                  <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payuniMode" 
                      value="sandbox"
                      checked={payuniMode === 'sandbox'} 
                      onChange={() => setPayuniMode('sandbox')}
                      className="w-4 h-4 text-indigo-600 border-slate-300 mr-2" 
                    />
                    測試環境 (Sandbox)
                  </label>
                  <label className="flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payuniMode" 
                      value="production"
                      checked={payuniMode === 'production'} 
                      onChange={() => setPayuniMode('production')}
                      className="w-4 h-4 text-indigo-600 border-slate-300 mr-2" 
                    />
                    正式環境 (Production)
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-98 cursor-pointer">
                儲存金流參數
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
