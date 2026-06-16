'use client';

import { useState } from 'react';
import CourseCard from '@/components/CourseCard';

interface CourseItem {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  price: number;
  category?: string | null;
}

interface CoursesClientProps {
  courses: CourseItem[];
}

const CATEGORIES = ['全部', '產業知識', '職涯策略', '專業技能', '讀書會', '新手村'];

export default function CoursesClient({ courses }: CoursesClientProps) {
  const [activeCategory, setActiveCategory] = useState('全部');

  // 依分類篩選；「全部」顯示所有課程
  const filtered =
    activeCategory === '全部'
      ? courses
      : courses.filter((c) => (c.category || '') === activeCategory);

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2.5 mb-10 select-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-black transition duration-200 border shadow-xs cursor-pointer ${
              cat === activeCategory
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white/80 backdrop-blur-md text-slate-600 border-slate-200/70 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length > 0 ? (
          filtered.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              thumbnail={course.thumbnail_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800'}
              price={course.price}
              category={course.category || '未分類'}
              instructor="BDS 團隊"
            />
          ))
        ) : (
          <p className="text-slate-500 col-span-full text-center py-20 italic font-semibold">
            {activeCategory === '全部' ? '目前尚無課程...' : `「${activeCategory}」分類目前尚無課程`}
          </p>
        )}
      </div>
    </>
  );
}
