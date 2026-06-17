import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-gray-50 text-gray-900"
      >
        <Providers>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
