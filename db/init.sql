-- ============================================================
-- BDS Web 資料庫初始化整合腳本
-- 用法：複製整份內容到 Supabase SQL Editor 執行即可。
-- 本腳本為冪等設計（可重複執行，不會因已存在而報錯）。
-- 整合自 db/ 目錄下所有 .sql 檔案，並修正執行順序與相依問題。
-- ============================================================

-- 0. 啟用 UUID 擴充套件（schema 內 uuid_generate_v4() 需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 核心資料表
-- ============================================================

-- Users（使用者）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'user', -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses（課程）
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price INTEGER NOT NULL,
  category TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters（課程章節 / 單元）
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT, -- YouTube/Vimeo ID or URL
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders（PayUni 金流訂單）
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, -- MerTradeNo for PayUni
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  payment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Courses（使用者課程權限 / 已購買）
CREATE TABLE IF NOT EXISTS user_courses (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

-- Events（活動）
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  price_display TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  registration_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles（文章 / 部落格）
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'BDS 編輯部',
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'published',
  slug TEXT UNIQUE,
  tags TEXT,
  seo_title TEXT,
  seo_description TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public',
  required_course_ids TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads（數位下載商品）
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  description TEXT,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Downloads（使用者數位下載擁有權 / 已購買）
CREATE TABLE IF NOT EXISTS user_downloads (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  download_id UUID REFERENCES downloads(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, download_id)
);

-- Membership Plans（會員方案）
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL, -- '月繳', '年繳', '一次性'
  description TEXT,
  features TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- 'active' or 'draft'
  subscribers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Settings（網站全域設定）
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Announcements（課程公告）
CREATE TABLE IF NOT EXISTS course_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_announcements_course_id ON course_announcements(course_id);

-- Course Reviews（課程評價，購買/有權學員可發佈，公開顯示）
CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);

-- Course Comments（章節問題與討論留言，需管理員審核後公開，可附管理員回覆）
CREATE TABLE IF NOT EXISTS course_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  course_title TEXT,
  chapter_title TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'approved'
  reply TEXT,
  reply_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_comments_course_id ON course_comments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_chapter_id ON course_comments(chapter_id);

-- ============================================================
-- 2. 後續新增欄位（migrations）
-- ============================================================

-- users：手機號碼、會員方案、會員到期
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE;

-- orders：會員方案關聯
ALTER TABLE orders ADD COLUMN IF NOT EXISTS membership_plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL;

-- orders：數位下載商品關聯
ALTER TABLE orders ADD COLUMN IF NOT EXISTS download_id UUID REFERENCES downloads(id) ON DELETE SET NULL;

-- courses：講師與自訂設定
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor TEXT DEFAULT 'BDS 團隊';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS allow_ratings BOOLEAN DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url TEXT;

-- chapters：附件檔案
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS file_url TEXT;

-- ============================================================
-- 2.5 關閉 Row Level Security (RLS)
--   本 App 直接以 anon 公開金鑰存取資料庫、身份驗證交由 NextAuth 處理，
--   因此這些資料表需關閉 RLS，否則公開金鑰的讀寫（如註冊）會被擋下
--   並出現「42501 new row violates row-level security policy」錯誤。
--   ⚠️ 安全提醒：關閉後，持有公開金鑰者可直接透過 Supabase REST API
--      存取這些表。此為本專案既有設計；若日後要強化安全，需改用
--      service_role 金鑰於後端並撰寫對應的 RLS 政策。
-- ============================================================
ALTER TABLE users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses             DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters            DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders              DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses        DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_downloads      DISABLE ROW LEVEL SECURITY;
ALTER TABLE events              DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles            DISABLE ROW LEVEL SECURITY;
ALTER TABLE downloads           DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans    DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings       DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews      DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments     DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. 初始資料 (Seed Data) — 皆使用 ON CONFLICT DO NOTHING
-- ============================================================

