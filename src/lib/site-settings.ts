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
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    console.error("Supabase upsert error:", err);
  }

  // 2. 嘗試寫入本地 JSON 備份檔（主要供 localhost 本地開發持久化與 Vercel 部署初次初始化 fallback）
  try {
    const jsonPath = getLocalJsonPath();
    fs.writeFileSync(jsonPath, JSON.stringify(newSettings, null, 2), 'utf8');
    fileSuccess = true;
  } catch (err) {
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

// 各設定 key 的型別（保留以字串索引存取的彈性，同時為常用 key 提供具體型別）
interface GeneralSetting {
  siteName?: string;
  siteDesc?: string;
  contactEmail?: string;
  communityUrl?: string;
  siteStatus?: string;
  maintenanceMessage?: string;
  [key: string]: unknown;
}
interface FaqItem {
  q: string;
  a: string;
}
interface AnnouncementItem {
  content: string;
  url?: string;
  status?: string;
}
interface PageItem {
  id: string;
  name: string;
  path: string;
  type: string;
  status: string;
  lastUpdated?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
}
interface SettingsDefaults {
  general: GeneralSetting;
  faqs: FaqItem[];
  announcements: AnnouncementItem[];
  notifications: Record<string, unknown>;
  global: Record<string, unknown>;
  pages: PageItem[];
  [key: string]: unknown;
}

// 各設定 key 的預設值（資料庫尚未有資料時的保底）
export const SETTINGS_DEFAULTS: SettingsDefaults = {
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
  // 頁面內容 CMS（about/contact/privacy 等靜態頁的標題、副標、內文、封面）
  pages: [
    {
      id: '1', name: '首頁 (首頁核心展示)', path: '/', type: 'system', status: 'published', lastUpdated: '2026-05-20 18:30',
      title: '業務不是超人，卻有超能力！',
      subtitle: '專注於硬體、半導體、醫材產業的業務開發與銷售課程，助您提升職場競爭力。',
      content: 'BDS By Doing So 是一個專為「硬體科技、半導體、生醫材料及跨領域商務開發」量身打造的實戰學習平台。',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    },
    {
      id: '2', name: '所有課程列表', path: '/courses', type: 'system', status: 'published', lastUpdated: '2026-05-18 12:45',
      title: '所有課程',
      subtitle: '精選實戰學程，快速提升您的專業銷售與商務拓展能力。',
      content: '我們拒絕純理論，所有課程均由具備多年產業銷售與商務開發經驗的資深經理人親自授課。',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    },
    {
      id: '3', name: '關於我們 / BDS 理念介紹', path: '/about', type: 'custom', status: 'published', lastUpdated: '2026-05-12 14:00',
      title: '關於我們',
      subtitle: '業務不是超人，卻有超能力！',
      content: 'BDS By Doing So 是一個專為「硬體科技、半導體、生醫材料及跨領域商務開發」量身打造的實戰學習平台。我們深信真正的專業來自於實踐與經驗傳承，協助每一位渴望躍升的夥伴實現職場轉型與能力升級。',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    },
    {
      id: '4', name: '隱私權與服務條款條約', path: '/privacy', type: 'custom', status: 'published', lastUpdated: '2026-04-30 09:15',
      title: '服務條款與隱私權政策',
      subtitle: '法律與條約規定說明',
      content: '歡迎您使用 BDS By Doing So（以下簡稱「本平台」）。本服務條款旨在規範本平台與註冊會員之間的權利義務關係。',
      imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1200',
    },
    {
      id: '5', name: '聯絡我們 / 商務諮詢', path: '/contact', type: 'custom', status: 'published', lastUpdated: '2026-03-22 17:00',
      title: '有任何問題？我們隨時為您解答',
      subtitle: '不論是關於課程內容、付費方式、企業包班或是商務合作諮詢，歡迎填寫表單或直接寄信至我們的信箱。',
      content: '客服與合作信箱：bydoingso@gmail.com。任何諮詢將於 1-2 個工作天內回覆。',
      imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=1200',
    },
  ],
};

// 可被前台公開讀取的 key（不含通知範本、寄件設定等管理用資訊）
export const PUBLIC_SETTING_KEYS = ['general', 'faqs', 'announcements', 'pages'];
// 後台可寫入的所有 key
export const WRITABLE_SETTING_KEYS = Object.keys(SETTINGS_DEFAULTS);

export async function getJsonSetting<T = unknown>(key: string, fallback: T): Promise<T> {
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

export async function setJsonSetting(key: string, value: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
