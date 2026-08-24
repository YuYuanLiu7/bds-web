import { supabase } from "@/lib/supabase";
import { parsePrice } from "@/lib/validate";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// 課程寫入欄位型別（部分欄位視資料庫遷移狀態而定，故皆為選填）
interface CourseWriteData {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  thumbnail_url?: string;
  instructor?: string;
  is_published?: boolean;
  is_hidden?: boolean;
  allow_comments?: boolean;
  allow_ratings?: boolean;
  file_url?: string | null;
  video_url?: string | null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const {
      title,
      description,
      price,
      category,
      thumbnail_url,
      instructor,
      is_published,
      is_hidden,
      allow_comments,
      allow_ratings,
      file_url,
      video_url
    } = body;

    const insertData: CourseWriteData = {
      title, 
      description, 
      price: parsePrice(price), 
      category, 
      thumbnail_url, 
      is_published: is_published !== false,
      is_hidden: !!is_hidden,
      allow_comments: allow_comments !== false,
      allow_ratings: allow_ratings !== false,
      file_url: file_url || null,
      video_url: video_url || null
    };
    if (instructor) {
      insertData.instructor = instructor;
    }

    let { data, error } = await supabase
      .from('courses')
      .insert([insertData])
      .select()
      .single();

    if (error && error.message.includes('does not exist')) {
      // Graceful fallback if custom settings columns have not been migrated yet
      const fallbackData: CourseWriteData = {
        title,
        description,
        price: parsePrice(price),
        category,
        thumbnail_url,
        is_published: is_published !== false
      };
      if (instructor) fallbackData.instructor = instructor;

      let retry = await supabase
        .from('courses')
        .insert([fallbackData])
        .select()
        .single();

      // Second fallback: If 'instructor' column also doesn't exist, retry without it
      if (retry.error && retry.error.message.includes('does not exist')) {
        const fallbackBareData: CourseWriteData = {
          title,
          description,
          price: parsePrice(price),
          category,
          thumbnail_url,
          is_published: is_published !== false
        };
        retry = await supabase
          .from('courses')
          .insert([fallbackBareData])
          .select()
          .single();
      }

      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const {
      id,
      title,
      description,
      price,
      category,
      thumbnail_url,
      instructor,
      is_published,
      is_hidden,
      allow_comments,
      allow_ratings,
      file_url,
      video_url
    } = body;

    const updateData: CourseWriteData = {
      title, 
      description, 
      price: parsePrice(price), 
      category, 
      thumbnail_url,
      is_published: is_published !== false,
      is_hidden: !!is_hidden,
      allow_comments: allow_comments !== false,
      allow_ratings: allow_ratings !== false,
      file_url: file_url || null,
      video_url: video_url || null
    };
    if (instructor) {
      updateData.instructor = instructor;
    }

    let { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error && error.message.includes('does not exist')) {
      // Graceful fallback if custom settings columns have not been migrated yet
      const fallbackData: CourseWriteData = {
        title,
        description,
        price: parsePrice(price),
        category,
        thumbnail_url,
        is_published: is_published !== false
      };
      if (instructor) fallbackData.instructor = instructor;

      let retry = await supabase
        .from('courses')
        .update(fallbackData)
        .eq('id', id)
        .select()
        .single();

      // Second fallback: If 'instructor' column also doesn't exist, retry without it
      if (retry.error && retry.error.message.includes('does not exist')) {
        const fallbackBareData: CourseWriteData = {
          title,
          description,
          price: parsePrice(price),
          category,
          thumbnail_url,
          is_published: is_published !== false
        };
        retry = await supabase
          .from('courses')
          .update(fallbackBareData)
          .eq('id', id)
          .select()
          .single();
      }

      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
