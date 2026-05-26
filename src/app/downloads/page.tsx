import { getSiteSettingsServer } from "@/lib/site-settings";
import Link from 'next/link';
import { Download, ArrowLeft, ArrowRight, ShieldCheck, FileText, Layout } from 'lucide-react';

export const revalidate = 0;

export default async function DownloadsPage() {
  const settings = await getSiteSettingsServer();
  const primaryColor = settings.primaryColor || '#21448e';

  // Synchronized with admin mock data
  const downloads = [
    { 
      id: '1', 
      title: 'BDS 獨家：半導體高階業務求職信與履歷模板', 
      downloads: 125, 
      price: 'NT$ 499', 
      type: 'PDF 文件',
      icon: FileText,
      desc: '針對半導體設備、IC 通路、代工廠業務職缺量身打造的英文履歷與動機信模板，助您脫穎而出。'
    },
    { 
      id: '2', 
      title: '硬體產業 ODM 生意開發策略白皮書 (2026 最新版)', 
      downloads: 86, 
      price: 'NT$ 1,200', 
      type: 'PDF/PPT 簡報',
      icon: Layout,
      desc: '深度解析電子製造與 ODM 大廠商務拓展核心方法論，包含客戶導入、RFQ 報價與銷售談判策略。'
    },
    { 
      id: '3', 
      title: '外商商務開發面試經典 50 問與模擬解題手冊', 
      downloads: 234, 
      price: 'NT$ 699', 
      type: 'PDF 電子書',
      icon: ShieldCheck,
      desc: '由資深外商 BD 總監編寫，涵蓋 50 個經典面試提問、Star 原則回答公式與商務思維模擬解密。'
    }
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen pb-16 font-sans">
      
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
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">實戰模板、工具白皮書與手冊</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">數位資源下載</h1>
            <p className="text-white/70 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
              提供即裝即用的專業履歷模板、生意開發策略白皮書與經典面試手冊，助您在職場快速躍升。
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4 select-none">
          <h2 className="text-lg font-black text-slate-800 flex items-center">
            <span className="w-1.5 h-5 bg-[#21448e] rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
            可選購數位資源 ({downloads.length})
          </h2>
          <span className="text-xs text-slate-400 font-bold">付款後即可永久下載使用</span>
        </div>

        {/* Card list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {downloads.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-200/50 transition duration-300 group text-left"
            >
              <div className="space-y-4">
                {/* Visual Icon Header */}
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center select-none" style={{ backgroundColor: `${primaryColor}08`, color: primaryColor }}>
                  <item.icon className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 select-none">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-150 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center">
                      <Download className="w-3 h-3 mr-0.5" /> 已下載 {item.downloads} 次
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 leading-snug group-hover:text-[#21448e] transition duration-200" style={{ groupHover: { color: primaryColor } } as any}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Pricing & Checkout Actions */}
              <div className="border-t border-slate-50 pt-5 mt-6 flex items-center justify-between select-none">
                <span className="text-lg font-black text-slate-800">
                  {item.price}
                </span>
                <button 
                  style={{ backgroundColor: primaryColor }}
                  className="text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:opacity-90 active:scale-95 transition flex items-center cursor-pointer"
                >
                  立即選購 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
