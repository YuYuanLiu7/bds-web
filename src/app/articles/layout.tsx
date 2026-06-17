import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "產業觀察專欄",
  description: "硬體、半導體、醫材產業的商務開發與職涯成長深度觀察文章。",
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
