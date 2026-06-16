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

/**
 * 通用設定（FAQ、公告、一般資訊、通知範本等）
 * 以 site_settings 表的不同 key 存放，value 為 JSONB。
 * 讓後台修改能持久化到資料庫，前台 / 跨裝置皆可讀到（不再只存在某台瀏覽器的 localStorage）。
 */

// 各設定 key 的預設值（資料庫尚未有資料時的保底）
export const SETTINGS_DEFAULTS: Record<string, any> = {
  general: {
    siteName: 'BDS By Doing So',
    siteDesc: '橋接理論與實踐，深耕硬體、半導體與醫材產業。',
    contactEmail: 'bydoingso@gmail.com',
    communityUrl: 'https://discord.gg/bds',
    siteStatus: 'online',
    maintenanceMessage: '為了提供更高品質的學習體驗，我們目前正在進行系統升級維護，預計將於明早 06:00 完成。',
  },
  faqs: [
    { q: '如何開始選購與學習 BDS 的實戰課程？', a: '您只需在 BDS 首頁或課程列表頁面中，點選您感興趣的課程。點擊「立即購買」或「立即選購」後，系統會自動引導您進入 PayUni 安全金流結帳流程。付款完成後，系統會即時開通您的權限，您可以在頂端點擊「我的學習」直接開始看課觀看影片！' },
    { q: 'BDS 平台支援哪些付款方式？', a: 'BDS 目前唯一指定與台灣領先金流平台 PayUni（統一金流）合作。我們支援「信用卡線上一次付清」與「ATM 虛擬帳號轉帳匯款」。所有交易皆通過 256-bit SSL 資訊安全加密，保證您的付款資訊百分之百安全無虞。' },
    { q: '購買課程後，觀看期限是多久？可以退款嗎？', a: '在 BDS 購買的任何單門實戰課程皆享有「終身無限次觀看」的權益，沒有時間與次數限制。由於數位內容與影音商品在購買開通後即可完整觀看，若您有特殊的個人因素退款需求，請在購買後 7 天內（且觀看進度不超過第一章節 10%）與我們聯絡，我們將由專人為您審核辦理。' },
    { q: '付款完成後，我該如何確認我的課程已經開通？', a: '當您完成信用卡付款或 ATM 轉帳匯款成功後，PayUni 金流系統會發送通知給我們，系統會在 1 秒鐘內自動為您的註冊帳號開通對應課程權限。您可以登入後至頂端點選「我的學習」確認；同時您也會在您的信箱中收到一封訂單成立與權限開通的通知信件。' },
    { q: '我們有學員專屬的交流社群或 Discord 群組嗎？', a: '有的！BDS 非常重視學員的實戰交流。凡是購買過 BDS 任一課程或訂閱方案的學員，皆可在課程學習播放器的公告區或您的電子郵件信箱中，獲得專屬「Discord 業務表達與 BD 核心沙龍交流群」的邀請連結。在這裡您可以隨時向講師提問，並與數百位同行精英交流合作！' },
  ],
  announcements: [
    { content: '🎉 賀！硬體業務新手村課程突破 200 人選修！專屬學習群組加碼開放。', url: '/courses', status: 'published' },
  ],
  notifications: {
    adminEmail: 'admin@bydoingso.com',
    emailSubject: '【BDS By Doing So】您的課程已開通成功！',
    emailTemplate: '親愛的學員您好，感謝您購買 BDS 課程！系統已成功開通您的看課權限。',
  },
  global: {
    customDomain: 'bds.fu-notes.com',
    emailFromName: 'BDS By Doing So',
    emailFromAddress: 'no-reply@bds.fu-notes.com',
  },
};

// 可被前台公開讀取的 key（不含通知範本、寄件設定等管理用資訊）
export const PUBLIC_SETTING_KEYS = ['general', 'faqs', 'announcements'];
// 後台可寫入的所有 key
export const WRITABLE_SETTING_KEYS = Object.keys(SETTINGS_DEFAULTS);

export async function getJsonSetting<T = any>(key: string, fallback: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (!error && data && data.value !== null && data.value !== undefined) {
      return data.value as T;
    }
  } catch (error) {
    console.error(`Supabase read setting '${key}' error (falling back to default):`, error);
  }
  return fallback;
}

export async function setJsonSetting(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
