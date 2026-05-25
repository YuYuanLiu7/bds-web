import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { getSiteSettingsServer, updateSiteSettingsServer } from "@/lib/site-settings";
import { NextResponse } from "next/server";

// 1. GET 接口：前台/後台載入視覺設定值
export async function GET() {
  try {
    const settings = await getSiteSettingsServer();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("API GET site-settings error:", error);
    return NextResponse.json(
      { error: "Failed to load site settings: " + error.message },
      { status: 500 }
    );
  }
}

// 2. POST 接口：管理員更新視覺設定值 (受到 Admin 身分保護)
export async function POST(req: Request) {
  try {
    // A. 驗證登入 Session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized: Please log in." }, { status: 401 });
    }

    // B. 從資料庫驗證管理員 Role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    // C. 寫入設定
    const body = await req.json();
    
    // 簡單驗證資料完整性
    if (!body.logoUrl || !body.carouselSlides || !body.sectionImage1 || !body.sectionImage2) {
      return NextResponse.json({ error: "Invalid visual settings payload: Missing fields" }, { status: 400 });
    }

    const result = await updateSiteSettingsServer(body);

    if (result.success) {
      return NextResponse.json({ message: "Site settings updated successfully!" });
    } else {
      return NextResponse.json({ error: result.error || "Failed to update settings" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("API POST site-settings error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
