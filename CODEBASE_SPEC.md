# BDS (By Doing So) 網站前後端系統架構與技術規格說明書

本文件提供 BDS 線上學習平台（基於 Next.js 構建）極為詳細的技術規格與系統架構說明。本說明書可作為開發人員、AI 助手以及自動化工具（例如 `claude-cli`）的完整參考指南，幫助快速理解專案的目錄結構、資料庫設計、身分驗證、金流串接、後台管理與信件發送機制。

---

## 1. 專案概述與目標
* **專案背景**：將 BDS 學習平台自原有的 Teachify 平台遷移至完全獨立開發的 Next.js 平台。
* **核心價值**：利用免費或低成本的雲端伺服器工具（Vercel  Hobby 免費版、Supabase Database 免費額度、Resend 每月 3,000 封免費發信額度），將平台維運成本從**每年約新台幣 50,000 元**大幅降低至**每年 1,000 元以下**（僅需支付網域費用）。
* **技術架構**：Next.js 15+ (App Router) + TypeScript + PostgreSQL (Supabase) + PayUni (統一金流) + NextAuth.js + Tailwind CSS。

---

## 2. 專案目錄結構圖

```text
/
├── db/                                # 資料庫 SQL 遷移與表格表格初始化腳本
│   ├── schema.sql                     # 核心資料庫 Schema 定義
│   ├── initialize_site_settings.sql   # site_settings 表格初始化與預設視覺設定值
│   ├── create_membership_tables.sql   # 會員訂閱方案相關資料表設定
│   └── add_course_custom_settings.sql # 課程自訂屬性與章節附件欄位更新
├── src/
│   ├── app/                           # Next.js App Router 根目錄
│   │   ├── admin/                     # 管理員後台頁面
│   │   │   ├── comments/              # 課堂留言審核管理（使用 Local Storage 同步）
│   │   │   ├── courses/               # 課程管理與章節編輯
│   │   │   ├── finance/               # 財務報表與訂單歷史紀錄
│   │   │   ├── membership/            # 會員方案設定頁面
│   │   │   ├── rewards/               # 推薦行銷與分潤設定頁面 (固定 5% 分潤)
│   │   │   ├── settings/              # 系統基本設定
│   │   │   └── page.tsx               # 後台儀表板主頁
│   │   ├── api/                       # 後端 REST API 路由
│   │   │   ├── auth/                  # 身分驗證相關 API
│   │   │   │   ├── [...nextauth]/     # NextAuth 核心配置 (GET/POST 處理器)
│   │   │   │   └── signup/            # 使用者註冊接口
│   │   │   ├── checkout/              # PayUni 金流相關 API
│   │   │   │   ├── callback/          # 接收 PayUni 支付完成通知，負責更新訂單及開通權限
│   │   │   │   └── simulate/          # 測試環境專用：免跳轉金流，一鍵模擬支付成功
│   │   │   │   └── route.ts           # 處理結帳加密並回傳 PayUni 所需參數
│   │   │   └── admin/                 # 後台管理專用 API
│   │   │       └── site-settings/     # 視覺外觀設定動態更新 API
│   │   ├── courses/                   # 前台課程頁面
│   │   │   ├── [id]/
│   │   │   │   ├── learn/
│   │   │   │   │   ├── [chapterId]/   # 影片播放與學習互動主頁（含提問討論區）
│   │   │   │   │   └── page.tsx       # 自動跳轉至課程之第一章節
│   │   │   │   └── page.tsx           # 課程詳細介紹頁面與購買按鈕
│   │   │   └── page.tsx               # 課程列表大廳
│   │   ├── articles/                  # 專欄文章模組頁面
│   │   │   ├── [id]/                  # 文章詳細閱讀頁面 (支援登入/購課付費牆攔截)
│   │   │   └── page.tsx               # 專欄文章列表大廳
│   │   ├── events/                    # 線上實戰營與線下沙龍活動頁面
│   │   │   └── page.tsx               # 活動預告與歷史精彩回顧列表
│   │   ├── downloads/                 # 數位講義與工具資源下載專區
│   │   │   └── page.tsx               # 可下載數位資源列表與選購彈窗
│   │   ├── login/                     # 登入頁面
│   │   ├── signup/                    # 註冊頁面
│   │   ├── page.tsx                   # 平台首頁（伺服器端渲染，呼叫 HomeClient）
│   │   ├── layout.tsx                 # 全域版面與字型配置，注入驗證與狀態 Provider
│   │   └── globals.css                # 全域 CSS 樣式
│   ├── components/                    # 封裝好的前端 React 組件
│   │   ├── BuyButton.tsx              # 課程購買按鈕（發送 API 並自動 POST 隱藏表單至 PayUni）
│   │   ├── HomeClient.tsx             # 首頁交互式外觀（包含輪播圖、課程牆與介紹）
│   │   ├── LearnExtraDetails.tsx      # 播放器側邊欄分頁（講義下載、LocalStorage 問答區）
│   │   ├── MembershipList.tsx         # 訂閱會員方案列表（整合真實金流與模擬器）
│   │   ├── DownloadsList.tsx          # 數位下載專屬列表，封裝選購細節與下載鏈接驗證
│   │   ├── Navbar.tsx                 # 頂部導覽列，整合登入狀態與後台入口
│   │   ├── VideoPlayer.tsx            # 支援多種串流的播放器 (Bunny.net, Vimeo, YouTube, HTML5 MP4)
│   │   └── Providers.tsx              # SessionProvider 等全域狀態包裹器
│   ├── lib/                           # 後端/共用公用函式庫
│   │   ├── courses.ts                 # 課程抓取、權限檢驗等資料庫邏輯
│   │   ├── email.ts                   # 基於 Resend REST API 的免套件交易信件發送工具
│   │   ├── payuni.ts                  # 負責 PayUni AES-256-GCM 加解密與 SHA256 簽章產生器
│   │   ├── site-settings.ts           # 視覺設定載入/更新器（整合 Supabase 與 JSON 雙備份）
│   │   ├── supabase.ts                # 初始化 Supabase Client
│   │   ├── types.ts                   # 專案 TypeScript 介面定義
│   │   └── users.ts                   # 讀取使用者資料輔助函式
└── package.json                       # 依賴套件配置與建置指令
```

