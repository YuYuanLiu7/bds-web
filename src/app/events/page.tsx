import { getSiteSettingsServer } from "@/lib/site-settings";
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowLeft, ArrowRight } from 'lucide-react';

export const revalidate = 0;

export default async function EventsPage() {
  const settings = await getSiteSettingsServer();
  const primaryColor = settings.primaryColor || '#21448e';

  // Synchronized with admin mock data
  const events = [
    { id: '1', title: 'BDS 半導體業務核心思維實戰營', date: '2026-06-15 14:00', location: '線上直播 (Zoom)', attendees: 48, status: 'upcoming', type: '付費活動', price: 'NT$ 1,980', desc: '專門為半導體上中下游業務人員設計的核心思維實戰營，帶您突破業績瓶頸與大客戶談判。' },
    { id: '2', title: '醫材商務開發與法規布局沙龍', date: '2026-05-18 19:30', location: '台北市大安區信義路四段', attendees: 32, status: 'completed', type: '付費活動', price: 'NT$ 800', desc: '匯聚生技與醫材領域商務開發專家，深度剖析法規申請流程與海內外代理商通路布局策略。' },
    { id: '3', title: 'BDS 爐邊對話：硬體 ODM 的全球銷售戰略', date: '2026-04-10 20:00', location: '線上直播 (Zoom)', attendees: 75, status: 'completed', type: '免費活動', price: '免費報名', desc: '爐邊對談特別場——特邀業界高階銷售主管，分享硬體製造與全球品牌客戶銷售談判的實戰心法。' }
  ];

  const formatTaiwanDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    const hr = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yr}年${mo}月${dy}日 ${hr}:${min}`;
  };

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
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">實體沙龍與線上直播講座</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">活動列表</h1>
            <p className="text-white/70 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
              透過線下沙龍、線上研討會與產業小聚，建立高端人脈網絡，與業界資深專家面對面交流實戰心法。
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4 select-none">
          <h2 className="text-lg font-black text-slate-800 flex items-center">
            <span className="w-1.5 h-5 bg-[#21448e] rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
            近期活動 ({events.filter(e => e.status === 'upcoming').length}) & 歷屆回顧
          </h2>
          <span className="text-xs text-slate-400 font-bold">精選優質產業聚會</span>
        </div>

        <div className="space-y-8">
          {events.map((event) => (
            <div 
              key={event.id}
              className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-md hover:border-slate-200/50 transition duration-300 group"
            >
              <div className="space-y-4 flex-1">
                {/* Badges */}
                <div className="flex items-center space-x-2 select-none">
                  {event.status === 'upcoming' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-wider">
                      開放報名中
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-wider">
                      活動已圓滿結束
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 font-extrabold text-[10px]">
                    {event.type}
                  </span>
                  <span className="text-xs font-extrabold text-[#21448e] pl-1" style={{ color: primaryColor }}>
                    {event.price}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 group-hover:text-[#21448e] transition duration-200" style={{ groupHover: { color: primaryColor } } as any}>
                    {event.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed max-w-3xl">
                    {event.desc}
                  </p>
                </div>

                {/* Details Bar */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-semibold pt-1 select-none">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5 text-slate-300" />
                    <span>{formatTaiwanDate(event.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-slate-300" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1.5 text-slate-300" />
                    <span>已累積報名：<strong className="text-slate-700">{event.attendees}人</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full lg:w-auto flex-shrink-0">
                {event.status === 'upcoming' ? (
                  <button 
                    style={{ backgroundColor: primaryColor }}
                    className="w-full lg:w-auto text-white px-8 py-3.5 rounded-2xl font-black text-xs shadow-xs hover:opacity-90 active:scale-95 transition flex items-center justify-center cursor-pointer"
                  >
                    立即線上報名 <ArrowRight className="w-4 h-4 ml-1.5" />
                  </button>
                ) : (
                  <button 
                    className="w-full lg:w-auto bg-slate-50 border border-slate-200 text-slate-400 px-8 py-3.5 rounded-2xl font-extrabold text-xs cursor-not-allowed select-none"
                    disabled
                  >
                    活動已圓滿結束
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
