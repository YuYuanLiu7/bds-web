'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { SiteSettings } from '@/lib/site-settings';
import { Course } from '@/lib/types';
import SafeImage from '@/components/SafeImage';
import { useSettings } from '@/components/SettingsProvider';

// 僅取用到的 session 欄位；目前首頁未直接使用 session，保留以維持呼叫端介面相容
interface SessionLike {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface HomeClientProps {
  settings: SiteSettings;
  courses: Course[];
  session: SessionLike | null;
}

export default function HomeClient({ settings, courses }: HomeClientProps) {
  // Carousel states
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = settings.carouselSlides || [];

  // Course Filter state
  const [selectedCategory, setSelectedCategory] = useState('全部');

  // Automatic slide playing
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // 僅顯示資料庫中的真實課程，無資料時觸發下方空狀態（不使用假課程後援資料）
  const displayedCourses = courses.map(c => ({
    id: c.id,
    title: c.title,
    price: c.price,
    category: c.category || '精選',
    thumbnail_url: c.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    instructor: 'BDS 團隊'
  }));

  // 分類清單由實際課程的 category 動態產生，避免硬編字串與資料不符
  const categories = ['全部', ...Array.from(new Set(displayedCourses.map(c => c.category)))];
  const filteredCourses = selectedCategory === '全部'
    ? displayedCourses
    : displayedCourses.filter(c => c.category === selectedCategory);

  // 維護狀態改由 Context（root layout 伺服器端取一次）提供，不再每次進首頁各自 fetch
  const { general } = useSettings();
  const maintenance = general?.siteStatus === 'maintenance';
  const mMsg = (general?.maintenanceMessage as string) || '系統升級維護中，請稍後再試。';

  const primaryColor = settings.primaryColor || '#21448e';

  if (maintenance) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden select-none">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-indigo-200/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 p-8 md:p-12 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-800">平台升級維護中</h1>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {mMsg}
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-4">
            BDS By Doing So 營運團隊 敬上
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-white">
      
      {/* 1. Hero Carousel Banner Slider */}
      {slides.length > 0 && (
        <section className="relative w-full overflow-hidden select-none bg-slate-50">
          
          {/* Main slides viewport */}
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
            {slides.map((slide, idx) => (
              <div 
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                  idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <Link href={slide.link || '/courses'} className="block w-full h-full group">
                  <SafeImage
                    src={slide.imageUrl}
                    alt={`輪播圖 ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                  />
                </Link>
              </div>
            ))}
          </div>

          {/* Left / Right arrow navigation controls */}
          {slides.length > 1 && (
            <>
              <button
                onClick={handlePrevSlide}
                aria-label="上一張輪播"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition focus:outline-none z-20 active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextSlide}
                aria-label="下一張輪播"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition focus:outline-none z-20 active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Bottom Dot controls */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`第 ${idx + 1} 張輪播`}
                  aria-current={idx === currentSlide}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-6 bg-white' : 'bg-white/50 hover:bg-white/80'
                  } focus:outline-none cursor-pointer`}
                />
              ))}
            </div>
          )}

        </section>
      )}

      {/* 2. Section Banner 1 (Between Slider and Courses list) */}
      {settings.sectionImage1?.imageUrl && (
        <section className="max-w-[1200px] mx-auto w-full px-6 pt-10 md:pt-14 select-none">
          <Link href={settings.sectionImage1.link || '/courses'} className="block overflow-hidden rounded-2xl shadow-sm border border-slate-100 group">
            <SafeImage
              src={settings.sectionImage1.imageUrl}
              alt="活動橫幅一"
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </Link>
        </section>
      )}

      {/* 3. Dynamic Courses List Grid */}
      <section className="max-w-[1200px] mx-auto w-full px-6 py-12 md:py-16">
        
        {/* Categories Tab Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-slate-100 pb-5 gap-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center select-none">
            <span className="w-1.5 h-6 bg-[var(--brand)] rounded-full mr-2.5"></span>
            所有課程
          </h2>
          
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold select-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{ 
                  backgroundColor: selectedCategory === cat ? primaryColor : 'transparent',
                  color: selectedCategory === cat ? '#ffffff' : '#64748B'
                }}
                className={`px-4 py-2 rounded-xl transition border border-transparent ${
                  selectedCategory === cat 
                    ? 'shadow-sm font-extrabold' 
                    : 'bg-slate-50 hover:bg-slate-100 hover:text-slate-800'
                } cursor-pointer`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Card Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md hover:border-slate-200/50 transition duration-300"
              >
                {/* Thumbnail Cover */}
                <Link href={`/courses/${course.id}`} className="block relative aspect-[16/9] w-full overflow-hidden bg-slate-50">
                  <SafeImage
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase select-none">
                    {course.category}
                  </div>
                </Link>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col text-left space-y-4">
                  <div className="space-y-1.5">
                    <Link 
                      href={`/courses/${course.id}`}
                      className="block font-black text-slate-800 hover:text-[var(--brand)] transition leading-snug line-clamp-2"
                    >
                      {course.title}
                    </Link>
                    <span className="block text-slate-400 font-semibold text-[11px]">
                      講師：{course.instructor}
                    </span>
                  </div>

                  {/* Pricing Footer */}
                  <div className="flex items-center justify-between pt-1 select-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">學習費用</span>
                    <span style={{ color: primaryColor }} className="text-lg font-black">
                      {course.price === 0 ? '免費領取' : `NT$ ${course.price.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 italic font-semibold select-none bg-slate-50/50 border border-dashed border-slate-100 rounded-3xl">
            此分類下目前尚無公開課程，敬請期待！
          </div>
        )}

      </section>

      {/* 4. Section Banner 2 (Between Courses list and Footer) */}
      {settings.sectionImage2?.imageUrl && (
        <section className="max-w-[1200px] mx-auto w-full px-6 pb-12 md:pb-16 select-none">
          <Link href={settings.sectionImage2.link || '/courses'} className="block overflow-hidden rounded-2xl shadow-sm border border-slate-100 group">
            <SafeImage
              src={settings.sectionImage2.imageUrl}
              alt="活動橫幅二"
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </Link>
        </section>
      )}

    </div>
  );
}