---

## 3. 資料庫結構設計 (`PostgreSQL`)

本專案資料庫採用 PostgreSQL，在生產環境中建議託管於 Supabase。以下為各資料表的欄位細節：

### `users` (使用者資料表)
* **`id`** (`UUID`, 主鍵, 預設為 `uuid_generate_v4()`): 唯一使用者識別碼。
* **`email`** (`TEXT`, 唯一, 必填): 註冊信箱，同時作為登入帳號。
* **`name`** (`TEXT`): 使用者顯示名稱。
* **`password_hash`** (`TEXT`): 經由 Bcrypt 加密後的密碼雜湊。
* **`role`** (`TEXT`, 預設為 `'user'`): 身分權限，可為 `'admin'` (管理員) 或 `'user'` (一般學員)。
* **`membership_plan_id`** (`UUID`, 外鍵參照 `membership_plans.id`, 可為空): 目前訂閱的會員方案。
* **`membership_expires_at`** (`TIMESTAMP WITH TIME ZONE`, 可為空): 會員方案的過期截止時間。
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, 預設為 `NOW()`): 註冊時間。

### `courses` (課程主表)
* **`id`** (`UUID`, 主鍵, 預設為 `uuid_generate_v4()`): 唯一課程識別碼。
* **`title`** (`TEXT`, 必填): 課程標題。
* **`description`** (`TEXT`): 課程詳細說明、介紹（支援 HTML/Markdown 內容）。
* **`thumbnail_url`** (`TEXT`): 課程封面圖片網址。
* **`price`** (`INTEGER`, 必填): 課程定價（新台幣 TWD）。
* **`category`** (`TEXT`): 課程分類標籤。
* **`is_published`** (`BOOLEAN`, 預設為 `FALSE`): 是否發佈（控制前台是否顯示）。
* **`is_hidden`** (`BOOLEAN`, 預設為 `FALSE`): 是否隱藏（設為 True 則在前台大廳隱藏，但可透過連結直達）。
* **`allow_comments`** (`BOOLEAN`, 預設為 `TRUE`): 是否允許學員在播放頁面留言提問。
* **`allow_ratings`** (`BOOLEAN`, 預設為 `TRUE`): 是否啟用課程評分。
* **`file_url`** (`TEXT`, 可為空): 全課共享講義/附件下載連結。
* **`video_url`** (`TEXT`, 可為空): 課程前導宣傳影片網址。
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, 預設為 `NOW()`): 建立時間。

