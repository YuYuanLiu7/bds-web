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

  return data || [];
}

export async function getCourseById(id: string): Promise<CourseWithChapters | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*, chapters(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  // Sort chapters by order_index
  if (data && data.chapters) {
    data.chapters.sort((a: any, b: any) => a.order_index - b.order_index);
  }

  return data;
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
