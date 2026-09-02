'use client';

import { CoverFlowCarousel, type CarouselItem } from '@/components/ui/3-d-coverflow-carousel';
import { useSettings } from '@/components/SettingsProvider';
import type { Course } from '@/lib/types';

// 把真實課程資料轉成 3D 封面流輪播（重點色跟隨後台品牌主色）。
function stripHtml(s?: string | null): string {
  return s ? s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

export default function CourseCoverflow({
  courses,
  sectionLabel = '精選課程',
  max = 8,
}: {
  courses: Course[];
  sectionLabel?: string;
  max?: number;
}) {
  const { visual } = useSettings();
  const accent = visual.primaryColor || '#21448e';

  const items: CarouselItem[] = (courses || []).slice(0, max).map((c) => ({
    tag: c.category ? `# ${c.category}` : undefined,
    titleLine1: c.title,
    desc: stripHtml(c.subtitle) || undefined,
    img:
      c.thumbnail_url ||
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    ctaText: '查看課程',
    ctaUrl: `/courses/${c.id}`,
  }));

  if (items.length === 0) return null;

  return <CoverFlowCarousel items={items} sectionLabel={sectionLabel} accent={accent} variant="light" />;
}
