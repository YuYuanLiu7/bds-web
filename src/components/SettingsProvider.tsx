'use client';

import { createContext, useContext } from 'react';

export interface VisualSettings {
  primaryColor: string;
  logoUrl: string;
  slogan: string;
  carouselSlides?: { id: string; imageUrl: string; link: string }[];
  sectionImage1?: { imageUrl: string; link: string };
  sectionImage2?: { imageUrl: string; link: string };
}

export interface PublicSettings {
  visual: VisualSettings;
  announcements: { content: string; url?: string; status?: string }[];
  general: { siteStatus?: string; maintenanceMessage?: string; [k: string]: unknown };
  faqs: { q: string; a: string }[];
}

const DEFAULTS: PublicSettings = {
  visual: { primaryColor: '#21448e', logoUrl: '', slogan: '' },
  announcements: [],
  general: {},
  faqs: [],
};

const SettingsContext = createContext<PublicSettings>(DEFAULTS);

/**
 * 由 root layout 於「伺服器端」取得一次公開設定（視覺/公告/狀態/FAQ）後，
 * 以 Context 往下傳給所有前端元件，避免每個元件、每一頁各自重複 fetch，
 * 大幅降低 serverless 函式呼叫次數與資料庫查詢量。
 */
export function SettingsProvider({
  value,
  children,
}: {
  value: PublicSettings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): PublicSettings {
  return useContext(SettingsContext);
}
