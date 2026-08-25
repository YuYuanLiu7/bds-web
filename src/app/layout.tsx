import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { SettingsProvider, type PublicSettings } from "@/components/SettingsProvider";
import { ToastProvider } from "@/components/Toast";
import { getSiteSettingsServer, getJsonSetting, SETTINGS_DEFAULTS } from "@/lib/site-settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 容錯：NEXTAUTH_URL 若未設定或被填成非網址（常見的部署設定失誤），
// 退回本機預設值，避免 metadataBase 的 new URL() 在建置時整包崩潰。
function resolveSiteUrl(): string {
  const raw = (process.env.NEXTAUTH_URL || "").trim();
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    if (raw) console.warn(`[layout] NEXTAUTH_URL 不是有效網址（${raw}），暫用 http://localhost:3000。請於環境變數填入正確網址。`);
    return "http://localhost:3000";
  }
}
const siteUrl = resolveSiteUrl();
const siteName = "BDS By Doing So";
const siteDescription =
  "專注於硬體、半導體、醫材產業的業務開發與銷售課程，助您提升職場競爭力。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BDS By Doing So｜專業職涯與產業學習平台",
    template: `%s｜${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "業務開發",
    "商務開發",
    "BD",
    "半導體業務",
    "硬體業務",
    "醫材業務",
    "職涯成長",
    "線上課程",
    "BDS By Doing So",
  ],
  applicationName: siteName,
  authors: [{ name: siteName }],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName,
    title: "BDS By Doing So｜專業職涯與產業學習平台",
    description: siteDescription,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "BDS By Doing So｜專業職涯與產業學習平台",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 公開設定於伺服器端取得一次（取代各前端元件/各頁的重複 fetch）
async function loadPublicSettings(): Promise<PublicSettings> {
  try {
    const [visual, announcements, general, faqs, pages] = await Promise.all([
      getSiteSettingsServer(),
      getJsonSetting("announcements", SETTINGS_DEFAULTS.announcements),
      getJsonSetting("general", SETTINGS_DEFAULTS.general),
      getJsonSetting("faqs", SETTINGS_DEFAULTS.faqs),
      getJsonSetting("pages", SETTINGS_DEFAULTS.pages),
    ]);
    return {
      visual: {
        primaryColor: visual.primaryColor || "#21448e",
        logoUrl: visual.logoUrl || "",
        slogan: visual.slogan || "",
        carouselSlides: visual.carouselSlides,
        sectionImage1: visual.sectionImage1,
        sectionImage2: visual.sectionImage2,
      },
      announcements: Array.isArray(announcements) ? announcements : [],
      general: general || {},
      faqs: Array.isArray(faqs) ? faqs : [],
      pages: Array.isArray(pages) ? pages : [],
    };
  } catch (err) {
    console.warn("Failed to load public settings in layout:", err);
    return { visual: { primaryColor: "#21448e", logoUrl: "", slogan: "" }, announcements: [], general: {}, faqs: [], pages: [] };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await loadPublicSettings();
  return (
    <html
      lang="zh-TW"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // 將後台設定的主色注入為全站 CSS 變數，使所有 var(--brand) 元素跟隨後台主色
      style={{ ["--brand" as string]: settings.visual.primaryColor || "#21448e" } as React.CSSProperties}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-gray-50 text-gray-900"
      >
        <Providers>
          <SettingsProvider value={settings}>
            <ToastProvider>
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </ToastProvider>
          </SettingsProvider>
        </Providers>
      </body>
    </html>
  );
}