### `chapters` (章節單元資料表)
* **`id`** (`UUID`, 主鍵, 預設為 `uuid_generate_v4()`): 唯一單元識別碼。
* **`course_id`** (`UUID`, 外鍵參照 `courses.id` 且級聯刪除): 所屬課程。
* **`title`** (`TEXT`, 必填): 單元/章節名稱。
* **`video_url`** (`TEXT`): 本章影片網址（支援 Bunny.net, Vimeo, YouTube, HTML5 MP4 檔案）。
* **`file_url`** (`TEXT`, 可為空): 本章專屬講義檔案下載連結。
* **`order_index`** (`INTEGER`, 必填): 章節排序權重（決定播放清單中的前後順序）。
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, 預設為 `NOW()`): 建立時間。

### `orders` (訂單交易資料表)
* **`id`** (`TEXT`, 主鍵): 訂單編號，對應 PayUni 的 `MerTradeNo` 欄位（以 `BDS` 開頭）。
* **`user_id`** (`UUID`, 外鍵參照 `users.id`): 購買學員 ID。
* **`course_id`** (`UUID`, 外鍵參照 `courses.id`, 可為空): 購買的課程 ID（單堂購買時填入）。
* **`membership_plan_id`** (`UUID`, 外鍵參照 `membership_plans.id`, 可為空): 購買的訂閱會員方案 ID（訂閱時填入）。
* **`amount`** (`INTEGER`, 必填): 交易金額（新台幣 TWD）。
* **`status`** (`TEXT`, 預設為 `'pending'`): 訂單狀態，包括 `'pending'` (待付款), `'paid'` (已付款), `'failed'` (付款失敗/過期)。
* **`payment_type`** (`TEXT`): 付款管道（例如：信用卡 `CREDIT`、測試模擬 `SIMULATED_TEST`）。
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, 預設為 `NOW()`).
* **`updated_at`** (`TIMESTAMP WITH TIME ZONE`, 預設為 `NOW()`).

### `user_courses` (學員課程權限關聯表)
* **`user_id`** (`UUID`, 外鍵參照 `users.id` 且級聯刪除)
* **`course_id`** (`UUID`, 外鍵參照 `courses.id` 且級聯刪除)
* **`purchased_at`** (`TIMESTAMP WITH TIME ZONE`, 預設為 `NOW()`)
* **主鍵**: `(user_id, course_id)` 雙欄位複合主鍵，代表學員擁有該課程觀看權限。

### `site_settings` (網站視覺設定資料表)
* **`key`** (`TEXT`, 主鍵): 設定識別鍵（預設為 `'homepage'`）。
* **`value`** (`JSONB`, 必填): 儲存視覺包裝物件（品牌色、Logo 網址、首頁廣告輪播、宣傳圖等）。
* **`updated_at`** (`TIMESTAMP WITH TIME ZONE`, 預設為 `NOW()`).

### `events` (線下/線上講座活動表)
* **`id`** (`UUID`, 主鍵, 預設為 `uuid_generate_v4()`)
* **`title`** (`TEXT`, Not Null): 活動標題。
* **`description`** (`TEXT`): 活動介紹大綱。
* **`image_url`** (`TEXT`): 活動主宣傳圖。
* **`price`** (`INTEGER`, 預設 0): 活動報名價格。
* **`price_display`** (`TEXT`): 前台顯示的票價格式（如: `免費活動` 或 `NT$ 1,980`）。
* **`date`** (`TIMESTAMP WITH TIME ZONE`, Not Null): 舉辦日期時間。
* **`location`** (`TEXT`): 線上網址或實體活動地點。
* **`attendees`** (`INTEGER`, 預設 0): 報名/累計參與人次。
* **`status`** (`TEXT`, 預設 `'upcoming'`): 狀態標籤（`'upcoming'` 活動預告 或 `'completed'` 精彩回顧）。
* **`type`** (`TEXT`, Not Null): 活動形式（如：線上實戰營、線下沙龍）。
* **`category`** (`TEXT`, Not Null): 活動主題分類（如：工作坊、線下聚會、線上讀書會）。
* **`registration_url`** (`TEXT`): 外部報名按鈕跳轉連結（如 Zoom 入口）。

