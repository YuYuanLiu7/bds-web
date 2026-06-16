import { supabase } from './supabase';
import { Course, CourseWithChapters } from './types';

export async function getPublishedCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  // Filter out hidden courses if the column is present and set to true
  return (data || []).filter(course => !course.is_hidden);
}

export async function getCourseById(id: string): Promise<CourseWithChapters | null> {
  // course id 為 UUID；非 UUID（如舊的示範連結 fs001）直接視為不存在，
  // 避免對 Postgres 送出無效 UUID 而拋出 "invalid input syntax for type uuid" 錯誤
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUUID) {
    return null;
  }

  // 分開抓取以確保錯誤訊息清晰
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (courseError) {
    console.error('Error fetching course details:', courseError.message, courseError.details);
    return null;
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('*')
    .eq('course_id', id)
    .order('order_index', { ascending: true });

  if (chaptersError) {
    console.error('Error fetching chapters:', chaptersError.message);
  }

  return {
    ...course,
    chapters: chapters || []
  };
}

export async function checkCourseAccess(userId: string, courseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_courses')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}
