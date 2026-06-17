import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "常見問答",
  description: "課程開通、付款方式、觀看期限與退款等常見問題解答。",
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
