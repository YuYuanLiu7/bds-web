import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

// 章節影片「瀏覽器直傳 Bunny」的授權端點。
// 影片屬大檔＋串流內容，應放 Bunny Stream（非 Supabase）。
// 流程：伺服器用 API 金鑰在 Bunny 建立影片物件，並簽出 TUS 上傳授權，
//       瀏覽器再用該授權以 TUS 直接把檔案傳到 Bunny（金鑰不外洩、可傳大檔、支援續傳）。
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    if (!libraryId || !apiKey) {
      return NextResponse.json(
        { error: "尚未設定 Bunny 影片庫金鑰（BUNNY_STREAM_LIBRARY_ID / BUNNY_STREAM_API_KEY）。請先設定，或改用『貼上 Bunny 影片網址』。" },
        { status: 400 }
      );
    }

    const { title } = await req.json().catch(() => ({ title: "" }));
    const videoTitle = (typeof title === "string" && title.trim()) ? title.trim().slice(0, 200) : "課程影片";

    // 1. 在 Bunny 建立影片物件，取得 guid
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: "POST",
      headers: { AccessKey: apiKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ title: videoTitle }),
    });
    if (!createRes.ok) {
      console.error("[bunny-upload] 建立影片失敗", createRes.status);
      return NextResponse.json({ error: `在 Bunny 建立影片失敗（HTTP ${createRes.status}），請確認金鑰與影片庫 ID` }, { status: 502 });
    }
    const created = await createRes.json();
    const videoId = created.guid as string;

    // 2. 簽出 TUS 上傳授權：SHA256(libraryId + apiKey + expire + videoId)
    const expire = Math.floor(Date.now() / 1000) + 3 * 60 * 60; // 3 小時，足夠上傳大型長片
    const signature = crypto
      .createHash("sha256")
      .update(libraryId + apiKey + expire + videoId)
      .digest("hex");

    return NextResponse.json({
      libraryId,
      videoId,
      signature,
      expire,
      // 存進章節 video_url 的嵌入網址；播放頁會再簽短效 Token
      embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`,
    });
  } catch (error) {
    console.error("[bunny-upload] error", error);
    return NextResponse.json({ error: "無法建立 Bunny 上傳授權，請稍後再試" }, { status: 500 });
  }
}
