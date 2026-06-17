import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "活動講座",
  description: "BDS 線上實戰營、線下沙龍與爐邊對談，與業界專家面對面交流。",
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
