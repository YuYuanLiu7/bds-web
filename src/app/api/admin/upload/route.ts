import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    // 1. Session verification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    // 2. Validate admin role from Database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    // 3. Parse file from FormData
    console.log("Incoming content-type:", req.headers.get("content-type"));
    console.log("Incoming content-length:", req.headers.get("content-length"));
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `bds-img-${Date.now()}.${fileExt}`;
    const bucketName = 'uploads';

    // 4. 主要策略：上傳到 Supabase Storage（無狀態平台 Netlify/Vercel 唯一可行的持久化方式）
    const doUpload = () =>
      supabase.storage.from(bucketName).upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    let { data, error } = await doUpload();

    // 若 bucket 尚未建立，自動建立公開 bucket 後重試一次（讓部署者免手動設定）
    if (error && /bucket|not found|exist/i.test(error.message || '')) {
      await supabase.storage.createBucket(bucketName, { public: true }).catch(() => {});
      ({ data, error } = await doUpload());
    }

    if (!error && data) {
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      if (urlData?.publicUrl) {
        return NextResponse.json({ url: urlData.publicUrl });
      }
    }

    // 5. 僅「開發環境」可退回寫入本機 public/uploads（正式/無狀態平台不可行，避免回傳會 404 的假連結）
    if (process.env.NODE_ENV !== 'production') {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
      return NextResponse.json({ url: `/uploads/${fileName}` });
    }

    // 正式環境：Supabase Storage 失敗就回明確錯誤，不回傳無效的本機連結
    console.error("Supabase Storage upload failed:", error?.message);
    return NextResponse.json(
      { error: "圖片上傳失敗（請確認 Supabase Storage 設定）：" + (error?.message || "未知錯誤") },
      { status: 500 }
    );

  } catch (error) {
    console.error("API POST upload error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "File upload failed: " + message }, { status: 500 });
  }
}
