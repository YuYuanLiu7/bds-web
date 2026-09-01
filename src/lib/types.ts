export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  category: string | null;
  instructor?: string | null;          // 授課講師（courses.instructor，後台可設）
  is_published: boolean;
  is_hidden?: boolean;
  allow_comments?: boolean;
  allow_ratings?: boolean;
  file_url?: string | null;
  video_url?: string | null;
  created_at: string;
  // 新增課程欄位（皆為選填，視資料庫遷移狀態而定）
  subtitle?: string | null;            // 副標題
  slug?: string | null;                // 銷售網址代稱
  points?: string | null;              // 課程要點（多行文字）
  total_hours?: string | null;         // 總課程時數
  start_date?: string | null;          // 開課日期（YYYY-MM-DD）
  course_type?: string | null;         // paid / free
  is_featured?: boolean;               // 設為精選（暢銷標籤）
  show_student_count?: boolean;        // 銷售頁是否顯示學員數
  membership_included?: boolean;       // 是否開放給訂閱會員觀看
  seo_title?: string | null;           // 自訂 SEO 標題
  seo_description?: string | null;     // 自訂 SEO 描述
  seo_no_index?: boolean;              // 是否禁止搜尋引擎索引
  sort_order?: number | null;          // 顯示順序
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  video_url: string | null;
  file_url?: string | null;
  content_html?: string | null;        // 圖文 / 簡報連結區塊
  order_index: number;
  sort_order?: number | null;          // 章節排序
  created_at: string;
}

// 課程分類（course_categories 資料表）
export interface CourseCategory {
  id: string;
  name: string;
  slug: string | null;
  sort_order: number;
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