### `articles` (專欄文章資料表)
* **`id`** (`UUID`, 主鍵, 預設為 `uuid_generate_v4()`)
* **`title`** (`TEXT`, Not Null): 文章標題。
* **`author`** (`TEXT`, 預設為 `'BDS 編輯部'`): 文章作者。
* **`date`** (`TIMESTAMP WITH TIME ZONE`, 預設為 `NOW()`): 文章發布日期。
* **`views`** (`INTEGER`, 預設 0): 累積閱讀次數。
* **`category`** (`TEXT`, Not Null): 文章主題分類（如：商務開發、職涯成長）。
* **`summary`** (`TEXT`): 文章簡短摘要說明（呈現在文章牆卡片中）。
* **`content`** (`TEXT`): 文章 Markdown 或 HTML 詳細內文。
* **`image_url`** (`TEXT`): 內頁封面大圖。
* **`status`** (`TEXT`, 預設 `'published'`): 文章狀態 (`'published'` 或 `'draft'`)。
* **`slug`** (`TEXT`, Unique): 自訂 URL 友好別名。
* **`tags`** (`TEXT`): 標籤分類。
* **`seo_title`** (`TEXT`): 自訂 SEO 標題。
* **`seo_description`** (`TEXT`): 自訂 SEO 描述。
* **`is_pinned`** (`BOOLEAN`, 預設 `FALSE`): 是否置頂。
* **`visibility`** (`TEXT`, 預設 `'public'`): 存取可見性權限限制，包括：
  * `'public'`: 公開，所有人皆可直接閱讀全篇。
  * `'members'`: 僅限登入會員，未登入者會被阻擋。
  * `'course_purchasers'`: 僅限指定課程學員閱讀，需擁有特定課程。
* **`required_course_ids`** (`TEXT`): 逗號分隔的課程 ID 字串，與學員已購權限進行比對。

### `downloads` (數位資源下載表)
* **`id`** (`UUID`, 主鍵, 預設為 `uuid_generate_v4()`)
* **`title`** (`TEXT`, Not Null): 數位產品名稱。
* **`price`** (`INTEGER`, 預設 0): 下載所需付費價格（0 為免費資源）。
* **`type`** (`TEXT`, Not Null): 檔案類型描述（如: `PDF 文件`、`PPT 簡報`、`Excel 試算表`、`ZIP 壓縮檔`、`MP4 影音`）。
* **`description`** (`TEXT`): 數位資源的價值與簡介。
* **`downloads_count`** (`INTEGER`, 預設 0): 累計下載次數。
* **`status`** (`TEXT`, 預設 `'published'`): 上架狀態 (`'published'` 或 `'draft'`)。
* **`file_url`** (`TEXT`): 後台雲端檔案下載直鏈（付款解鎖後方可開啟）。

---

## 4. 前台學員端頁面功能與驗證規格

### 4.1 首頁 (`/`)
* **頁面定位**：平台首頁與形象入口，展示課程資訊。
* **核心功能**：
  * **動態廣告看板 (Carousel)**：展示輪播廣告圖，點擊可引導至課程頁。
  * **課程展示牆 (Course Grid)**：動態撈取資料庫中 `is_published = true` 且 `is_hidden = false` 的課程，以卡片方式呈現標題、封面圖、價格與分類。
  * **動態品牌色渲染**：背景與按鈕會依據管理員於後台設定的品牌主色 (Primary Color) 進行動態色彩著色。
  * **導覽列 (`Navbar`)**：未登入時顯示「登入/註冊」；已登入時顯示「進入教室」與學員頭像，若身分為 `admin` 則顯示「管理後台」按鈕。
* **驗證重點**：
  * 資料庫中設定為 `is_hidden = true` 的課程，是否**絕對不會**出現在首頁大廳。
  * 品牌色彩在不同瀏覽器（尤其是深淺色模式下）的易讀性與對比度是否正常。

### 4.2 註冊與登入頁 (`/signup` & `/login`)
* **頁面定位**：使用者帳戶註冊與身分識別入口。
* **核心功能**：
  * **註冊 (`/signup`)**：
    * 必填欄位：姓名、Email、密碼（密碼需限制至少 6 位）。
    * 重複檢查：防呆機制，若 Email 已被註冊需提示「此 Email 已被註冊」。
    * 密碼安全：密碼在寫入 `users` 資料表前，必須經由 `bcryptjs` 進行 12 次 Salt 疊代雜湊加密。
  * **登入 (`/login`)**：
    * 支援 Credentials 帳密登入，登入成功後跳轉至原先請求的網址 (`callbackUrl`)。
* **驗證重點**：
  * 密碼長度小於 6 位或欄位未填時，是否有適當的 API 層與前端表單阻擋及提示。
  * 登入失敗時（如密碼錯誤或帳號不存在），是否會提供模糊但安全的提示（避免洩漏該 Email 是否已註冊的隱私）。

