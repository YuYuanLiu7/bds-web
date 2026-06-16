import Link from 'next/link';
import Image from 'next/image';

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
    <Link href={`/courses/${id}`} className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition duration-300">
      <div className="relative aspect-video">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute top-2 left-2">
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            {category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-gray-900 font-bold text-lg mb-1 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
          {title}
        </h3>
        {instructor && <p className="text-gray-500 text-sm mb-3">講師：{instructor}</p>}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-blue-600 font-bold text-xl">
            {price === 0 ? '免費領取' : `NT$ ${(price ?? 0).toLocaleString()}`}
          </span>
          <span className="text-gray-400 text-xs font-medium border border-gray-200 px-2 py-1 rounded">
            立即報名
          </span>
        </div>
      </div>
    </Link>
  );
}
