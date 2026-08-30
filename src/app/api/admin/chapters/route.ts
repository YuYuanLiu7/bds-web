import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// 章節單元更新欄位型別（file_url / content_html 視資料庫遷移狀態而定，故為選填）
interface ChapterUpdateData {
  title?: string;
  video_url?: string;
  order_index?: number;
  file_url?: string | null;
  content_html?: string | null; // 圖文 / 簡報連結區塊
}

// 1. GET：取得特定課程的所有章節單元 (依順序排序)
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: "缺少課程 ID" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

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
    const { course_id, title, video_url, order_index, file_url, content_html } = body;

    let { data, error } = await supabase
      .from('chapters')
      .insert([{
        course_id,
        title,
        video_url,
        order_index: parseInt(order_index),
        file_url: file_url || null,
        content_html: content_html || null
      }])
      .select()
      .single();

    if (error && error.message.includes('does not exist')) {
      // 相容處理：file_url / content_html 欄位尚未遷移時，去除後以最小欄位集合重試
      const retry = await supabase
        .from('chapters')
        .insert([{ course_id, title, video_url, order_index: parseInt(order_index) }])
        .select()
        .single();
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
    const { id, title, video_url, order_index } = body;

    const updateData: ChapterUpdateData = {
      title,
      video_url,
      order_index: parseInt(order_index),
    };
    // 只有當請求明確帶 file_url 時才更新，避免沒有此欄位的編輯頁（如課程學員頁）
    // 把既有的單元講義 file_url 覆蓋成 null 造成資料遺失
    if ('file_url' in body) {
      updateData.file_url = body.file_url || null;
    }
    // 同理：僅在請求明確帶 content_html 時才更新，避免其他編輯頁誤清空圖文區塊
    if ('content_html' in body) {
      updateData.content_html = body.content_html || null;
    }

    let { data, error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error && error.message.includes('does not exist')) {
      // 相容處理：file_url / content_html 欄位尚未遷移時，移除後以最小欄位集合重試
      const safeUpdate: ChapterUpdateData = {
        title: updateData.title,
        video_url: updateData.video_url,
        order_index: updateData.order_index,
      };
      const retry = await supabase
        .from('chapters')
        .update(safeUpdate)
        .eq('id', id)
        .select()
        .single();
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
      .from('chapters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: "Chapter deleted" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
