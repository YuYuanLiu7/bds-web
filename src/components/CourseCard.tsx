import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

interface CourseCardProps {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  category: string;
  instructor?: string;
}

export default function CourseCard({ id, title, thumbnail, price, category, instructor }: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`} className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-300">
      <div className="relative aspect-video">
        <SafeImage
          src={thumbnail}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute top-2 left-2">
          <span className="bg-[var(--brand)] text-white text-xs font-semibold px-2 py-1 rounded-md uppercase tracking-wider">
            {category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-slate-800 font-bold text-lg mb-1 line-clamp-2 leading-snug group-hover:text-[var(--brand)] transition">
          {title}
        </h3>
        {instructor && <p className="text-slate-500 text-sm mb-3">講師：{instructor}</p>}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-primary font-bold text-xl">
            {price === 0 ? '免費領取' : `NT$ ${(price ?? 0).toLocaleString()}`}
          </span>
          <span className="text-slate-400 text-xs font-medium border border-slate-200 px-2 py-1 rounded-md">
            立即報名
          </span>
        </div>
      </div>
    </Link>
  );
}
