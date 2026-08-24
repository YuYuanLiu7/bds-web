import { supabase } from "@/lib/supabase";
import { parsePrice } from "@/lib/validate";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// Session 使用者型別（含角色資訊）
type SessionUser = { role?: string };

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { 
      title, 
      description, 
      image_url, 
      price, 
      price_display, 
      date, 
      location, 
      attendees, 
      status, 
      type, 
      category, 
      registration_url 
    } = body;

    const parsedPrice = parsePrice(price);
    // Generate default display price if empty
    const finalPriceDisplay = price_display?.trim() || (parsedPrice === 0 ? '免費活動' : `NT$ ${parsedPrice.toLocaleString()}`);

    const { data, error } = await supabase
      .from('events')
      .insert([{ 
        title, 
        description, 
        image_url, 
        price: parsedPrice, 
        price_display: finalPriceDisplay, 
        date, 
        location, 
        attendees: parseInt(attendees) || 0, 
        status: status || 'upcoming', 
        type, 
        category, 
        registration_url 
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
    const { 
      id,
      title, 
      description, 
      image_url, 
      price, 
      price_display, 
      date, 
      location, 
      attendees, 
      status, 
      type, 
      category, 
      registration_url 
    } = body;

    const parsedPrice = parsePrice(price);
    const finalPriceDisplay = price_display?.trim() || (parsedPrice === 0 ? '免費活動' : `NT$ ${parsedPrice.toLocaleString()}`);

    const { data, error } = await supabase
      .from('events')
      .update({ 
        title, 
        description, 
        image_url, 
        price: parsedPrice, 
        price_display: finalPriceDisplay, 
        date, 
        location, 
        attendees: parseInt(attendees) || 0, 
        status: status || 'upcoming', 
        type, 
        category, 
        registration_url 
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
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Event deleted" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
