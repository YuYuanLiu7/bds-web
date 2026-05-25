import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

export interface CarouselSlide {
  id: string;
  imageUrl: string;
  link: string;
}

export interface SectionImage {
  imageUrl: string;
  link: string;
}

export interface SiteSettings {
  primaryColor: string;
  logoUrl: string;
  slogan: string;
  carouselSlides: CarouselSlide[];
  sectionImage1: SectionImage;
  sectionImage2: SectionImage;
}

// 取得本地 JSON 快照路徑
const getLocalJsonPath = () => {
  return path.join(process.cwd(), 'src', 'lib', 'site-settings.json');
};

// 取得預設的本地設定值
export const getLocalDefaultSettings = (): SiteSettings => {
  try {
    const jsonPath = getLocalJsonPath();
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading local default settings file:", error);
  }
  
  // 保底硬編碼設定值，防止完全讀不到檔案
  return {
    primaryColor: "#21448e",
    logoUrl: "https://s.teachifycdn.com/image/width=400,quality=80/school/logo/a0285805-c7b3-48c3-bd43-24c2909be4e2/9c048f8f-d7d1-4091-9ea6-aa921655102a.png",
    slogan: "業務不是超人，卻有超能力！",
    carouselSlides: [
      { id: "1", imageUrl: "https://warehouse.kaik.network/school/images/1a375793-d194-4c52-a000-ec9f8a59f2f2.jpg", link: "/courses" },
      { id: "2", imageUrl: "https://warehouse.kaik.network/school/images/22713f2b-fc91-4c0c-ab4c-9a3097656001.png", link: "/courses" },
      { id: "3", imageUrl: "https://warehouse.kaik.network/school/images/ec48d188-e0b5-4496-8810-26ddfc4b0038.png", link: "/courses" }
    ],
    sectionImage1: {
      imageUrl: "https://warehouse.kaik.network/school/images/800c43d7-815d-4b73-8347-0f76477826f0.jpg",
      link: "/courses"
    },
    sectionImage2: {
      imageUrl: "https://warehouse.kaik.network/school/images/5b9a03dd-e0b5-4108-926e-0e0ba29afab3.jpg",
      link: "/courses"
    }
  };
};

/**
 * 伺服器端讀取視覺設定：
 * 優先從 Supabase 資料庫撈取，若讀取失敗或資料庫未建表，則改為讀取本地 site-settings.json 檔案。
 */
export async function getSiteSettingsServer(): Promise<SiteSettings> {
  try {
    // 1. 嘗試從 Supabase 讀取
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'homepage')
      .single();

    if (!error && data && data.value) {
      return data.value as SiteSettings;
    }
    
    if (error) {
      console.warn("Supabase site_settings read warning (falling back to JSON file):", error.message);
    }
  } catch (error) {
    console.error("Supabase connection error, falling back to local JSON file:", error);
  }

  // 2. 資料庫故障或尚未初始化時，讀取本地 JSON 檔
  return getLocalDefaultSettings();
}

/**
 * 伺服器端寫入視覺設定：
 * 嘗試寫入 Supabase，同時寫入本地端 JSON 檔作為雙重持久備份與本機持久化。
 */
export async function updateSiteSettingsServer(newSettings: SiteSettings): Promise<{ success: boolean; error?: string }> {
  let dbSuccess = false;
  let fileSuccess = false;
  let lastError = "";

  // 1. 嘗試寫入 Supabase
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'homepage', value: newSettings, updated_at: new Date().toISOString() });

    if (!error) {
      dbSuccess = true;
    } else {
      lastError = error.message;
      console.warn("Supabase upsert failed:", error.message);
    }
  } catch (err: any) {
    lastError = err.message || String(err);
    console.error("Supabase upsert error:", err);
  }

  // 2. 嘗試寫入本地 JSON 備份檔（主要供 localhost 本地開發持久化與 Vercel 部署初次初始化 fallback）
  try {
    const jsonPath = getLocalJsonPath();
    fs.writeFileSync(jsonPath, JSON.stringify(newSettings, null, 2), 'utf8');
    fileSuccess = true;
  } catch (err: any) {
    console.error("Local JSON write error:", err);
  }

  if (dbSuccess || fileSuccess) {
    return { success: true };
  }

  return { success: false, error: lastError || "Failed to save settings on both DB and local filesystem" };
}