-- 3a. 會員方案
INSERT INTO membership_plans (id, title, price, period, description, features, is_popular, status)
VALUES
  ('182000da-6fcd-4748-86df-e1f3b122a8c1', 'BDS 產業升級訂閱制 - 月費方案', 990, '月繳',
    '適合想要按月體驗與小步快跑學習的業務新手。',
    ARRAY['暢讀所有產業觀察專欄文章', '每月解鎖 1 門新技術/產業講座課程', '專屬學員 Discord 行動社群交流', '享有數位模板 8 折專屬優惠'],
    false, 'active'),
  ('182000da-6fcd-4748-86df-e1f3b122a8c2', 'BDS 產業升級訂閱制 - 年費極致方案', 9500, '年繳',
    '高性價比黃金選擇，最受中高階銷售 BD 與經理歡迎。',
    ARRAY['暢讀所有產業觀察專欄文章', '無限暢看全站所有線上產業/新手村課程', 'VIP 線下沙龍實體小聚免費入場', '享數位模板 & 白皮書 5 折專屬折扣', '與業界前輩 1對1 生意談判諮詢 1 次'],
    true, 'active'),
  ('182000da-6fcd-4748-86df-e1f3b122a8c3', 'BDS VIP 創始永久會員專案', 25000, '一次性',
    '專屬產業頂尖領袖與創始支持者的永久尊榮席次。',
    ARRAY['終身免費學習全站所有既有與未來新課程', '創始永久 VIP 社群核心通道', '所有數位資源、模板、白皮書終身免費下載', '與創辦團隊進行 1對1 生涯發展/談判輔導 3 次', '線下 VIP 晚宴尊崇受邀資格'],
    false, 'active')
ON CONFLICT (id) DO NOTHING;

-- 3b. 活動
INSERT INTO events (id, title, description, image_url, price, price_display, date, location, attendees, status, type, category, registration_url)
VALUES
  ('182000da-6fcd-4748-86df-e1f3b122a8c1', 'BDS 半導體業務核心思維實戰營',
    '專門為半導體上中下游業務人員設計的核心思維實戰營，帶您突破業績瓶頸與大客戶談判。',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    1980, 'NT$ 1,980', '2026-06-15 14:00:00+08', '線上直播 (Zoom)', 48, 'upcoming', '線上實戰營', '工作坊', 'https://zoom.us'),
  ('182000da-6fcd-4748-86df-e1f3b122a8c2', '醫材商務開發與法規布局沙龍',
    '匯聚生技與醫材領域商務開發專家，深度剖析法規申請流程與海內外代理商通路布局策略。',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
    800, 'NT$ 800', '2026-05-18 19:30:00+08', '台北市大安區信義路四段', 32, 'completed', '線下沙龍', '線下聚會', NULL),
  ('182000da-6fcd-4748-86df-e1f3b122a8c3', 'BDS 爐邊對話：硬體 ODM 的全球銷售戰略',
    '爐邊對談特別場——特邀業界高階銷售主管，分享硬體製造與全球品牌客戶銷售談判的實戰心法。',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
    0, '免費活動', '2026-04-10 20:00:00+08', '線上直播 (Zoom)', 75, 'completed', '線上講座', '線上讀書會', NULL)
ON CONFLICT (id) DO NOTHING;

