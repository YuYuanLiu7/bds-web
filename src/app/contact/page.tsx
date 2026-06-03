'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '課程諮詢',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '課程諮詢',
        message: ''
      });
    }, 1000);
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-20 font-sans relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-indigo-200/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[20%] right-[5%] w-[550px] h-[550px] bg-sky-200/10 rounded-full blur-[130px] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <section className="py-12 md:py-20 max-w-4xl mx-auto px-6 text-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs mb-4">
          聯絡我們
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
          有任何問題？我們隨時為您解答
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-semibold max-w-lg mx-auto leading-relaxed">
          不論是關於課程內容、付費方式、企業包班或是商務合作諮詢，歡迎填寫表單或直接寄信至我們的信箱。
        </p>
      </section>

      {/* Main Grid */}
      <section className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Contact Cards */}
        <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">客服與合作信箱</h3>
              <p className="text-slate-400 text-xs mt-1 font-semibold">任何諮詢將於 1-2 個工作天內回覆</p>
              <a href="mailto:bydoingso@gmail.com" className="text-indigo-600 font-bold text-xs hover:underline mt-2 block">
                bydoingso@gmail.com
              </a>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">常見問答 FAQ</h3>
              <p className="text-slate-400 text-xs mt-1 font-semibold">快速尋求關於課程開通、退費、觀看權限解答</p>
              <a href="/help" className="text-sky-600 font-bold text-xs hover:underline mt-2 block">
                前往常見問答 ↗
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#21448e] to-indigo-800 p-6 rounded-2xl shadow-md text-white space-y-2">
            <h4 className="font-black text-sm">BDS By Doing So</h4>
            <p className="text-[11px] text-indigo-200 leading-relaxed font-semibold">
              「業務不是超人，卻有超能力！」<br />
              讓我們在實踐中前行，一同躍升為高產值、高影響力的商務菁英。
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Form */}
        <div className="md:col-span-7 bg-white border border-slate-100 p-8 rounded-3xl shadow-xs">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-800 text-lg">信件已成功送出！</h3>
              <p className="text-slate-500 text-xs font-semibold max-w-xs leading-relaxed">
                感謝您的來信，BDS 團隊成員將會於 1-2 個工作天內，寄送回信至您填寫的信箱。
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-md transition active:scale-98 cursor-pointer"
              >
                再次填寫表單
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">您的姓名</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="請輸入姓名"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">電子郵件信箱</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">諮詢主題</label>
                <select 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition"
                >
                  <option value="課程諮詢">課程諮詢與權限</option>
                  <option value="付款與退費">付款、發票與退費</option>
                  <option value="企業合作">企業內訓與商務包班</option>
                  <option value="講師招募">講師招募與提案</option>
                  <option value="其他問題">其他意見與回饋</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">訊息內容</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="請詳述您的問題或合作想法..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center cursor-pointer"
              >
                {loading ? (
                  <span>發送中...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> 送出聯絡訊息
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </section>
    </div>
  );
}
