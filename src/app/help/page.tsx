'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react';

export default function HelpFAQPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#21448e');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch settings');
      })
      .then(data => {
        setLogoUrl(data.logoUrl || '');
        setPrimaryColor(data.primaryColor || '#21448e');
      })
      .catch(err => console.warn("Using default settings in FAQ page:", err));

    // Load FAQs
    const saved = localStorage.getItem('bds_faqs');
    if (saved) {
      try {
        setFaqs(JSON.parse(saved));
      } catch (e) {
        setFaqs(DEFAULT_FAQS);
      }
    } else {
      setFaqs(DEFAULT_FAQS);
    }
  }, []);

  const DEFAULT_FAQS = [
    {
      q: '如何開始選購與學習 BDS 的實戰課程？',
      a: '您只需在 BDS 首頁或課程列表頁面中，點選您感興趣的課程。點擊「立即購買」或「立即選購」後，系統會自動引導您進入 PayUni 安全金流結帳流程。付款完成後，系統會即時開通您的權限，您可以在頂端點擊「我的學習」直接開始看課觀看影片！'
    },
    {
      q: 'BDS 平台支援哪些付款方式？',
      a: 'BDS 目前唯一指定與台灣領先金流平台 PayUni（統一金流）合作。我們支援「信用卡線上一次付清」與「ATM 虛擬帳號轉帳匯款」。所有交易皆通過 256-bit SSL 資訊安全加密，保證您的付款資訊百分之百安全無虞。'
    },
    {
      q: '購買課程後，觀看期限是多久？可以退款嗎？',
      a: '在 BDS 購買的任何單門實戰課程皆享有「終身無限次觀看」的權益，沒有時間與次數限制。由於數位內容與影音商品在購買開通後即可完整觀看，若您有特殊的個人因素退款需求，請在購買後 7 天內（且觀看進度不超過第一章節 10%）與我們聯絡，我們將由專人為您審核辦理。'
    },
    {
      q: '付款完成後，我該如何確認我的課程已經開通？',
      a: '當您完成信用卡付款或 ATM 轉帳匯款成功後，PayUni 金流系統會發送通知給我們，系統會在 1 秒鐘內自動為您的註冊帳號開通對應課程權限。您可以登入後至頂端點選「我的學習」確認；同時您也會在您的信箱中收到一封訂單成立與權限開通的通知信件。'
    },
    {
      q: '我們有學員專屬的交流社群或 Discord 群組嗎？',
      a: '有的！BDS 非常重視學員的實戰交流。凡是購買過 BDS 任一課程或訂閱方案的學員，皆可在課程學習播放器的公告區或您的電子郵件信箱中，獲得專屬「Discord 業務表達與 BD 核心沙龍交流群」的邀請連結。在這裡您可以隨時向講師提問，並與數百位同行精英交流合作！'
    }
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-16 font-sans relative overflow-hidden">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[320px] left-[5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[580px] right-[5%] w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      
      {/* Header */}
      <div 
        style={{ backgroundColor: primaryColor }}
        className="w-full text-white py-16 px-6 relative overflow-hidden select-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto space-y-4 relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 回首頁
          </Link>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">常見問答與常見技術排障</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">常見問答 (FAQ)</h1>
            <p className="text-white/70 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
              如果您在購買、帳號開通、金流結帳或看課播放過程中遇到任何疑問，都可以在下方找到最快速的解答。
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[800px] mx-auto px-6 py-16 space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 select-none mb-8">
          <h2 className="text-lg font-black text-slate-800 flex items-center">
            <span className="w-1.5 h-5 bg-[#21448e] rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
            解決您的所有疑問 ({faqs.length})
          </h2>
          <span className="text-xs text-slate-400 font-bold">常見技術與售後問題</span>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden transition-all duration-300"
            >
              {/* Question Trigger */}
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer group"
              >
                <div className="flex items-start space-x-3 pr-4">
                  <HelpCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                  <span className="text-xs sm:text-sm font-black text-slate-700 group-hover:text-slate-900 transition leading-snug">
                    {faq.q}
                  </span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                    openIndex === idx ? 'transform rotate-180 text-indigo-500' : ''
                  }`} 
                  style={{ color: openIndex === idx ? primaryColor : undefined }}
                />
              </button>

              {/* Answer Box */}
              {openIndex === idx && (
                <div className="px-6 pb-5 pt-1 pl-[38px] border-t border-slate-50 text-xs sm:text-xs text-slate-400 font-semibold leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  {faq.a}
                </div>
              )}

            </div>
          ))}
        </div>

        {/* Support Card */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/70 rounded-3xl p-8 text-center select-none shadow-sm mt-12 space-y-4 max-w-lg mx-auto">
          <div className="text-xs font-black text-slate-800">仍未找到您的解答？</div>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            我們非常樂意為您解答！如果您有任何特殊的合作洽談、企業包班需求或金流疑問，請隨時來信至我們的客服信箱，我們將於 24 小時內儘速回覆。
          </p>
          <Link 
            href="/contact"
            style={{ backgroundColor: primaryColor }}
            className="inline-block text-white text-xs font-bold px-8 py-3 rounded-2xl shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer text-center"
          >
            立即聯絡我們
          </Link>
        </div>

      </div>

    </div>
  );
}