### 4.3 課程介紹頁 (`/courses/[id]`)
* **頁面定位**：單門課程的購買入口與章節大綱預覽。
* **核心功能**：
  * **課程詳情展示**：動態載入標題、大綱描述、價格與影片宣傳片。
  * **單堂結帳按鈕 (Buy Button)**：
    * 學員點擊「立即購買」時，觸發結帳 API (`/api/checkout`)，在資料庫建立一筆 `status = 'pending'` 且以 `BDS` 開頭的訂單。
    * API 回傳 PayUni 商戶號、AES-256-GCM 加密交易字串與 SHA256 簽章後，前端動態產生隱藏表單 POST 跳轉至 PayUni 測試收銀台（沙盒 URL 預設為 `https://sandbox-api.payuni.com.tw/api/upp`）。
* **驗證重點**：
  * 當已購買此課程的學員訪問該頁面時，結帳按鈕應自動轉變為「進入教室，開始學習」，並直接導向學習頁面。

### 4.4 學習播放頁 (`/courses/[id]/learn/[chapterId]`)
* **頁面定位**：核心影片學習與課堂問答區域。
* **核心功能**：
  * **存取攔截 (Permission Guard)**：
    * 非登入狀態強制重新導向至 `/login`。
    * 已登入學員必須在 `user_courses` 表中有該課程之關聯，方可觀看。
    * 管理員身分 (`role = 'admin'`) 則不受限，可直接跳過權限檢驗。
  * **影片播放模組 (`VideoPlayer`)**：
    * 支持 YouTube (自動轉為 `embed`)、Vimeo、Bunny.net Stream，以及 MP4/MOV/WebM 直鏈影片的 HTML5 原生播放器渲染。
  * **側邊欄章節導覽**：列出該課程的所有單元，點擊直接無縫切換單元網址。
  * **講義與附件下載**：播放器下方提供課程層級與章節單元層級的講義/附件下載按鈕。
  * **問答討論區 (LocalStorage 同步)**：
    * 允許學員即時提問，留言資料儲存於瀏覽器 `localStorage`（Key: `bds_course_comments`）。
    * 使用網頁 `storage` 事件監聽，當管理員在另一分頁審核通過或回覆時，學員播放頁面會自動、無重新整理更新留言內容。
    * 學員只能看到「已審核通過 (Approved)」的留言，以及「自己建立、審核中 (Pending)」的留言。
* **驗證重點**：
  * 嚴格測試**越權存取**：如果直接修改網址中的 `courseId` 與 `chapterId`，未購買學員是否會被 API 與伺服器路由阻擋在外。
  * 檢查 LocalStorage 留言中，是否有防止 Cross-Site Scripting (XSS) 的防範，避免使用者輸入惡意 HTML/JS 執行。

### 4.5 會員方案訂閱頁 (`/membership`)
* **頁面定位**：付費會員（月繳、年繳、終身）購買與權限開通。
* **核心功能**：
  * **方案介紹**：展示月繳、年繳與一次性終身方案的定價與特點。
  * **真實結帳跳轉**：呼叫金流發起接口，帶入 `type: 'membership'`，串接 PayUni Sandbox 跳轉支付。
  * **一鍵模擬支付 (Simulate Button)**：
    * 開發測試專用！學員點擊後直接呼叫 `/api/checkout/simulate`，跳過金流流程，後台直接在 `orders` 建立一筆付款成功的模擬訂單，並更新 users 表的訂閱期效（自動判斷月繳增加 30 天、年繳增加 365 天、一次性設為永久），開通後自動重新整理頁面。
* **驗證重點**：
  * 一鍵模擬支付的 API 必須只在開發測試環境下開放，或應加入防範在生產環境被學員呼叫的機制。
  * 會員期效到期時，學員是否會自動喪失訂閱專屬影片與文章的觀看權利。

### 4.6 活動專區 (`/events`)
* **頁面定位**：展示官方舉辦的實體講座、線上實戰工作坊或讀書會。
* **核心功能**：
  * **分頁籤切換**：「活動預告 (upcoming)」展示未來即將舉辦的活動；「精彩回顧 (completed)」展示歷史活動與花絮。
  * **動態搜尋與過濾**：提供輸入框搜尋標題與摘要，並可點擊分類按鈕（全部、工作坊、線下聚會、線上讀書會）進行即時篩選。
  * **報名跳轉機制**：點擊「立即報名」時，若有配置 `registration_url`，自動以另開新分頁方式導向外部 Zoom 或報名渠道；歷史活動則按鈕變更為「活動已結束」，不予跳轉。
