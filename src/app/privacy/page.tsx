'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, FileText } from 'lucide-react';

// 後台 CMS 頁面內容（/api/settings?key=pages 回傳項目）
interface CmsPage {
  path: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
}

export default function PrivacyPage() {
  const [pageData, setPageData] = useState({
    title: '服務條款與隱私權政策',
    subtitle: '法律與條約規定說明',
    content: '歡迎您使用 BDS By Doing So（以下簡稱「本平台」）。本服務條款旨在規範本平台與註冊會員（以下簡稱「會員」）之間的權利義務關係。當您註冊成為本平台會員或開始使用本平台提供的付費/免費課程時，即表示您已閱讀、理解並同意接受本條款之所有內容。',
  });

  useEffect(() => {
    // 從伺服器讀取頁面內容（後台 CMS 編輯後對所有訪客生效）
    fetch('/api/settings?key=pages')
      .then(res => (res.ok ? res.json() : null))
      .then(list => {
        const item = Array.isArray(list) ? list.find((p: CmsPage) => p.path === '/privacy') : null;
        if (item) {
          setPageData({
            title: item.title || '服務條款與隱私權政策',
            subtitle: item.subtitle || '法律與條約規定說明',
            content: item.content || '',
          });
        }
      })
      .catch(err => console.warn('Failed to load page content:', err));
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-20 font-sans relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-indigo-200/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[550px] h-[550px] bg-sky-200/10 rounded-full blur-[130px] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <section className="py-12 md:py-20 max-w-4xl mx-auto px-6 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-4">
          法律與條約
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4 whitespace-pre-line">
          {pageData.title}
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-semibold whitespace-pre-line">
          {pageData.subtitle}
        </p>
      </section>

      {/* Main Content Sections */}
      <section className="max-w-4xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Quick Navigation */}
        <aside className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3 sticky top-24">
          <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-50">快速導覽</h3>
          <nav className="space-y-1">
            <a href="#terms" className="flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
              <FileText className="w-3.5 h-3.5 mr-2 text-indigo-500" /> 使用者服務條款
            </a>
            <a href="#privacy" className="flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
              <Shield className="w-3.5 h-3.5 mr-2 text-sky-500" /> 隱私權保護政策
            </a>
            <a href="#refund" className="flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
              <Lock className="w-3.5 h-3.5 mr-2 text-emerald-500" /> 退費與購買須知
            </a>
          </nav>
        </aside>

        {/* Right Side Content Areas */}
        <div className="lg:col-span-8 space-y-10 bg-white border border-slate-100 p-8 rounded-3xl shadow-xs">
          
          {/* Section 1: Terms */}
          <div id="terms" className="space-y-4 scroll-mt-24">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" /> 1. 使用者服務條款與平台說明
            </h2>
            <div className="text-slate-600 text-xs md:text-sm leading-relaxed space-y-3 font-medium whitespace-pre-line">
              <p>{pageData.content}</p>
              
              <h3 className="font-bold text-slate-700 mt-4">一、帳號安全與使用規範</h3>
              <p>
                會員註冊時應提供真實、完整之個人資料。會員帳號僅限註冊者本人使用，不得轉讓、出借或與他人共用。若因帳號外洩導致權益受損，本平台不負賠償責任。
              </p>
              <h3 className="font-bold text-slate-700 mt-2">二、智慧財產權聲明</h3>
              <p>
                本平台上所有課程影片、文字講義、圖表、下載檔案等，其智慧財產權及著作權均屬本平台或其授權權利人所有。未經事前書面許可，嚴禁進行錄影、下載（除標明可下載之資源外）、重製、散佈或進行任何商業性使用。違反者本平台將依法追究刑事與民事賠償責任。
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Privacy */}
          <div id="privacy" className="space-y-4 scroll-mt-24">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-sky-500" /> 2. 隱私權保護政策
            </h2>
            <div className="text-slate-600 text-xs md:text-sm leading-relaxed space-y-3 font-medium">
              <p>
                本平台極為重視您的隱私權。我們將依據中華民國個人資料保護法及相關法令，收集、處理及利用您的個人資料。
              </p>
              <h3 className="font-bold text-slate-700 mt-2">一、個人資料的收集範圍</h3>
              <p>
                當您註冊帳號、購買課程、瀏覽網站或參與問答時，我們可能會收集您的：姓名、電子郵件信箱、聯絡電話、交易資訊（不包含完整的信用卡卡號，金流處理均由 PayUni 負責加密傳輸）等。
              </p>
              <h3 className="font-bold text-slate-700 mt-2">二、資料的利用目的與期間</h3>
              <p>
                所收集的資料主要用於：開通課程權限、發送訂單交易明細與電子發票通知、提供客戶服務、寄送課程異動或行銷優惠訊息。我們將於本平台營運期間內妥善保存您的資料，絕不向第三方出售或洩漏您的個人隱私資料。
              </p>
              <h3 className="font-bold text-slate-700 mt-2">三、資料的安全防護</h3>
              <p>
                本平台資料庫架設於 Supabase Cloud，並採取業界標準的加密傳輸協定（HTTPS/TLS）與資料庫防火牆，確保您的資料免受未授權之存取與竄改。
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Refund */}
          <div id="refund" className="space-y-4 scroll-mt-24">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-emerald-500" /> 3. 退費與購買須知
            </h2>
            <div className="text-slate-600 text-xs md:text-sm leading-relaxed space-y-3 font-medium">
              <p>
                為保障雙方權益，本平台之數位內容課程退費規範如下：
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>購買之線上影音課程，如尚未觀看任何章節影片，得於購買後 7 日內申請全額退費。</li>
                <li>若已觀看、點擊播放任何章節影片，或下載隨課附贈之教材資源，即視為已開始使用數位內容服務，恕不接受退費申請。</li>
                <li>訂閱制會員方案（如月繳/年繳），得隨時於後台取消下次扣款訂閱，但已扣款之當期服務恕不按比例退費。</li>
              </ul>
              <p className="text-xs text-slate-400 font-semibold mt-2">
                * 退費申請請來信至客服信箱：bydoingso@gmail.com，並附上您的帳號（Email）與訂單編號。
              </p>
            </div>
          </div>

        </div>

      </section>
    </div>
  );
}
