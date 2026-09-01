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

export default function CoursesClient({ courses }: CoursesClientProps) {
  const [activeCategory, setActiveCategory] = useState('全部');

  // 由實際課程資料動態產生分類分頁（與首頁/活動頁一致），避免硬編清單與後台分類不符導致篩選恆空
  const categories = ['全部', ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))] as string[];

  // 依分類篩選；「全部」顯示所有課程
  const filtered =
    activeCategory === '全部'
      ? courses
      : courses.filter((c) => (c.category || '') === activeCategory);

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2.5 mb-10 select-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition duration-200 border shadow-sm cursor-pointer ${
              cat === activeCategory
                ? 'bg-[var(--brand)] border-[var(--brand)] text-white'
                : 'bg-white text-slate-600 border-slate-200 hover:border-[var(--brand)] hover:text-[var(--brand)]'
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
              thumbnail={course.thumbnail_url || '/images/course-placeholder.svg'}
              price={course.price}
              category={course.category || '未分類'}
            />
          ))
        ) : (
          <p className="text-slate-500 col-span-full text-center py-20 italic font-semibold">
            {activeCategory === '全部' ? '目前尚無上架課程' : `「${activeCategory}」分類目前尚無課程`}
          </p>
        )}
      </div>
    </>
  );
}
