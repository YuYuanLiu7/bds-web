import { BookOpen, Users, Award, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: '關於我們 | BDS By Doing So - 專業職涯與產業學習平台',
  description: 'BDS By Doing So 專注於半導體、醫療器材、硬體科技產業的業務開發與銷售實務課程，致力於縮短產學落差。',
};

export default function AboutPage() {
  const coreValues = [
    {
      icon: BookOpen,
      title: '實戰導向教學',
      desc: '我們拒絕純理論，所有課程均由具備多年產業銷售與商務開發經驗的資深經理人親自授課。'
    },
    {
      icon: Users,
      title: '多元共好社群',
      desc: '串聯硬體、半導體、生醫科技等領域的業務夥伴，提供跨界交流、人脈拓展與求職轉職的強力後盾。'
    },
    {
      icon: Award,
      title: '縮短產學落差',
      desc: '針對文組跨領域、新手業務、轉職科技業的痛點設計學程，提供能直接應用於職場的實用工具。'
    },
    {
      icon: ShieldCheck,
      title: '高品質內容把關',
      desc: '從線上影音學程、實體線下講座到深度讀書會，皆經過教學設計優化，確保最高學習成效。'
    }
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-20 font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-indigo-200/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[550px] h-[550px] bg-sky-200/10 rounded-full blur-[130px] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-6 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-4">
          關於我們
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
          業務不是超人，<br className="md:hidden" />卻有超能力！
        </h1>
        <p className="text-slate-600 max-w-2.5xl mx-auto text-base md:text-lg leading-relaxed font-medium">
          BDS By Doing So 是一個專為「硬體科技、半導體、生醫材料及跨領域商務開發」量身打造的實戰學習平台。
          我們深信真正的專業來自於實踐與經驗傳承，協助每一位渴望躍升的夥伴實現職場轉型與能力升級。
        </p>
      </section>

      {/* Content Section - Story */}
      <section className="py-12 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">
            我們的起源與使命
          </h2>
          <div className="text-slate-600 space-y-4 text-sm md:text-base leading-relaxed font-medium">
            <p>
              在高度競爭的 B2B 與科技產業中，一名優秀的業務（Account Manager / Business Development）往往是企業成長的最關鍵推手。然而，學校教育與坊間課程卻極少涵蓋真正的科技產業銷售實務。
            </p>
            <p>
              BDS (By Doing So) 因而誕生。我們集結了科技大廠、外商及醫療器材產業的實戰經理人，以最接地氣的視角，提煉出能夠立即應用的實戰心法，幫助學員少走彎路、加速晉升。
            </p>
            <p>
              我們不只賣課程，更在建立一個高黏著度、資源互通的「科技與生醫商務人才生態圈」，讓所有走在業務與開發路上的夥伴，都能在此找到方向與隊友。
            </p>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-8 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center font-extrabold text-indigo-600 text-lg">
                B
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800">By Doing So</h3>
                <p className="text-slate-400 text-xs font-semibold">專業職涯與產業學習平台</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>專注產業</span>
                <span className="text-slate-800 font-bold">半導體 / 醫療器材 / 硬體科技</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>核心學程</span>
                <span className="text-slate-800 font-bold">業務新手村 / 職場升級 / 讀書會</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>創辦理念</span>
                <span className="text-slate-800 font-bold">實踐中學習 (By Doing So)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 max-w-5xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 text-center mb-12">
          我們的核心堅持
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {coreValues.map((val, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-2xl shadow-xs space-y-4 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <val.icon className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">{val.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-semibold">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
