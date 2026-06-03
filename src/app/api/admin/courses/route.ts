import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, price, category, thumbnail_url, instructor, is_published } = body;

    const insertData: any = { 
      title, 
      description, 
      price: parseInt(price), 
      category, 
      thumbnail_url, 
      is_published: is_published !== false 
    };
    if (instructor) {
      insertData.instructor = instructor;
    }

    let { data, error } = await supabase
      .from('courses')
      .insert([insertData])
      .select()
      .single();

    if (error && error.message.includes('column "instructor" does not exist')) {
      // Graceful fallback if instructor column has not been migrated yet
      delete insertData.instructor;
      const retry = await supabase
        .from('courses')
        .insert([insertData])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

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
    const { id, title, description, price, category, thumbnail_url, instructor, is_published } = body;

    const updateData: any = { 
      title, 
      description, 
      price: parseInt(price), 
      category, 
      thumbnail_url,
      is_published: is_published !== false
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

    if (error && error.message.includes('column "instructor" does not exist')) {
      // Graceful fallback if instructor column has not been migrated yet
      delete updateData.instructor;
      const retry = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

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
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Course deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
