import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// 預設學員設定值
const DEFAULT_STUDENT_SETTINGS = {
  phoneMode: "optional", // "required" | "optional" | "disabled"
  tosText: `【服務條款】\n歡迎使用 BDS 學習平台！當您開始使用我們的服務時，即表示您已閱讀、瞭解並同意接受本服務條款之所有內容。我們會保障您的學習體驗，也請配合尊重智慧財產權與合理使用規範。`,
  privacyText: `【隱私權政策】\nBDS 非常重視您的個人隱私。我們僅收集為提供課程、學員設定與交易處理所需之必要資訊（如姓名、電子郵件、電話）。除非法律要求或經您授權，我們絕不會將您的資料轉售或透露給第三方。`,
  requireTosAgreement: true
};

// 1. GET：取得當前學員設定值（含服務條款/隱私權文案，僅供後台編輯介面，須為管理員）
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'students_settings')
      .single();

    if (error || !data || !data.value) {
      // 找不到或出錯時，回傳預設值
      return NextResponse.json(DEFAULT_STUDENT_SETTINGS);
    }

    return NextResponse.json(data.value);
  } catch (error) {
    console.error("GET students settings error:", error);
    return NextResponse.json(DEFAULT_STUDENT_SETTINGS);
  }
}

// 2. POST：儲存學員設定值 (受到 Admin 身分保護)
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { phoneMode, tosText, privacyText, requireTosAgreement } = body;

    // 格式驗證
    if (!phoneMode) {
      return NextResponse.json({ error: "無效的設定資料" }, { status: 400 });
    }

    const payload = {
      phoneMode,
      tosText: tosText || "",
      privacyText: privacyText || "",
      requireTosAgreement: !!requireTosAgreement
    };

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'students_settings',
        value: payload,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "學員設定已成功儲存" });
  } catch (error) {
    console.error("POST admin student settings error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
