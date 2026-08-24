'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Calendar, Eye, ArrowLeft, User, Tag, Clock, Share2, Heart,
  Lock, ShieldAlert, LogIn, ShoppingBag
} from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import DOMPurify from 'isomorphic-dompurify';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

// 文章內容（前端使用到的欄位）
interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  views: number;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  visibility?: string;
  required_course_ids?: string;
  is_pinned?: boolean;
  locked?: boolean;
  lockType?: string;
}

// 課程精簡資訊（用於付費鎖卡片顯示）
interface CourseSummary {
  id: string;
  title: string;
}

export default function ArticleDetailPage({ params }: ArticlePageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  // 主色改由 Context（root layout 伺服器端取一次）提供，不再每頁各自 fetch site-settings
  const primaryColor = useSettings().visual.primaryColor || '#21448e';
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  // Advanced course visibility settings
  // 僅需呼叫 setter 以保留 fetch 副作用；目前頁面不直接讀取此清單值
  const [, setPurchasedCourseIds] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<CourseSummary[]>([]);

  // Failsafe Mock Articles Fallback
  const MOCK_ARTICLES = [
    { 
      id: 'd3283ca2-c0b8-421e-a120-a42236f5b801', 
      title: '如何切入高階硬體銷售？商務開發的四大核心能力指標', 
      author: 'BDS 編輯部', 
      date: '2026-05-20', 
      views: 342, 
      category: '商務開發',
      summary: '高階硬體銷售不只是規格戰，更是商業邏輯的全面對決。本文將揭開商務開發經理不可不知的四大核心能力與思維框架。',
      content: `### 前言：硬體銷售的典範轉移\n\n在過去，硬體產品的銷售往往依賴「規格說話」或「性價比（C/P值）對決」。然而，隨著全球供應鏈的高度成熟與產品週期的極度壓縮，純粹的硬體規格差異正變得越來越小。\n\n今日的高階硬體銷售（例如伺服器集群、車載晶片、高階網通設備等），本質上已經轉化為一場**商業模式與系統整合的全面對決**。作為一名商務開發（BD）經理，想要切入這類高價值交易，您必須掌握以下四大核心能力指標：\n\n---\n\n### 一、 技術轉化商業價值的「翻譯能力」\n\n在高階硬體交易中，您的溝通對象可能非常多元——從一線的硬體研發工程師，到掌握預算大權的採購總監，甚至是決定公司策略方向的 CEO。因此，你不能只會背誦規格書上的「吞吐量、功耗、製程奈米數」。\n\n* **對研發人員**：您需要理解他們的痛點，例如散熱架構的限制、電磁相容（EMC）的調試時間。\n* **對經營階層**：您必須把「低功耗」翻譯成「每年為其資料中心省下 15% 的電費開支」，將「高度整合晶片」翻譯成「縮短大客戶產品上市時間（Time-to-market）達 3 個月」。\n\n這是一種極高難度的**溝通翻譯力**，也是切入大客戶商務開發的敲門磚。\n\n---\n\n### 二、 價值鏈的「全局地圖洞察力」\n\n高階硬體銷售很少是單純的「我賣你買」。通常一項硬體導入，會牽涉到極為複雜的供應鏈關係。例如：\n* **您的產品是系統晶片（SoC）**。\n* **您的直接客戶是 ODM 代工廠**。\n* **但真正擁有決定權的，卻是底層的品牌系統廠（OEM），甚至是提供應用服務的雲端巨擘（CSP）**。\n\n身為優秀的 BD，您必須繪製出這張**全局地圖**。您不只要說服直接買家（代工廠），更要主動接觸終端決策者（品牌廠），透過「拉動需求（Pull Strategy）」的方式，讓終端品牌廠主動要求代工廠採用您的硬體方案。\n\n---\n\n### 三、 「共同研發與風險評估」的控案力\n\n高階硬體的評估週期極長，短則半年，長則兩至三年（如汽車與航太領域）。在這段漫長的專案生命週期中，客戶最在意的不是「誰便宜」，而是**「專案能否順利量產（Mass Production）」**。\n\n因此，控案能力包含：\n* **NPI (新產品導入) 階段的協同管理**：能否及時協調內部研發資源（FAE）解決客戶工程樣機測試時發生的 Bug。\n* **產能預測與供貨彈性**：在地緣政治緊張或缺料潮下，如何給予客戶供貨保障協定（SLA）。\n\n高階硬體銷售 BD 實際上就是一個「跨國、跨團隊的專案經理」，您展現出來的控案專業度，往往決定了百萬美金合約的歸屬。\n\n---\n\n### 四、 創新的「商業模式設計力」\n\n當硬體利潤越來越薄時，領先的 BD 會轉而設計創新的商業模式。例如：\n* **Hardware as a Service (HaaS, 訂閱制硬體)**：將一次性的鉅額資本支出（CAPEX）轉化為每季/每月的營運支出（OPEX），大幅降低客戶導入的財務門檻。\n* **硬體免費，軟體或授權計費**：硬體本體以極低利潤甚至成本價售出，依靠後續的韌體升級、雲端功能授權或維護合約（SLA）獲取長期的經常性收入。\n\n---\n\n### 結語：高階 BD 的自我修煉\n\n高階硬體銷售不是一朝一夕能速成的技能。它需要對技術的熱情、對商業格局的冷靜分析，以及在漫長談判中保持耐心與底線的心理素質。希望這四大指標能成為您職涯升級的指引，共同踏上這條高價值商業之路！`,
      imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=800'
    },
    { 
      id: 'd3283ca2-c0b8-421e-a120-a42236f5b802', 
      title: '半導體供應鏈重構：業務經理必須掌握的轉型思維與契機', 
      author: 'Phyllis', 
      date: '2026-05-15', 
      views: 512, 
      category: '半導體產業',
      summary: '在地緣政治與供應鏈去中心化浪潮下，半導體業務經理如何洞察大廠採購行為轉變，並在這波轉型浪潮中爭取高價值合約。',
      content: `### 地緣政治下的供應鏈新局\n\n過去三十年間，全球半導體產業遵循著極致的「全球化分工」與「效率優先」原則。台積電專注晶圓代工，艾司摩爾專注光刻機，日月光專注封測，矽谷則專注IC設計，這種模式讓晶片成本降到了極致。\n\n然而，近年地緣政治的板塊大擠壓、晶片法案的推動，以及對於供應鏈韌性（Resilience）的追求，正徹底將半導體供應鏈從「效率優先（Just-in-Time）」轉變為**「安全與冗餘優先（Just-in-Case）」**。\n\n在這個供應鏈重構的歷史節點，半導體業務經理（Account Manager/Sales Director）若想帶領團隊突圍，必須徹底翻轉轉型思維。\n\n---\n\n### 一、 從「單一節點供貨」到「全球多元布局」的轉型思維\n\n過去，採購大廠（如 Apple, HP, Dell）在談判時，最關心的是「單價（Unit Price）」。但現在，他們的採購風控評估表格中，**「地理政治風險（Geo-political Risk）」**與**「第二供貨源（Second Source）」**的權重大幅拉高。\n\n身為業務經理，您的談判策略應進行以下轉變：\n* **不要只推銷產品，要推銷您的「生產分散地圖」**：主動向客戶展示您的晶圓是在台灣、日本、美國還是歐洲代工，封測廠位於何處。產地的多元化正成為一項可以「溢價」的賣點。\n* **協助客戶做彈性轉產評估**：主動提供「當 A 廠產能受阻時，我們能在 6 週內於 B 廠完成流片並順利無縫接軌量產」的配套方案。這將大幅增加客戶對您的依賴度。\n\n---\n\n### 二、 洞察系統廠「跳過代工直接與晶片廠合作」的全新契機\n\n這是一個極為重要的商業轉變：大型終端品牌系統廠（例如特斯拉、微軟、亞馬遜等）正加速進入「自研晶片」或「與晶片設計商/晶圓廠直接對接」的時代。\n\n* **傳統模式**：晶圓廠 -> IC 設計公司 -> 代工廠 (ODM) -> 品牌廠。\n* **全新趨勢**：品牌廠直接找晶圓代工廠客製專屬的 ASIC 晶片，再指派代工廠（ODM）裝配。\n\n業務經理必須**打破固有的通路邊界**。您不能再只拜訪代工廠的採購，而是要直接拜訪這些雲端與汽車巨擘的晶片研發與策略採購部門。這是一場高利潤、高客製化、高黏著度的「三高」合作契機。\n\n---\n\n### 三、 善用綠色供應鏈（ESG）作為新一代商務談判武器\n\n全球綠色碳關稅（如歐盟 CBAM）即將全面上路，大客戶（例如微軟承諾在 2030 年前達成負碳排放）正對其供應鏈施加巨大的減碳壓力。\n\n半導體晶片製造是耗能極大的產業。如果您能提供：\n* **低碳封測製程數據**\n* **採用 100% 綠電或高比例回收水製造的晶片證明**\n* **晶片本身的低靜態功耗設計**\n\n這些「ESG 綠色指標」正逐漸成為大廠採購評分表上的「一票否決權」。掌握 ESG 數據的業務經理，往往能直接擊敗只會打價格戰的對手。\n\n---\n\n### 結語：轉型，從思維開始\n\n供應鏈重構不是威脅，而是產業重新洗牌的大好機會。當舊有的合約關係鬆動、客戶主動尋找新來源時，就是最具進攻性的半導體業務經理奪取市場份額的黃金時代。裝備好您的全局思維，主動出擊迎戰新局！`,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800'
    },
    { 
      id: 'd3283ca2-c0b8-421e-a120-a42236f5b803', 
      title: '從新手到 ODM 求職王：外商業務的面試技巧與履歷優化指南', 
      author: 'Angela', 
      date: '2026-04-28', 
      views: 820, 
      category: '職涯成長',
      summary: '想要擠進全球頂尖 ODM 或外商科技巨擘？本文為您解密外商面試的核心提問策略與高階業務履歷包裝指南。',
      content: `### 外商業務職涯的起點\n\n在科技業中，ODM（原廠設計製造）代工大廠（如廣達、緯創、和碩、仁寶、英業達等）與跨國外商科技巨擘（如 Google, HP, Dell, Intel, NVIDIA）是許多高階業務人員夢寐以求的戰場。\n\n這些職缺不僅薪資福利優渥、能參與全球最頂尖產品的開發專案，更能迅速累積豐厚的外商與供應鏈人脈。然而，這類職缺競爭極度激烈。如何讓您在數百份履歷中脫穎而出，並在面試中一舉折服外商主管？\n\n本指南將為您拆解高階業務求職的關鍵策略。\n\n---\n\n### 一、 履歷優化：用「商業數據與影響力」說話\n\n許多業務求職者的履歷常寫滿了籠統的敘述，例如：「負責大客戶維護、善於溝通、達成業績目標」。這在外商 HR 眼中極度缺乏吸引力。高階履歷的核心公式應該是：**「Action + Scope + Result（數據化成果）」**。\n\n* **修改前**：負責美系伺服器大客戶業務，順利達成年度業績目標。\n* **修改後**：主導美系一線雲端客戶（CSP）伺服器專案，**管理年營收達 $1.2B 美金**。在原料缺料潮下，透過靈活調度產能，**將客戶專案準時交貨率（OTD）提升至 98.5%**，並成功爭取到下一代 AI 伺服器新專案，**預估為公司增長 20% 營收**。\n\n請務必在履歷中明確標註：您經手專案的 **營收規模（Revenue Size）**、**成長率（Growth Rate）** 與 **專案量產件數（Volume）**，這才是外商最看懂的商業語言。\n\n---\n\n### 二、 面試突圍：活用 STAR 原則回答「情境行為面試」\n\n外商主管最喜歡進行「行為面試（Behavioral Interview）」，提問方式通常是：「請分享你過去遇到最棘手的客訴/專案衝突，你是如何解決的？」\n\n這時候，請嚴格遵循 **STAR 原則** 進行結構化作答：\n\n* **Situation (情境)**：當時專案發生了什麼緊急狀況？（例如：大客戶要求臨時修改規格，且量產時間不能延後）。\n* **Task (任務)**：您當時面臨的挑戰與目標是什麼？（需要在 2 週內協調研發與工廠重做模具測試，否則將面臨客戶巨額罰款）。\n* **Action (行動)**：**您具體做了什麼？**（這部分是評估重點！您如何跨部門溝通？如何向客戶談判妥協方案？請說明您的協調細節）。\n* **Result (結果)**：專案最終如何圓滿落幕？帶來了什麼具體商業回饋？（成功在限期內交付，客戶滿意度達滿分，並將年度市佔份額提升至 65%）。\n\n---\n\n### 三、 展現高階業務特質：問對「好問題」\n\n在面試的最後，當面試官問：「你對我們公司還有什麼問題嗎？」這絕對不是客套，而是決定錄用與否的關鍵戰場。千萬不要問年假幾天或上下班時間，而是要提問展現您的**商業思維高度**：\n\n* **好問題範例 1**：「我注意到貴司近期正加速在東南亞（如越南/泰國）的工廠布局，站在業務管理的角度，目前在爭取美系一線客戶轉移產線的過程中，遇到最大的供應鏈痛點是什麼？我加入後該如何協助克服？」\n* **好問題範例 2**：「對於這個大客戶帳戶，您認為在接下來的 12 個月內，最迫切需要被解決的痛點是提升毛利率，還是開拓新專案機會？」\n\n這類問題會讓面試官覺得：**「你不是來求職的，你是來當我的戰略合作夥伴的。」**\n\n---\n\n### 結語：求職即是自我銷售\n\n求職本質上就是一場業務推銷——而您自己就是那項最高價值的「硬體產品」。透過數據化履歷展現您的實力規格，透過結構化回答證明您的控案效能，您一定能在這波高階科技業務求職潮中，順利奪下金牌 Offer！`,
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800'
    }
  ];

  useEffect(() => {
    // Fetch specific article by ID or custom Slug
    fetch(`/api/articles?id=${id}`)
      .then(async res => {
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (data && data.title) {
          setArticle({
            id: data.id,
            title: data.title,
            author: data.author || 'BDS 編輯部',
            date: data.date ? data.date.split('T')[0] : '',
            views: data.views || 0,
            category: data.category || '',
            summary: data.summary || '',
            content: data.content || '',
            imageUrl: data.image_url || data.imageUrl || 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=800',
            visibility: data.visibility || 'public',
            required_course_ids: data.required_course_ids || '',
            is_pinned: !!data.is_pinned,
            locked: !!data.locked,
            lockType: data.lockType || 'public'
          });
        } else {
          throw new Error('Invalid article payload');
        }
      })
      .catch(err => {
        console.warn("Using fallback local mockup data for article detail:", err);
        // Find in local MOCK_ARTICLES
        const found = MOCK_ARTICLES.find(a => a.id === id);
        if (found) {
          setArticle(found);
        } else {
          console.error("Article not found in mock list either:", id);
          router.push('/articles'); // Go back if not found anywhere
        }
      })
      .finally(() => {
        setLoading(false);
      });

    // 3. Fetch current logged-in user course permissions
    fetch('/api/user/courses')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in or guest');
      })
      .then(ids => {
        if (Array.isArray(ids)) {
          setPurchasedCourseIds(ids);
        }
      })
      .catch(() => setPurchasedCourseIds([]));

    // 4. Fetch all public courses to translate ID -> Title on guide card
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllCourses(data);
        }
      })
      .catch(err => console.warn('無法載入公共課程清單：', err));
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.summary,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('文章連結已成功複製至剪貼簿！可直接分享給好友。');
    }
  };

  // Custom premium Lightweight Markdown Content Parser
  const parseInlineMarkdown = (text: string) => {
    if (!text) return '';
    
    // Regex matches **bold** or <span style="color:#xxxxxx">content</span>
    const regex = /(\*\*[^*]+\*\*|<span style="color:\s*#[a-fA-F0-9]{3,6}">[^<]+<\/span>)/g;
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-slate-950 font-black">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('<span style="color:') && part.endsWith('</span>')) {
        const colorMatch = part.match(/color:\s*(#[a-fA-F0-9]{3,6})/);
        const textMatch = part.match(/>([^<]+)</);
        const color = colorMatch ? colorMatch[1] : 'inherit';
        const content = textMatch ? textMatch[1] : '';
        return (
          <span key={i} style={{ color }} className="font-black">
            {content}
          </span>
        );
      }
      return part;
    });
  };

  const renderContent = (markdownText: string) => {
    if (!markdownText) return null;
    // 內容可能以字面 "\n"（反斜線+n，常見於 SQL 單引號字串種子資料）儲存，
    // 先正規化為真正的換行，避免整篇擠成一行而露出 ###、**、--- 等 Markdown 符號
    const normalized = markdownText.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    return normalized.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return (
          <h3 key={idx} className="text-lg font-black text-slate-800 mt-8 mb-4 border-b border-slate-50 pb-2.5 flex items-center select-none text-left">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></span>
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h2 key={idx} className="text-xl font-black text-slate-800 mt-10 mb-5 border-b border-slate-100 pb-3 flex items-center select-none text-left">
            <span className="w-2 h-5 bg-indigo-600 rounded-full mr-2.5" style={{ backgroundColor: primaryColor }}></span>
            {trimmed.replace(/^##\s*/, '')}
          </h2>
        );
      }
      if (trimmed.startsWith('---')) {
        return <hr key={idx} className="my-8 border-slate-100 select-none" />;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return (
          <div key={idx} className="flex items-start my-2.5 pl-4 text-xs md:text-sm font-semibold text-slate-600 leading-relaxed text-left">
            <span className="text-indigo-600 font-extrabold mr-2 select-none" style={{ color: primaryColor }}>•</span>
            <p className="flex-1">{parseInlineMarkdown(trimmed.replace(/^[-*]\s*/, ''))}</p>
          </div>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-3 select-none" />;
      }
      return (
        <p key={idx} className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed mb-5 text-left">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  const isHTML = (str: string) => {
    if (!str) return false;
    return /<[a-z][\s\S]*>/i.test(str);
  };

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20 font-sans text-slate-700">
      
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-slate-100 select-none">
        <div className="max-w-[800px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link 
            href="/articles"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> 返回專欄列表
          </Link>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setLiked(!liked)} 
              className={`p-2 rounded-xl border transition ${liked ? 'bg-rose-50 border-rose-100 text-rose-500' : 'border-slate-100 hover:bg-slate-50 text-slate-400'} cursor-pointer`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 cursor-pointer transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[800px] mx-auto px-6 py-10 space-y-8">
        
        {loading ? (
          <div className="py-32 text-center text-slate-400 font-semibold text-xs select-none">
            專欄文章內容加載中...
          </div>
        ) : article ? (
          <article className="space-y-8 bg-white rounded-3xl border border-slate-100/70 p-6 md:p-10 shadow-xs">
            
            {/* Category tag & Title */}
            <div className="space-y-4 text-left">
              <span 
                style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black select-none"
              >
                <Tag className="w-3.5 h-3.5 mr-1" />
                {article.category}
              </span>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 leading-snug tracking-tight">
                {article.title}
              </h1>

              {/* Meta information row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-400 font-bold border-t border-b border-slate-50 py-3.5 select-none">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>由 {article.author} 發布</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>累積觀看: {article.views} 次</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-slate-300" />
                  <span>閱讀時間約 {Math.max(1, Math.ceil((article.content?.length ?? 0) / 400))} 分鐘</span>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            {article.imageUrl && (
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs select-none">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (!t.src.endsWith('/images/course-placeholder.svg')) t.src = '/images/course-placeholder.svg';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Summary Box */}
            {article.summary && (
              <div className="p-5 bg-slate-50 rounded-2xl border-l-4 border-indigo-600 text-left text-xs md:text-sm font-semibold text-slate-500 leading-relaxed" style={{ borderLeftColor: primaryColor }}>
                {article.summary}
              </div>
            )}

            {/* Content Body */}
            <div className="prose prose-slate max-w-none pt-4">
              {(() => {
                // 1. 權限檢驗：以後端回傳的 locked / lockType 為準（後端已驗證），
                //    前端不再自行判斷，避免雙重邏輯不一致或被繞過
                const hasAccess = !article.locked;
                const isMemberOnly = article.lockType === 'members';
                const isCoursePurchaserOnly = article.lockType === 'course_purchasers';

                if (hasAccess) {
                  // 渲染文章內容
                  return isHTML(article.content) ? (
                    <div
                      className="text-left text-xs md:text-sm text-slate-600 font-semibold leading-relaxed space-y-4 prose-headings:font-black prose-h2:text-xl prose-h3:text-lg prose-strong:text-slate-900 prose-strong:font-black"
                      // 以 DOMPurify 消毒後才注入，過濾 <script>、on* 事件屬性、javascript: 等 XSS 向量
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
                    />
                  ) : (
                    renderContent(article.content)
                  );
                }

                // 2. 當無權限時，判斷渲染哪種付費鎖
                if (isMemberOnly) {
                  return (
                    <div className="relative pt-6 select-none">
                      <div className="space-y-3 opacity-25 pointer-events-none filter blur-xs">
                        <p className="h-4 bg-slate-200 rounded w-full"></p>
                        <p className="h-4 bg-slate-200 rounded w-5/6"></p>
                        <p className="h-4 bg-slate-200 rounded w-4/6"></p>
                        <p className="h-4 bg-slate-200 rounded w-full"></p>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in duration-200">
                          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-slate-800">付費會員專屬專欄</h3>
                            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                              {session
                                ? '本篇深度產業觀察報告僅限 BDS 付費會員閱讀。訂閱任一會員方案，即可立即解鎖全站會員專屬文章！'
                                : '本篇深度產業觀察報告僅限 BDS 付費會員閱讀。請先登入，並訂閱會員方案以解鎖完整內容。'}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(session ? '/membership' : `/login?callbackUrl=/articles/${id}`)}
                            style={{ backgroundColor: primaryColor }}
                            className="w-full text-white font-bold text-xs py-2.5 rounded-xl transition hover:opacity-90 active:scale-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            {session ? <ShoppingBag className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                            <span>{session ? '前往訂閱會員方案' : '登入以解鎖'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isCoursePurchaserOnly) {
                  const requiredIds = article.required_course_ids ? article.required_course_ids.split(',').filter(Boolean) : [];
                  const lockedCourses = allCourses.filter(c => requiredIds.includes(c.id));

                  return (
                    <div className="relative pt-6 select-none">
                      <div className="space-y-3 opacity-25 pointer-events-none filter blur-xs animate-pulse">
                        <p className="h-4 bg-slate-200 rounded w-full"></p>
                        <p className="h-4 bg-slate-200 rounded w-5/6"></p>
                        <p className="h-4 bg-slate-200 rounded w-4/6"></p>
                        <p className="h-4 bg-slate-200 rounded w-full"></p>
                      </div>
                      
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in duration-200">
                          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div className="space-y-2.5">
                            <h3 className="text-base font-black text-slate-800">付費訂閱學員專屬內容</h3>
                            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                              本篇為 BDS 付費學員限定解鎖之高階產業洞察報告。購買下方任一指定精選課程，即可即刻開通完整閱讀權限！
                            </p>
                          </div>
                          
                          <div className="space-y-3 max-h-[220px] overflow-y-auto">
                            {lockedCourses.length > 0 ? (
                              lockedCourses.map(course => (
                                <div key={course.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-slate-700 truncate">{course.title}</h4>
                                    <p className="text-[9px] text-indigo-600 font-black mt-1">解鎖本專欄文章 + 終身課程複習</p>
                                  </div>
                                  <button 
                                    onClick={() => router.push(`/courses/${course.id}`)}
                                    className="flex-shrink-0 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>去解鎖</span>
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-black text-slate-700 truncate">限定指定付費課程學員解鎖</h4>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">請至課程專區挑選課程以開通權限</p>
                                </div>
                                <button 
                                  onClick={() => router.push(`/courses`)}
                                  className="flex-shrink-0 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>瀏覽課程</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>

          </article>
        ) : (
          <div className="py-20 text-center bg-white border border-slate-100 rounded-3xl p-16 select-none shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">找不到該文章</h3>
            <p className="text-slate-400 text-xs font-semibold">此文章可能已被刪除或下架，請回到文章列表改選其他主題。</p>
            <button
              onClick={() => router.push('/articles')}
              style={{ backgroundColor: primaryColor }}
              className="text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition hover:opacity-90 active:scale-95 cursor-pointer"
            >
              返回文章專欄
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
