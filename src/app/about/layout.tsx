import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "關於我們",
  description: "BDS By Doing So — 橋接理論與實踐，深耕硬體、半導體與醫材產業的實戰學習平台。",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
