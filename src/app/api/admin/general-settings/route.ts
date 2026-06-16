import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { getJsonSetting, setJsonSetting, SETTINGS_DEFAULTS, WRITABLE_SETTING_KEYS } from "@/lib/site-settings";
import { NextResponse } from "next/server";

export const revalidate = 0;

// 後端管理員身分驗證（以資料庫 role 為準，避免僅信任前端）
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false as const, status: 401, error: "Unauthorized: Please log in." };
  }
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single();
  if (error || !userData || userData.role !== 'admin') {
    return { ok: false as const, status: 403, error: "Forbidden: Admin access required." };
  }
  return { ok: true as const };
}

// GET：後台一次載入所有設定區塊（含通知範本等管理用設定）
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const entries = await Promise.all(
      WRITABLE_SETTING_KEYS.map(async (key) => [key, await getJsonSetting(key, SETTINGS_DEFAULTS[key])] as const)
    );
    return NextResponse.json(Object.fromEntries(entries));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load settings" }, { status: 500 });
  }
}

// POST：後台更新單一設定區塊 { key, value }
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { key, value } = await req.json();
    if (!WRITABLE_SETTING_KEYS.includes(key)) {
      return NextResponse.json({ error: "Unknown settings key" }, { status: 400 });
    }

    const result = await setJsonSetting(key, value);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to save" }, { status: 500 });
    }
    return NextResponse.json({ message: "Settings updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
