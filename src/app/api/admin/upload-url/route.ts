import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ALLOWED, UNSUPPORTED_TYPE_MESSAGE } from "@/lib/upload-allowed";
import { NextResponse } from "next/server";
import crypto from 'crypto';

// 「大檔直傳」簽發 API：
// 一般上傳（/api/admin/upload）會經過 Netlify/Vercel function，body 上限約 6MB，無法傳大影片。
// 此路由改用 service_role 對 Supabase Storage 簽發「一次性上傳 token」，
// 讓瀏覽器透過 uploadToSignedUrl 直接把檔案 PUT 到 Supabase，完全繞過平台 body 限制。
//
// 回傳：
//   { path, token, bucket, ref }
//   - path/token/bucket：交給 supabase-js 的 uploadToSignedUrl 使用
//   - ref：實際存進資料庫的參照字串（protected → protected://<path>；public → 永久公開網址）

interface UploadUrlBody {
  fileName?: string;
  ext?: string;
  visibility?: 'public' | 'protected';
}

export async function POST(req: Request) {
  try {
    // 1. 管理員身分驗證
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    // 2. 解析請求
    let body: UploadUrlBody;
    try {
      body = (await req.json()) as UploadUrlBody;
    } catch {
      return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
    }

    // 3. 副檔名白名單驗證（優先採用明確傳入的 ext，其次由 fileName 推導）
    const rawExt = (body.ext || body.fileName?.split('.').pop() || '').toLowerCase();
    if (!ALLOWED.has(rawExt)) {
      return NextResponse.json({ error: UNSUPPORTED_TYPE_MESSAGE }, { status: 400 });
    }

    // 4. 決定 bucket 與隨機檔名（不採信用戶端檔名，避免路徑操控與併發覆蓋）
    const isProtected = body.visibility === 'protected';
    const bucketName = isProtected ? 'protected' : 'uploads';
    const path = `bds-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${rawExt}`;

    // 5. 簽發一次性上傳 token；bucket 不存在則自動建立後重試一次
    const doSign = () => supabase.storage.from(bucketName).createSignedUploadUrl(path);

    let { data, error } = await doSign();
    if (error && /bucket|not found|exist/i.test(error.message || '')) {
      await supabase.storage.createBucket(bucketName, { public: !isProtected }).catch(() => {});
      ({ data, error } = await doSign());
    }

    if (error || !data?.token) {
      console.error("createSignedUploadUrl failed:", error?.message);
      return NextResponse.json(
        { error: "無法建立上傳連結（請確認 Supabase Storage 設定）：" + (error?.message || "未知錯誤") },
        { status: 500 }
      );
    }

    // 6. 組出資料庫要儲存的參照字串
    let ref: string;
    if (isProtected) {
      ref = `protected://${path}`;
    } else {
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(path);
      ref = urlData?.publicUrl || '';
    }

    return NextResponse.json({ path, token: data.token, bucket: bucketName, ref });
  } catch (error) {
    console.error("API POST upload-url error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "建立上傳連結失敗：" + message }, { status: 500 });
  }
}