* **驗證重點**：
  * 在資料庫中 status 標記為 `'completed'` 的活動是否會正確分流至精彩回顧分頁，且報名按鈕能正確進入 Disable 狀態。

### 4.7 專欄文章大廳與內頁 (`/articles` & `/articles/[id]`)
* **頁面定位**：內容行銷與知識庫文章，內置付費牆限制。
* **核心功能**：
  * **文章牆 (`/articles`)**：展示置頂文章、閱讀量、發布日期、摘要及封面圖，點擊進入詳細閱讀。
  * **文章解析器 (`/articles/[id]`)**：自製高效 Markdown 解析器，動態將字串轉化為具備標題結構與程式碼區塊的高級排版 HTML。
  * **核心付費牆控制機制 (Visibility Gate)**：
    * **公開 (`public`)**：任何人均可完整閱讀。
    * **登入會員專屬 (`members`)**：
      * 若學員未登入，屏蔽文章下半部分，顯示鎖頭標誌卡片「🔒 本篇文章僅限平台登入會員閱讀」，並提供登入與註冊之快速引導。
    * **指定課程學員專屬 (`course_purchasers`)**：
      * 學員登入後，系統會透過 API (`/api/user/courses`) 取回該學員已購的所有 `course_id` 陣列。
      * 讀取文章設定的 `required_course_ids`（逗號分隔），比對學員是否至少擁有一門指定課程。
      * 若比對失敗，屏蔽文章，顯示黃金鎖頭卡片「🔒 本篇文章為特約課程學員專屬」，列出可以解鎖該文章的指定課程卡片，並引導點擊前往購買該解鎖課程。
* **驗證重點**：
  * 安全漏洞防範：文章被屏蔽時，其 `content` (文章詳細內文) 數據**絕對不能**以任何形式渲染在 DOM 中（防止有心人使用 F12 審查元素直接繞過付費牆閱讀）。

### 4.8 數位資源下載專區 (`/downloads`)
* **頁面定位**：提供求職信、履歷模板、產業白皮書與手冊下載。
* **核心功能**：
  * **卡片展示**：展示數位講義與工具資源。卡片會依據 `type`（PDF、試算表 Excel、壓縮 ZIP、影音 MP4）自動匹配對應的圖標。
  * **選購與下載攔截彈窗 (DownloadsList)**：
    * 點擊卡片彈出詳情視窗。
    * **付費驗證**：若為付費資源 (`price > 0`) 且當前登入者非管理員，下載按鈕為「立即購買解鎖資源」，且點擊時會阻擋下載，彈出提示「🛒 此資源為付費專屬項目。請先完成購買或聯絡客服開通權限」。
    * **免費下載**：若為免費資源，點擊「免費下載資源」，系統會出現下載成功提示，並在 1.5 秒後另開新頁面打開 `file_url`。
    * **管理員特權**：若 session role 為 `'admin'`，彈窗上方會顯示紫色皇冠標章「👑 管理員最高特權已啟用」，點擊「管理員直接下載」可直接繞過任何限制取得檔案。若後台尚未配置 `file_url`，也會自動為管理員下載樣品測試 PDF。
* **驗證重點**：
  * 驗證一般學員無法直接以直接調用 file_url 的方式繞過前端下載按鈕檢查（防盜鏈與付費控制機制）。

---

## 5. 後台管理頁面與功能規格

### 5.1 後台首頁 (`/admin`)
* **頁面定位**：管理中心入口。
* **核心功能**：
  * 展示營收總額（僅統計 orders 狀態為 `'paid'` 的金額）。
  * 統計已註冊學員總數。
  * 側邊欄整合所有管理項目的跳轉導覽。
* **驗證重點**：
  * 非管理員身分 (`role !== 'admin'`) 若直接在瀏覽器輸入 `/admin`，必須被嚴格阻擋並重導向回登入頁或前台。

### 5.2 課程管理 (`/admin/courses`)
* **頁面定位**：上架新課程、新增單元章節。
* **核心功能**：
  * **課程 CRUD (CourseModal)**：可設定標題、封面圖、定價、講師姓名、是否發佈/隱藏、是否允許評論與評分、全課共用講義網址與 Trailer 影片。
  * **章節 CRUD & 排序**：可針對特定課程加入新章節單元、指派章節影片網址與本章講義，並調整單元排序權重 (`order_index`)。
