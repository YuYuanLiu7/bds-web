import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      author, 
      date, 
      category, 
      summary, 
      content, 
      image_url, 
      status, 
      views,
      slug,
      tags,
      seo_title,
      seo_description,
      is_pinned,
      visibility,
      required_course_ids
    } = body;

    const finalDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const { data, error } = await supabase
      .from('articles')
      .insert([{ 
        title, 
        author: author?.trim() || 'BDS 編輯部', 
        date: finalDate, 
        category, 
        summary, 
        content, 
        image_url, 
        status: status || 'published', 
        views: parseInt(views) || 0,
        slug: slug?.trim() || null,
        tags: tags || null,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        is_pinned: !!is_pinned,
        visibility: visibility || 'public',
        required_course_ids: required_course_ids || null
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id,
      title, 
      author, 
      date, 
      category, 
      summary, 
      content, 
      image_url, 
      status, 
      views,
      slug,
      tags,
      seo_title,
      seo_description,
      is_pinned,
      visibility,
      required_course_ids
    } = body;

    const finalDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const { data, error } = await supabase
      .from('articles')
      .update({ 
        title, 
        author: author?.trim() || 'BDS 編輯部', 
        date: finalDate, 
        category, 
        summary, 
        content, 
        image_url, 
        status: status || 'published', 
        views: parseInt(views) || 0,
        slug: slug?.trim() || null,
        tags: tags || null,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        is_pinned: !!is_pinned,
        visibility: visibility || 'public',
        required_course_ids: required_course_ids || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Article deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
