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
      .from('membership_plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      // 查詢失敗時回傳錯誤狀態，避免以假資料造成錯誤的 KPI 與不存在 id 的編輯/刪除假成功
      console.error("查詢 membership_plans 失敗：", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 查詢成功但資料表為空時，回傳空陣列，不回傳寫死的示範方案
    return NextResponse.json(data ?? []);
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
    const { title, price, period, description, features, is_popular, status } = body;

    const { data, error } = await supabase
      .from('membership_plans')
      .insert([{
        title,
        price: parseInt(price) || 0,
        period: period || '月繳',
        description,
        features: Array.isArray(features) ? features : [],
        is_popular: !!is_popular,
        status: status || 'active',
        subscribers_count: 0
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
    const { id, title, price, period, description, features, is_popular, status } = body;

    const { data, error } = await supabase
      .from('membership_plans')
      .update({
        title,
        price: parseInt(price) || 0,
        period: period || '月繳',
        description,
        features: Array.isArray(features) ? features : [],
        is_popular: !!is_popular,
        status
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

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from('membership_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Membership plan deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