* **驗證重點**：
  * 欄位內容格式防呆（例如價格不可為負數）。
  * 影片網址防呆，避免管理員輸入錯誤的 URL 導致播放器解析出錯。

### 5.3 留言審核 (`/admin/comments`)
* **頁面定位**：管理與審核學員在前台播放器提出的留言。
* **核心功能**：
  * 讀取並列出 `localStorage` 中所有提問留言。
  * **審核控制**：管理員點擊「通過審核」，將留言 status 改為 `'approved'`，學員前台即可同步看見。
  * **回覆功能**：管理員可針對該留言輸入回覆文字，寫入 `reply` 與 `replyDate`，並同步推播至 localStorage 中供前台學員檢視。

### 5.4 分潤與推薦獎勵 (`/admin/rewards`)
* **頁面定位**：設定推薦合作代碼與分潤數據。
* **核心功能**：
  * **固定 5% 分潤比例**：全站強制使用 5% 現金分潤。
  * **自訂推廣代碼輸入**：
    * 允許自訂代碼（例如輸入 `kaik`）。
    * **防呆機制**：輸入限制**僅限英文字母**（防中文字與亂碼）。採用輸入法防干擾機制（在 IME 拼音組字時不阻擋，按下確認鍵或焦點移開 `onBlur` 時自動篩除所有非英文字母並轉為小寫）。
  * **推廣網址產生與複製**：自動拼湊出 `${origin}/signup?ref=${customCode}`，並提供一鍵複製按鈕。
  * **推薦明細報表**：展示被推薦人姓名、購買課程、金額、以及系統自動依據「訂單金額 * 5%」計算出的佣金分潤。
* **驗證重點**：
  * 測試各種中文輸入法（如注音、拼音），確保組字過程中不會發生字元跳動或無法打字的問題，且游標離開後中文會被正確清除並轉為小寫英文。

### 5.5 網站視覺設定 (`/admin/settings` 或 `/admin/global-settings`)
* **頁面定位**：自訂網站 LOGO、品牌主色、首頁看板輪播圖。
* **核心功能**：
  * **視覺自訂**：可更新 Logo URL、Slogan 文字、輪播圖片陣列、兩格大看板。
  * **雙重寫入備份**：當管理員提交更新時，資料同時寫入 Supabase 的 `site_settings` 資料表，並同步覆寫本機的 `src/lib/site-settings.json` 檔案。
* **驗證重點**：
  * 如果資料庫暫時連不上，前台與後台是否能正常 Fallback 讀取 `site-settings.json` 檔案作為備份設定值。

---

## 6. 金流與信件後端 Callback API 規格

### 6.1 PayUni 付款通知回傳端點 (`/api/checkout/callback`)
* **觸發機制**：PayUni 伺服器在交易成功或失敗時發送的 HTTP POST 通知。
* **安全性與校驗步驟**：
  1. 接收 `EncryptInfo` 與 `HashInfo`。
  2. 計算驗證雜湊值：`SHA256(HashKey + EncryptInfo + HashIV)`，與 `HashInfo` 進行比對。不符者直接回傳 `Response("ERROR")`。
  3. 解密 `EncryptInfo`，讀取 `MerTradeNo`（訂單編號）與 `Status`（支付結果）。
  4. 當 `Status === 'SUCCESS'`：
     * 將訂單狀態更新為 `paid`。
     * 寫入 `user_courses`（課程開通）或更新 `users` 表的過期日（會員訂閱開通）。
     * 發送交易成功電子郵件至學員信箱。
     * 回傳 `Response("SUCCESS")` 給 PayUni 伺服器以確認收訖。
* **驗證重點**：
  * **防止重送攻擊 (Replay Attack) 與金額篡改**：Callback 時必須驗證金額是否與資料庫 `orders` 中預存的金額完全一致，防範有心人士在金流端篡改 TradeAmt。

### 6.2 Resend 電子郵件系統 (`src/lib/email.ts`)
* **發信技術**：不載入大型套件，直接使用 `fetch` 對 `https://api.resend.com/emails` 發送 REST API 請求。
* **沙盒模式安全機制**：
  * 在開發測試期使用 Resend 預設的 `onboarding@resend.dev` 信箱發信時，受限於 Resend 沙盒，無法寄送給其他外部 Email。
  * **沙盒重導向防呆**：當偵測到寄件者為 `onboarding@resend.dev` 且設有 `RESEND_TEST_RECIPIENT` 時，系統會強制將收件人改為開發者的測試信箱，防止因發信至非驗證信箱而導致 API 報錯。
