import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BDS | By Doing So - 專業職涯與產業學習平台",
  description: "專注於硬體、半導體、醫材產業的業務開發與銷售課程，助您提升職場競爭力。",
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
          <footer className="bg-white border-t border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} BDS (By Doing So). All rights reserved.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
