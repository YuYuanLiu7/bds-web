export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  category: string | null;
  is_published: boolean;
  is_hidden?: boolean;
  allow_comments?: boolean;
  allow_ratings?: boolean;
  file_url?: string | null;
  video_url?: string | null;
  created_at: string;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  video_url: string | null;
  file_url?: string | null;
  order_index: number;
  created_at: string;
}

export interface CourseWithChapters extends Course {
  chapters: Chapter[];
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  price_display: string | null;
  date: string;
  location: string | null;
  attendees: number;
  status: 'upcoming' | 'completed';
  type: string;
  category: string;
  registration_url: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  views: number;
  category: string;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  status: 'published' | 'draft';
  created_at: string;
}


