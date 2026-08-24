import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// Session 使用者型別（含角色資訊）
type SessionUser = { role?: string };

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { title, price, type, description, downloads_count, status, file_url } = body;

    const { data, error } = await supabase
      .from('downloads')
      .insert([{
        title, 
        price: parseInt(price) || 0, 
        type, 
        description, 
        downloads_count: parseInt(downloads_count) || 0, 
        status: status || 'published',
        file_url 
      }])
      .select()
      .single();

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
    const { id, title, price, type, description, downloads_count, status, file_url } = body;

    const { data, error } = await supabase
      .from('downloads')
      .update({ 
        title, 
        price: parseInt(price) || 0, 
        type, 
        description, 
        downloads_count: parseInt(downloads_count) || 0, 
        status,
        file_url 
      })
      .eq('id', id)
      .select()
      .single();

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
      .from('downloads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Download product deleted" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
