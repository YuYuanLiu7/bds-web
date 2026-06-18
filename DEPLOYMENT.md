# BDS 線上課程平台 — 安裝與部署指南

本指南帶你從零把這個平台架設起來並上線。全程約 30–60 分鐘。

## 技術架構
- **前端 / 後端**：Next.js 16（App Router）+ React 19 + TypeScript
- **樣式**：Tailwind CSS v4
- **資料庫**：Supabase（PostgreSQL）
- **金流**：PayUni（統一金流）
- **Email**：Resend
- **身分驗證**：NextAuth（帳號密碼）

---

## 1. 前置需求
- Node.js 20 以上
- 一個 [Supabase](https://supabase.com) 專案（免費方案即可）
- [PayUni](https://www.payuni.com.tw) 商店帳號（測試可用 Sandbox）
- [Resend](https://resend.com) 帳號（寄信，免費方案每月 3,000 封）
- 部署平台：建議 [Vercel](https://vercel.com)

---

## 2. 設定 Supabase 資料庫
1. 建立 Supabase 專案，記下專案 URL 與 API 金鑰（Project Settings → API）：
   - `anon` public 金鑰
   - `service_role` secret 金鑰
2. 開啟 **SQL Editor**，依序貼上執行下列 SQL（皆冪等、可重複執行）：
   - `db/init.sql`：建立所有資料表與初始示範資料（使用者、課程、章節、訂單、文章、活動、下載、會員方案、評價、留言、設定…）
   - `db/add_performance_indexes.sql`：效能索引（規模化重要）
   - `db/add_rate_limiting.sql`：速率限制表與函式（登入/註冊/表單防濫用）
3. **建立檔案儲存空間（Storage）**：後台上傳圖片需要。系統會在第一次上傳時自動建立名為 `uploads` 的公開 bucket；若想手動建立，到 Supabase **Storage → New bucket**，命名 `uploads` 並勾選 **Public**。
   > 在 Netlify/Vercel 這類無狀態平台，上傳一定要走 Supabase Storage（不能存主機本機）。
4. **啟用 Row Level Security（RLS）以保護資料**：本平台所有資料存取都在伺服器端、以 `service_role` 金鑰進行，因此可（且建議）對所有資料表開啟 RLS，阻擋任何人用 public 金鑰直接連線存取。
   > 注意：開啟 RLS 後務必設定下方的 `SUPABASE_SERVICE_ROLE_KEY`，否則伺服器將讀不到資料。

---

## 3. 設定環境變數
1. 複製 `.env.example` 為 `.env.local`。
2. 依 `.env.example` 內的說明填入 Supabase、PayUni、Resend、NextAuth 等值。
3. 重點：
   - `SUPABASE_SERVICE_ROLE_KEY`：填 Supabase 的 service_role 金鑰，**只放伺服器、勿外洩**。
   - `NEXTAUTH_URL`：本機開發填 `http://localhost:3000`；上線填正式網域。
   - `NEXTAUTH_SECRET`：用 `openssl rand -base64 32` 產生。
   - PayUni 測試階段 `NEXT_PUBLIC_PAYUNI_UPP_URL` 用 sandbox 端點；正式上線改為正式端點並換上正式金鑰。

---

## 4. 本機啟動
```bash
npm install
npm run dev
```
開啟 http://localhost:3000

建置驗證：
```bash
npm run build      # 確認可正常編譯
npx tsc --noEmit   # 型別檢查
```

---

## 5. 建立管理員帳號
1. 到前台 `/signup` 註冊一個帳號（密碼會以 bcrypt 雜湊儲存）。
2. 在 Supabase SQL Editor 執行，把該帳號升為管理員：
   ```sql
   UPDATE users SET role = 'admin' WHERE email = '你的管理員信箱';
   ```
3. 重新登入後即可進入 `/admin` 後台。

---

## 6. 部署（擇一平台）

本專案是標準 Next.js，可部署到多種平台。常見三種：

### 6A. Netlify（免費版即可商業使用，適合中小規模、最省錢）
1. 將專案推到 GitHub，於 Netlify **Add new site → Import from GitHub** 選此 repo。
2. Build 設定一般會自動偵測（Next.js）；若需手動：Build command `npm run build`、發佈交由官方 Next.js Runtime 處理。
3. **Site configuration → Environment variables** 填入與 `.env.local` 相同的所有變數（`NEXTAUTH_URL` 改為你的正式網域）。
4. Deploy。
   > 注意：Netlify 為無狀態平台，上傳檔案必須走 Supabase Storage（本專案已內建）。
   > 提醒：本專案使用較新的 Next.js 版本，第一次部署請先以測試資料完整點過（首頁/登入/後台/結帳），確認 Netlify 的 Next.js Runtime 相容無誤，再正式導入會員。

### 6B. Vercel（Next.js 原廠、相容性最佳；商業營運需 Pro 方案）
1. 將專案推到 GitHub，於 Vercel 匯入該 repo。
2. **Settings → Environment Variables** 填入與 `.env.local` 相同的所有變數（`NEXTAUTH_URL` 改為正式網域）。
3. Deploy。
   > 注意：Vercel 免費（Hobby）方案**禁止商業用途**，販售課程請使用 Pro 方案。

### 6C. VPS / 自架 Node 主機（最省、無相容性顧慮，但需自行維運）
1. 在主機 `git clone`、`npm install`、`npm run build`。
2. 設定環境變數，以 `npm run start`（預設埠 3000）啟動，建議用 `pm2` 常駐並以 Nginx 反向代理 + HTTPS。
   > 直接跑原生 `next start`，與本機行為一致、無轉換器相容問題；上傳也可走 Supabase Storage 或本機磁碟。

**所有平台共通**：部署完成後到 PayUni 後台把 NotifyURL / ReturnURL 指向你的正式網域
（`https://你的網域/api/checkout/callback`）。

---

## 7. 影片防盜（Bunny.net Token）
1. 影片上傳到 Bunny **Stream Library**，到該影片庫 **Security** 開啟「Embed View Token Authentication」。
2. `.env`／部署平台填入 `BUNNY_STREAM_LIBRARY_ID` 與 `BUNNY_TOKEN_AUTH_KEY`（皆勿加 NEXT_PUBLIC_）。
3. 後台課程章節的「影片網址」填 Bunny 影片的 embed 網址或影片 GUID 即可；系統會在學員（已驗證購課權限）開啟單元時，於伺服器端簽發 6 小時短效 Token 播放網址。
   > 上線前請以一支測試影片確認可正常播放；若 Bunny 端驗章失敗，請依 `src/lib/bunny.ts` 註解調整 token 串接順序。

## 8. 自動化排程（GitHub Actions，已內建於 `.github/workflows/`）
推到 GitHub 後，於 repo **Settings → Secrets and variables → Actions** 設定以下 secrets 即會自動生效：
- **每日備份到 Google Drive**（`db-backup.yml`）：`SUPABASE_DB_URL`（Supabase 直連字串）、`RCLONE_CONFIG_BASE64`（本機 `rclone config` 設好 Google Drive remote 後的設定檔 base64）、`RCLONE_REMOTE`（remote 名稱）。即使未設 rclone，也會保留一份 GitHub artifact 備份。
- **Supabase 保活**（`keep-alive.yml`）：`SUPABASE_URL`、`SUPABASE_ANON_KEY`。每 3 天查詢一次防止免費版休眠。

---

## 9. 上線前檢查清單
- [ ] Supabase 已執行 `db/init.sql`、`db/add_performance_indexes.sql`、`db/add_rate_limiting.sql` 且已開啟 RLS
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已設定（伺服器端讀寫正常）
- [ ] Supabase Storage 有 `uploads`（Public）bucket，後台上傳圖片正常
- [ ] 已建立管理員帳號並能登入 `/admin`
- [ ] PayUni 已換成正式商店金鑰與正式 UPP 端點，`ENABLE_PAYMENT_SIMULATION` 未設為 true，NotifyURL 指向 `/api/webhook/payuni`
- [ ] Bunny 影片庫已開啟 Token Authentication，`BUNNY_STREAM_LIBRARY_ID` / `BUNNY_TOKEN_AUTH_KEY` 已設定，測試影片可播放
- [ ] GitHub Actions 每日備份與保活的 secrets 已設定且首次執行成功
- [ ] Resend 寄件網域已驗證，`RESEND_FROM_EMAIL` 使用該網域
- [ ] 後台「設定」中的網站名稱、Logo、主色、聯絡信箱、FAQ、公告皆已更新為你的品牌
- [ ] 已新增實際課程 / 文章 / 活動 / 下載商品，移除不需要的示範資料

---

## 10. 後台功能總覽（`/admin`）
- **儀表板**：課程數、學員數、營收即時統計
- **課程 / 章節**：建立課程、上傳影片與教材、管理章節
- **文章**：部落格／專欄（支援會員或購課限定的付費牆）
- **活動 / 數位下載 / 會員方案**：上架與管理
- **成員**：學員管理、手動授權課程與會員
- **財務**：訂單與營收查詢、CSV 匯出
- **留言**：審核與回覆學員在課程章節下的提問
- **頁面管理**：編輯關於我們 / 聯絡我們 / 服務條款等頁面內容
- **設定**：網站基本資訊、視覺（Logo/主色）、FAQ、公告、寄信通知範本

---

如需技術細節，請參閱專案根目錄的 `CLAUDE.md` 與 `db/init.sql`。
