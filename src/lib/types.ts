export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  category: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  video_url: string | null;
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

