import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 允許上傳的類型白名單：圖片、影片、簡報/文件（課程教材與數位下載商品）。
// 明確排除 .svg / .html 等可被瀏覽器當作內容執行、造成儲存型 XSS 的類型；
// 簡報/文件格式（pptx/ppt/key/doc/docx/xls/xlsx）不會被瀏覽器當程式執行，加入是安全的。
const ALLOWED = new Map<string, string>([
  ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['png', 'image/png'],
  ['gif', 'image/gif'], ['webp', 'image/webp'],
  ['mp4', 'video/mp4'], ['webm', 'video/webm'], ['mov', 'video/quicktime'],
  ['pdf', 'application/pdf'], ['zip', 'application/zip'],
  // 簡報與文件（課程教材常見格式）
  ['ppt', 'application/vnd.ms-powerpoint'],
  ['pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['key', 'application/vnd.apple.keynote'],
  ['doc', 'application/msword'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['xls', 'application/vnd.ms-excel'],
  ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
]);
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
        { error: "不支援的檔案類型。允許：JPG/PNG/GIF/WEBP、MP4/WEBM/MOV、PDF/ZIP" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "檔案過大，伺服器上限為 50MB" }, { status: 400 });
    }

    // 檔名改用隨機值，避免用戶端操控檔名或同毫秒併發覆蓋
    const fileName = `bds-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${rawExt}`;
    const bucketName = 'uploads';

    // 4. 主要策略：上傳到 Supabase Storage（無狀態平台 Netlify/Vercel 唯一可行的持久化方式）
    const doUpload = () =>
      supabase.storage.from(bucketName).upload(fileName, buffer, {
        contentType: safeContentType, // 使用白名單推導的安全類型，不採信用戶端 file.type
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
