import { requireAdmin } from "@/lib/auth";
import { getJsonSetting, setJsonSetting, SETTINGS_DEFAULTS, WRITABLE_SETTING_KEYS } from "@/lib/site-settings";
import { NextResponse } from "next/server";

export const revalidate = 0;

// GET：後台一次載入所有設定區塊（含通知範本等管理用設定）
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const entries = await Promise.all(
      WRITABLE_SETTING_KEYS.map(async (key) => [key, await getJsonSetting(key, SETTINGS_DEFAULTS[key])] as const)
    );
    return NextResponse.json(Object.fromEntries(entries));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load settings" }, { status: 500 });
  }
}

// POST：後台更新單一設定區塊 { key, value }
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.res;

    const { key, value } = await req.json();
    if (!WRITABLE_SETTING_KEYS.includes(key)) {
      return NextResponse.json({ error: "Unknown settings key" }, { status: 400 });
    }

    const result = await setJsonSetting(key, value);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to save" }, { status: 500 });
    }
    return NextResponse.json({ message: "Settings updated successfully!" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
