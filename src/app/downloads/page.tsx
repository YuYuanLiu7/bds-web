import { getSiteSettingsServer } from "@/lib/site-settings";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import DownloadsList from "@/components/DownloadsList";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 0;

export const metadata = {
  title: "數位資源下載",
  description: "即裝即用的專業履歷模板、生意開發策略白皮書與經典面試手冊。",
};

// 數位下載商品資料列（資料庫 / Mock 共用形狀）
interface DownloadRow {
  id: string;
  title: string;
  price: number;
  type: string;
  description: string;
  downloads_count: number;
  status: 'published' | 'draft';
  file_url?: string;
  created_at?: string;
}

// Seed/Mock fallback data in case database is empty or not yet migrated
const MOCK_DOWNLOADS = [
  { 
    id: '1', 
    title: 'BDS 獨家：半導體高階業務求職信與履歷模板', 
    downloads_count: 125, 
    price: 499, 
    type: 'PDF 文件',
    description: '針對半導體設備、IC 通路、代工廠業務職缺量身打造的英文履歷與動機信模板，助您脫穎而出。',
    status: 'published' as const,
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  { 
    id: '2', 
    title: '硬體產業 ODM 生意開發策略白皮書 (2026 最新版)', 
    downloads_count: 86, 
    price: 1200, 
    type: 'PDF/PPT 簡報',
    description: '深度解析電子製造與 ODM 大廠商務拓展核心方法論，包含客戶導入、RFQ 報價與銷售談判策略。',
    status: 'published' as const,
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  { 
    id: '3', 
    title: '外商商務開發面試經典 50 問與模擬解題手冊', 
    downloads_count: 234, 
    price: 699, 
    type: 'PDF 電子書',
    description: '由資深外商 BD 總監編寫，涵蓋 50 個經典面試提問、Star 原則回答公式與商務思維模擬解密。',
    status: 'published' as const,
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
];

export default async function DownloadsPage() {
  const settings = await getSiteSettingsServer();
  const primaryColor = settings.primaryColor || '#21448e';

  // Get current user session to check admin status
  // next-auth 預設 user 型別不含 role/id，於此以擴充型別讀取（後端已於 session callback 注入）
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { role?: string; id?: string } | undefined;
  const isAdmin = !!sessionUser && sessionUser.role === 'admin';
  const userId = sessionUser?.id;

  // 查詢目前使用者已購買的數位下載商品（供前台判斷顯示「立即下載」或「立即購買」）
  let ownedIds: string[] = [];
  if (userId) {
    try {
      const { data: owned } = await supabase
        .from('user_downloads')
        .select('download_id')
        .eq('user_id', userId);
      ownedIds = (owned || []).map((o: { download_id: string }) => o.download_id);
    } catch (err) {
      console.warn('Failed to query user downloads ownership:', err);
    }
  }

  let downloads: DownloadRow[] = [];
  try {
    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      downloads = data as DownloadRow[];
    } else {
      downloads = MOCK_DOWNLOADS;
    }
  } catch (err) {
    console.warn('Failed to query downloads from database, using fallback mock data:', err);
    downloads = MOCK_DOWNLOADS;
  }

  // 🔒 非管理員不可取得付費商品的 file_url（避免在 HTML/DOM 中外洩付費下載連結）
  if (!isAdmin) {
    downloads = downloads.map((d: DownloadRow) => {
      if ((d.price || 0) > 0) {
        // 移除付費商品的 file_url，避免在 HTML/DOM 中外洩下載連結
        const rest = { ...d };
        delete rest.file_url;
        return rest;
      }
      return d;
    });
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 via-gray-50/80 to-slate-100 min-h-screen pb-16 font-sans relative overflow-hidden">
      
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-[320px] left-[5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute top-[580px] right-[5%] w-[550px] h-[550px] bg-sky-200/20 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      
      {/* Header */}
      <div 
        style={{ backgroundColor: primaryColor }}
        className="w-full text-white py-16 px-6 relative overflow-hidden select-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto space-y-4 relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 回首頁
          </Link>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">實戰模板、工具白皮書與手冊</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">數位資源下載</h1>
            <p className="text-white/70 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
              提供即裝即用的專業履歷模板、生意開發策略白皮書與經典面試手冊，助您在職場快速躍升。
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4 select-none">
          <h2 className="text-lg font-black text-slate-800 flex items-center">
            <span className="w-1.5 h-5 bg-[var(--brand)] rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
            可選購數位資源 ({downloads.length})
          </h2>
          <span className="text-xs text-slate-400 font-bold">付款後即可永久下載使用</span>
        </div>

        {/* Dynamic Interactive Downloads List */}
        <DownloadsList downloads={downloads} primaryColor={primaryColor} isAdmin={!!isAdmin} ownedIds={ownedIds} isLoggedIn={!!session} />
        
      </div>

    </div>
  );
}
