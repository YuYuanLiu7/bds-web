import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "聯絡我們",
  description: "課程諮詢、付款與退費、企業內訓與商務合作，歡迎與 BDS 團隊聯絡。",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
