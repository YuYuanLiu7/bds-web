import { requireAdmin } from "@/lib/auth";
import { getSiteSettingsServer, updateSiteSettingsServer } from "@/lib/site-settings";
import { NextResponse } from "next/server";

// 1. GET 接口：前台/後台載入視覺設定值
export async function GET() {
  try {
    const settings = await getSiteSettingsServer();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("API GET site-settings error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to load site settings: " + message },
      { status: 500 }
    );
  }
}

// 2. POST 接口：管理員更新視覺設定值 (受到 Admin 身分保護)
export async function POST(req: Request) {
  try {
    // A. 管理員身分驗證
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    // B. 寫入設定
    const body = await req.json();
    
    // 簡單驗證資料完整性：欄位需存在即可（logoUrl 允許留空字串，代表不顯示 Logo）
    if (body.logoUrl === undefined || !body.carouselSlides || !body.sectionImage1 || !body.sectionImage2) {
      return NextResponse.json({ error: "Invalid visual settings payload: Missing fields" }, { status: 400 });
    }

    const result = await updateSiteSettingsServer(body);

    if (result.success) {
      return NextResponse.json({ message: "Site settings updated successfully!" });
    } else {
      return NextResponse.json({ error: result.error || "Failed to update settings" }, { status: 500 });
    }
  } catch (error) {
    console.error("API POST site-settings error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error: " + message },
      { status: 500 }
    );
  }
}