-- 3c. 文章
INSERT INTO articles (id, title, author, date, views, category, summary, content, image_url, status)
VALUES
  ('d3283ca2-c0b8-421e-a120-a42236f5b801',
    '如何切入高階硬體銷售？商務開發的四大核心能力指標', 'BDS 編輯部', '2026-05-20 10:00:00+08', 342, '商務開發',
    '高階硬體銷售不只是規格戰，更是商業邏輯的全面對決。本文將揭開商務開發經理不可不知的四大核心能力與思維框架。',
    '### 前言：硬體銷售的典範轉移\n\n在過去，硬體產品的銷售往往依賴「規格說話」或「性價比（C/P值）對決」。然而，隨著全球供應鏈的高度成熟與產品週期的極度壓縮，純粹的硬體規格差異正變得越來越小。\n\n今日的高階硬體銷售（例如伺服器集群、車載晶片、高階網通設備等），本質上已經轉化為一場**商業模式與系統整合的全面對決**。作為一名商務開發（BD）經理，想要切入這類高價值交易，您必須掌握以下四大核心能力指標：\n\n---\n\n### 一、 技術轉化商業價值的「翻譯能力」\n\n在高階硬體交易中，您的溝通對象可能非常多元——從一線的硬體研發工程師，到掌握預算大權的採購總監，甚至是決定公司策略方向的 CEO。因此，你不能只會背誦規格書上的「吞吐量、功耗、製程奈米數」。\n\n* **對研發人員**：您需要理解他們的痛點，例如散熱架構的限制、電磁相容（EMC）的調試時間。\n* **對經營階層**：您必須把「低功耗」翻譯成「每年為其資料中心省下 15% 的電費開支」，將「高度整合晶片」翻譯成「縮短大客戶產品上市時間（Time-to-market）達 3 個月」。\n\n這是一種極高難度的**溝通翻譯力**，也是切入大客戶商務開發的敲門磚。\n\n---\n\n### 二、 價值鏈的「全局地圖洞察力」\n\n高階硬體銷售很少是單純的「我賣你買」。通常一項硬體的導入，會牽涉到極為複雜的供應鏈關係。例如：\n1. 您的產品是系統晶片（SoC）。\n2. 您的直接客戶是 ODM 代工廠。\n3. 但真正擁有決定權的，卻是底層的品牌系統廠（OEM），甚至是提供應用服務的雲端巨擘（Csp）。\n\n身為優秀的 BD，您必須繪製出這張**全局地圖**，透過「拉動需求（Pull Strategy）」的方式，讓終端品牌廠主動要求代工廠採用您的硬體方案。\n\n---\n\n### 三、 「共同研發與風險評估」的控案力\n\n高階硬體的評估週期極長，短則半年，長則兩至三年（如汽車與航太領域）。在這段漫長的專案生命週期中，客戶最在意的不是「誰便宜」，而是**「專案能否順利量產（Mass Production）」**。\n\n高階硬體銷售 BD 實際上就是一個「跨國、跨團隊的專案經理」，您展現出來的控案專業度，往往決定了百萬美金合約的歸屬。\n\n---\n\n### 四、 創新的「商業模式設計力」\n\n當硬體利潤越來越薄時，領先的 BD 會轉而設計創新的商業模式，例如 Hardware as a Service（HaaS, 訂閱制硬體），或硬體免費、軟體或授權計費，依靠後續經常性收入獲利。\n\n---\n\n### 結語：高階 BD 的自我修煉\n\n高階硬體銷售不是一朝一夕能速成的技能。希望這四大指標能成為您職涯升級的指引，共同踏上這條高價值商業之路！',
    'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=800', 'published'),
  ('d3283ca2-c0b8-421e-a120-a42236f5b802',
    '半導體供應鏈重構：業務經理必須掌握的轉型思維與契機', 'Phyllis', '2026-05-15 14:30:00+08', 512, '半導體產業',
    '在地緣政治與供應鏈去中心化浪潮下，半導體業務經理如何洞察大廠採購行為轉變，並在這波轉型浪潮中爭取高價值合約。',
    '### 地緣政治下的供應鏈新局\n\n過去三十年間，全球半導體產業遵循著極致的「全球化分工」與「效率優先」原則。台積電專注晶圓代工，艾司摩爾專注光刻機，日月光專注封測，矽谷則專注IC設計，這種模式讓晶片成本降到了極致。\n\n然而，近年地緣政治的板塊大擠壓、晶片法案的推動，以及對於供應鏈韌性（Resilience）的追求，正徹底將半導體供應鏈從「效率優先（Just-in-Time）」轉變為**「安全與冗餘優先（Just-in-Case）」**。\n\n---\n\n### 一、 從「單一節點供貨」到「全球多元布局」的轉型思維\n\n採購大廠的風控評估表格中，**「地理政治風險」**與**「第二供貨源（Second Source）」**的權重大幅拉高。身為業務經理，您應主動推銷您的「生產分散地圖」，並協助客戶做彈性轉產評估。\n\n---\n\n### 二、 洞察系統廠「跳過代工直接與晶片廠合作」的全新契機\n\n大型終端品牌系統廠（如特斯拉、微軟、亞馬遜）正加速進入「自研晶片」時代。業務經理必須**打破固有的通路邊界**，直接拜訪這些雲端與汽車巨擘的晶片研發與策略採購部門。\n\n---\n\n### 三、 善用綠色供應鏈（ESG）作為新一代商務談判武器\n\n全球綠色碳關稅（如歐盟 CBAM）即將上路。能提供低碳製程數據、綠電製造證明與低功耗設計的業務經理，往往能直接擊敗只會打價格戰的對手。\n\n---\n\n### 結語：轉型，從思維開始\n\n供應鏈重構不是威脅，而是產業重新洗牌的大好機會。裝備好您的全局思維，主動出擊迎戰新局！',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', 'published'),
  ('d3283ca2-c0b8-421e-a120-a42236f5b803',
    '從新手到 ODM 求職王：外商業務的面試技巧與履歷優化指南', 'Angela', '2026-04-28 09:15:00+08', 820, '職涯成長',
    '想要擠進全球頂尖 ODM 或外商科技巨擘？本文為您解密外商面試的核心提問策略與高階業務履歷包裝指南。',
    '### 外商業務職涯的起點\n\n在科技業中，ODM（原廠設計製造）代工大廠（如廣達、緯創、和碩、仁寶、英業達等）與跨國外商科技巨擘（如 Google, HP, Dell, Intel, NVIDIA）是許多高階業務人員夢寐以求的戰場。然而，這類職缺競爭極度激烈。本指南將為您拆解高階業務求職的關鍵策略。\n\n---\n\n### 一、 履歷優化：用「商業數據與影響力」說話\n\n高階履歷的核心公式應該是：**「Action + Scope + Result（數據化成果）」**。請務必在履歷中明確標註您經手專案的 **營收規模**、**成長率** 與 **專案量產件數**，這才是外商最看懂的商業語言。\n\n---\n\n### 二、 面試突圍：活用 STAR 原則回答「情境行為面試」\n\n請嚴格遵循 **STAR 原則**：Situation（情境）、Task（任務）、Action（行動，評估重點）、Result（結果，數據化商業回饋）進行結構化作答。\n\n---\n\n### 三、 展現高階業務特質：問對「好問題」\n\n面試最後的提問是決定錄用與否的關鍵戰場。請提問展現您的**商業思維高度**，讓面試官覺得：**「你不是來求職的，你是來當我的戰略合作夥伴的。」**\n\n---\n\n### 結語：求職即是自我銷售\n\n求職本質上就是一場業務推銷——而您自己就是那項最高價值的「硬體產品」。透過數據化履歷展現實力，您一定能順利奪下金牌 Offer！',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800', 'published')
ON CONFLICT (id) DO NOTHING;

-- 3d. 首頁網站設定
INSERT INTO site_settings (key, value)
VALUES (
  'homepage',
  '{
    "primaryColor": "#21448e",
    "logoUrl": "https://s.teachifycdn.com/image/width=400,quality=80/school/logo/a0285805-c7b3-48c3-bd43-24c2909be4e2/9c048f8f-d7d1-4091-9ea6-aa921655102a.png",
    "slogan": "業務不是超人，卻有超能力！",
    "carouselSlides": [
      { "id": "1", "imageUrl": "https://warehouse.kaik.network/school/images/1a375793-d194-4c52-a000-ec9f8a59f2f2.jpg", "link": "/courses" },
      { "id": "2", "imageUrl": "https://warehouse.kaik.network/school/images/22713f2b-fc91-4c0c-ab4c-9a3097656001.png", "link": "/courses" },
      { "id": "3", "imageUrl": "https://warehouse.kaik.network/school/images/ec48d188-e0b5-4496-8810-26ddfc4b0038.png", "link": "/courses" }
    ],
    "sectionImage1": { "imageUrl": "https://warehouse.kaik.network/school/images/800c43d7-815d-4b73-8347-0f76477826f0.jpg", "link": "/courses" },
    "sectionImage2": { "imageUrl": "https://warehouse.kaik.network/school/images/5b9a03dd-e0b5-4108-926e-0e0ba29afab3.jpg", "link": "/courses" }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 完成！後續若要建立管理員帳號，請參考下方範例（密碼需用 bcrypt 雜湊）：
--   UPDATE users SET role = 'admin' WHERE email = '你的管理員信箱';
-- ============================================================