* **驗證重點**：
  * 檢查當沒填寫 `RESEND_API_KEY` 時，系統是否有適當的 console.warn 日誌印出信件明細，而不是丟出未捕獲的例外導致 API 崩潰。

---

## 7. 環境變數設定參考

在 `.env.local` 檔案中需要配置以下環境變數以開通完整功能：

```bash
# NextAuth 網站運作網址與加密私鑰
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=您的隨機密鑰字串 (建議使用 openssl rand -base64 32 產生)

# Supabase 資料庫連線字串與前端 ANON 金鑰
DATABASE_URL=postgresql://postgres:[密碼]@[主機位址]:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://您的專案ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...

# PayUni 統一金流測試金鑰（預設為沙盒環境）
PAYUNI_MERID=MS12345678                    # PayUni 商戶號
PAYUNI_HASH_KEY=your_payuni_hash_key      # PayUni HashKey
PAYUNI_HASH_IV=your_payuni_hash_iv        # PayUni HashIV

# Resend 發信設定
RESEND_API_KEY=re_your_api_key             # Resend API 金鑰
RESEND_FROM_EMAIL=no-reply@yourdomain.com  # 發信者信箱
RESEND_TEST_RECIPIENT=test@gmail.com       # 沙盒模式測試重導向信箱
```

---

## 8. 生產環境上線檢查清單

1. **切換金流為正式環境**：
   * 將商戶金鑰 `PAYUNI_MERID`、`PAYUNI_HASH_KEY`、`PAYUNI_HASH_IV` 更換為 PayUni 正式環境商戶資料。
   * 將 `src/components/BuyButton.tsx` 與 `src/components/MembershipList.tsx` 中的 Hidden 表單 POST 位址由沙盒網址更換為正式金流收銀台網址：
     `https://api.payuni.com.tw/api/upp`
2. **驗證 Resend 自訂發信網域**：
   * 登入 Resend 設定頁面，將網域（如 `bydoingso.com`）的 DNS 設定（SPF, DKIM, DMARC）綁定完成。
   * 修改信件設定中的 `RESEND_FROM_EMAIL`（例如改為 `no-reply@bydoingso.com`），並清空 `RESEND_TEST_RECIPIENT`，以確保購買通知信會發送給真實的購課學員。
3. **連線池設定**：
   * 在生產環境中（例如 Vercel），由於伺服器為 Serverless 運作，容易產生瞬時大量資料庫連線。建議將 `DATABASE_URL` 連線埠改為 Supabase 的 Connection Pooler 連線埠（通常為 `6543` 埠），以避免資料庫因連線數過載而拒絕連線。

---

## 9. 給 Claude CLI 的 Code Review 與驗證任務指引

請 `claude-cli` 依據此規格書，對本專案進行以下審查與驗證：

1. **API 身分驗證漏洞審查**：
   * 檢查 `src/app/api/admin/**/*` 的所有 API 路由，確認是否均有使用 `getServerSession` 驗證權限，並嚴格阻擋非 `admin` 身分。
2. **金流邏輯安全校驗**：
   * 審查 `src/app/api/checkout/callback/route.ts` 內的解密與金鑰比對過程，確認是否有對 `amount` (訂單金額) 與資料庫原紀錄進行一致性比對。
3. **文章付費牆 DOM 洩漏校驗**：
   * 審查 `src/app/articles/[id]/page.tsx`，確認當學員未購買課程或非會員時，`content` 欄位的文章內文**絕對不會**被輸出或隱藏在 DOM 結構中。
4. **輸入框與 IME 行為校驗**：
   * 審查 `src/app/admin/rewards/page.tsx` 中 `customCode` 的 input 輸入框事件處理，確認 `onChange`、`onCompositionStart`、`onCompositionEnd`、`onBlur` 的組合邏輯是否完全消除了中文輸入法打字時的干擾，且能確實達成「僅限英文」的防呆。
5. **錯誤處理 (Error Handling) 校驗**：
   * 檢查資料庫查詢是否有 `try...catch` 保護，特別是當 Supabase 資料表未完全遷移或遺漏部分欄位時，API 是否能優雅降級 (Fallback) 或顯示友善錯誤。
