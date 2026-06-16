import { getJsonSetting, SETTINGS_DEFAULTS, PUBLIC_SETTING_KEYS } from "@/lib/site-settings";
import { NextResponse } from "next/server";

export const revalidate = 0;

// 公開設定讀取：供前台（公告列、FAQ、維護狀態、基本資訊）動態載入
// 僅開放 PUBLIC_SETTING_KEYS，通知範本/寄件等管理資訊不在此外露
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || '';

    if (!PUBLIC_SETTING_KEYS.includes(key)) {
      return NextResponse.json({ error: "Unknown or non-public settings key" }, { status: 400 });
    }

    const value = await getJsonSetting(key, SETTINGS_DEFAULTS[key]);
    return NextResponse.json(value);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load settings" }, { status: 500 });
  }
}
