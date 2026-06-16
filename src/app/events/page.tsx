'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Search, 
  Layers, 
  Wrench, 
  BookOpen, 
  Coffee,
  Sparkles, 
  Clock 
} from 'lucide-react';

export default function EventsPage() {
  const [primaryColor, setPrimaryColor] = useState('#21448e');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<any[]>([]);

  // Default mock events as a robust failsafe fallback
  const MOCK_EVENTS = [
    { 
      id: '1', 
      title: 'BDS 半導體業務核心思維實戰營', 
      date: '2026-06-15 14:00', 
      location: '線上直播 (Zoom)', 
      attendees: 48, 
      status: 'upcoming', 
      type: '線上實戰營', 
      category: '工作坊',
      price: 'NT$ 1,980', 
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
      desc: '專門為半導體上中下游業務人員設計的核心思維實戰營，帶您突破業績瓶頸與大客戶談判。',
      registration_url: 'https://zoom.us'
    },
    { 
      id: '2', 
      title: '醫材商務開發與法規布局沙龍', 
      date: '2026-05-18 19:30', 
      location: '台北市大安區信義路四段', 
      attendees: 32, 
      status: 'completed', 
      type: '線下沙龍', 
      category: '線下聚會',
      price: 'NT$ 800', 
      imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
      desc: '匯聚生技與醫材領域商務開發專家，深度剖析法規申請流程與海內外代理商通路布局策略。',
      registration_url: ''
    },
    { 
      id: '3', 
      title: 'BDS 爐邊對話：硬體 ODM 的全球銷售戰略', 
      date: '2026-04-10 20:00', 
      location: '線上直播 (Zoom)', 
      attendees: 75, 
      status: 'completed', 
      type: '線上講座', 
      category: '線上讀書會',
      price: '免費活動', 
      imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
      desc: '爐邊對談特別場——特邀業界高階銷售主管，分享硬體製造與全球品牌客戶銷售談判的實戰心法。',
      registration_url: ''
    }
  ];

  useEffect(() => {
    // 1. Fetch site settings
    fetch('/api/admin/site-settings')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch settings');
      })
      .then(data => {
        setPrimaryColor(data.primaryColor || '#21448e');
      })
      .catch(err => console.warn("Using default settings in Events page:", err));

    // 2. Fetch dynamic database events
    fetch('/api/events')
      .then(async res => {
        if (!res.ok) throw new Error('API response not ok');
        const data = await res.json();
        if (Array.isArray(data)) {
          // Map database snake_case fields to frontend camelCase expectations
          const mapped = data.map((e: any) => ({
            id: e.id,
            title: e.title,
            desc: e.description || e.desc || '',
            imageUrl: e.image_url || e.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
            price: e.price_display || (typeof e.price === 'number' ? (e.price === 0 ? '免費活動' : `NT$ ${e.price.toLocaleString()}`) : e.price),
            date: e.date,
            location: e.location || '',
            attendees: e.attendees || 0,
            status: e.status || 'upcoming',
            type: e.type || '',
            category: e.category || '',
            registration_url: e.registration_url || e.registrationUrl || ''
          }));
          setEvents(mapped);
        } else {
          throw new Error('Data is not an array');
        }
      })
      .catch(err => {
        console.warn("Using fallback mock data for events (database table not yet created):", err);
        setEvents(MOCK_EVENTS);
      });
  }, []);

  // Compute categories dynamically based on loaded events to ensure modularity
  const categories = ['全部', ...Array.from(new Set(events.map(e => e.category).filter(Boolean)))];

  const formatTaiwanDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      const hr = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const wDay = weekDays[d.getDay()];

      return `${yr}/${mo}/${dy} (${wDay}) ${hr}:${min}`;
    } catch {
      return dateStr;
    }
  };

  const handleTabChange = (tab: 'upcoming' | 'completed') => {
    setActiveTab(tab);
    setSelectedCategory('全部');
  };

  const handleRegistration = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('感謝您的關注！此活動的報名連結即將上線，敬請期待。如需預訂席位，歡迎直接聯絡 BDS 團隊！');
    }
  };

  // Filter events by tab, category, and search query
  const filteredEvents = events.filter(e => {
    const matchesTab = e.status === activeTab;
    const matchesCategory = selectedCategory === '全部' || e.category === selectedCategory;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });


  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-20 font-sans text-slate-700 relative overflow-hidden">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[320px] left-[5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[580px] right-[5%] w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      
      {/* Dynamic Teachify-style Hero Banner */}
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
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">實體沙龍小聚與線上直播實戰營</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">所有活動</h1>
            <p className="text-white/70 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
              透過高密度的交流研討，建立高端業務人脈圈，與硬體、半導體與醫材領域的資深專家共同修煉。
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1200px] mx-auto px-6 py-12 space-y-8">
        
        {/* Search & Tabs Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-100 pb-6 gap-6 select-none">
          
          {/* Status Tabs */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => handleTabChange('upcoming')}
              style={{
                backgroundColor: activeTab === 'upcoming' ? primaryColor : 'transparent',
                color: activeTab === 'upcoming' ? '#ffffff' : '#64748B'
              }}
              className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-xs font-black transition duration-200 cursor-pointer text-center`}
            >
              進行中
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              style={{
                backgroundColor: activeTab === 'completed' ? primaryColor : 'transparent',
                color: activeTab === 'completed' ? '#ffffff' : '#64748B'
              }}
              className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-xs font-black transition duration-200 cursor-pointer text-center`}
            >
              已結束
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="搜尋活動關鍵字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition shadow-xs"
            />
          </div>

        </div>

        {/* 2. Responsive Side-by-Side Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Column: Sidebar Category Selector */}
          <div className="lg:col-span-1 space-y-4 select-none">
            <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/70 shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 text-xs pb-3 border-b border-slate-50 uppercase tracking-wider flex items-center">
                <span className="w-1.5 h-4 bg-[#21448e] rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
                活動分類
              </h3>

              {/* Desktop Vertical Menu */}
              <div className="hidden lg:flex flex-col space-y-1.5 text-xs font-bold">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  // Dynamic counts based on tab status
                  const count = cat === '全部'
                    ? events.filter(e => e.status === activeTab).length
                    : events.filter(e => e.status === activeTab && e.category === cat).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        backgroundColor: isActive ? primaryColor : 'transparent',
                        color: isActive ? '#ffffff' : '#64748B'
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition duration-200 text-left border border-transparent ${
                        isActive
                          ? 'shadow-xs font-extrabold'
                          : 'bg-white hover:bg-slate-50 hover:text-slate-800'
                      } cursor-pointer`}
                    >
                      <div className="flex items-center space-x-2">
                        {cat === '全部' && <Layers className="w-4 h-4" />}
                        {cat === '工作坊' && <Wrench className="w-4 h-4" />}
                        {cat === '線上讀書會' && <BookOpen className="w-4 h-4" />}
                        {cat === '線下聚會' && <Coffee className="w-4 h-4" />}
                        <span>{cat}</span>
                      </div>
                      <span 
                        className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-50 border border-slate-100 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Horizontal scroll layout */}
              <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  const count = cat === '全部'
                    ? events.filter(e => e.status === activeTab).length
                    : events.filter(e => e.status === activeTab && e.category === cat).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        backgroundColor: isActive ? primaryColor : 'transparent',
                        color: isActive ? '#ffffff' : '#64748B'
                      }}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl border border-transparent transition duration-200 ${
                        isActive
                          ? 'shadow-xs font-extrabold'
                          : 'bg-slate-50 hover:bg-slate-100 hover:text-slate-800'
                      } cursor-pointer`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Right Column: Main list of cards */}
          <div className="lg:col-span-3">
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col group hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-300 transition-all duration-300 text-left"
                  >
                    {/* Event Cover Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50 select-none">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Badge */}
                      <span
                        style={{ backgroundColor: primaryColor }}
                        className="absolute top-4 left-4 text-white text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg"
                      >
                        {event.type}
                      </span>

                      {event.status === 'completed' && (
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white backdrop-blur-xs font-black text-xs md:text-sm tracking-wider uppercase">
                          已圓滿結束
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Info */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between select-none">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{event.category}</span>
                          <span className="text-[9px] text-[#21448e] font-black px-2 py-0.5 rounded bg-[#21448e]/5" style={{ color: primaryColor, backgroundColor: `${primaryColor}08` }}>{event.type}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 leading-snug group-hover:text-[#21448e] transition duration-200 line-clamp-2">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">
                          {event.desc}
                        </p>

                        {/* Metadata lines */}
                        <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-400 font-semibold select-none">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-slate-300" />
                            <span>{formatTaiwanDate(event.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-slate-300" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-slate-300" />
                            <span>已累積報名：<strong className="text-slate-600 font-black">{event.attendees}人</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing and Action row */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50 select-none">
                        <span className="text-base font-black text-slate-800">
                          {event.price}
                        </span>
                        
                        {event.status === 'upcoming' ? (
                          <button
                            onClick={() => handleRegistration(event.registration_url)}
                            style={{ backgroundColor: primaryColor }}
                            className="text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:opacity-90 active:scale-95 transition cursor-pointer"
                          >
                            立即報名
                          </button>
                        ) : (
                          <span className="bg-slate-50 border border-slate-200 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">
                            已結束
                          </span>
                        )}
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center bg-white/90 backdrop-blur-md border border-slate-200/70 rounded-3xl p-16 select-none shadow-sm space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-base">目前尚無此分類之活動</h3>
                  <p className="text-slate-400 text-xs font-semibold">該分類在此狀態下目前暫無活動，請嘗試切換「進行中/已結束」或改選其他活動分類。</p>
                </div>
                <button
                  onClick={() => { setSelectedCategory('全部'); setSearchQuery(''); }}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer"
                >
                  重設分類篩選
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
