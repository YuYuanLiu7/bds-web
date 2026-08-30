import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ALLOWED, UNSUPPORTED_TYPE_MESSAGE } from "@/lib/upload-allowed";
import { NextResponse } from "next/server";
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 伺服器端硬上限 50MB

export async function POST(req: Request) {
  try {
    // 1. 管理員身分驗證
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    // 2. Parse file from FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. 伺服器端驗證副檔名與類型（不信任用戶端 file.type / 檔名，避免上傳可執行內容）
    const rawExt = (file.name.split('.').pop() || '').toLowerCase();
    const safeContentType = ALLOWED.get(rawExt);
    if (!safeContentType) {
      return NextResponse.json(
        { error: UNSUPPORTED_TYPE_MESSAGE },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "檔案過大，伺服器上限為 50MB" }, { status: 400 });
    }

    // 檔名改用隨機值，避免用戶端操控檔名或同毫秒併發覆蓋
    const fileName = `bds-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${rawExt}`;

    // 依 visibility 決定存放位置：
    //  - protected（付費影片/下載檔/教材）→ private bucket，回傳 protected:// 參照，交付時才簽短效網址（可撤銷、防外流）
    //  - public（圖片：logo/封面/文章圖…）→ public bucket，回傳永久公開網址（本就要公開顯示）
    const isProtected = formData.get('visibility') === 'protected';
    const bucketName = isProtected ? 'protected' : 'uploads';

    // 4. 主要策略：上傳到 Supabase Storage（無狀態平台 Netlify/Vercel 唯一可行的持久化方式）
    const doUpload = () =>
      supabase.storage.from(bucketName).upload(fileName, buffer, {
        contentType: safeContentType, // 使用白名單推導的安全類型，不採信用戶端 file.type
        upsert: true,
      });

    let { data, error } = await doUpload();

    // 若 bucket 尚未建立，自動建立後重試一次（protected 桶為 private、uploads 桶為 public）
    if (error && /bucket|not found|exist/i.test(error.message || '')) {
      await supabase.storage.createBucket(bucketName, { public: !isProtected }).catch(() => {});
      ({ data, error } = await doUpload());
    }

    if (!error && data) {
      if (isProtected) {
        // 不回永久公開網址；回傳 protected:// 參照，實際交付時經 signStorageUrl 簽短效網址
        return NextResponse.json({ url: `protected://${fileName}` });
      }
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      if (urlData?.publicUrl) {
        return NextResponse.json({ url: urlData.publicUrl });
      }
    }

    // 5. 僅「公開圖片」且「開發環境」可退回寫入本機 public/uploads（受保護內容不走此路，避免落到公開目錄）
    if (!isProtected && process.env.NODE_ENV !== 'production') {
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
