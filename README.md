# BDS (By Doing So) 網站重構專案

本專案旨在協助從 Teachify 平台遷移至完全客製化的 Next.js 平台，以大幅降低維運成本（預計每年可節省約 50,000 元台幣）。

## 技術棧 (Tech Stack)
- **前端/API**: Next.js 16 (App Router) + React 19
- **語言**: TypeScript
- **樣式**: Tailwind CSS v4
- **身份驗證**: NextAuth.js（Credentials，JWT 帶 role/id）
- **資料庫**: PostgreSQL（Supabase，啟用 RLS）
- **金流**: 統一金流 (PayUni)
- **影片**: Bunny.net Stream（限時簽章防盜看）
- **寄信**: Resend
- **部署**: Netlify（免費方案，允許商用）

## 快速開始 (Quick Start)

> ⚠️ **此快速開始僅供工程師在本機開發預覽**（`localhost`，關掉就沒了）。
> 要**實際部署上線、能收錢營運**（含 Netlify 部署、Bunny 影片、PayUni 金流、Resend 寄信、
> 綁網域、每日備份），請改看 [`SETUP-GUIDE.md`](./SETUP-GUIDE.md) 的完整 10 步驟。

### 1. 安裝依賴
```bash
npm install
```

### 2. 環境變數設定
請在根目錄建立 `.env.local` 並填入以下資訊：
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=您的隨機密鑰

# Supabase (資料庫串接；伺服器端以 service_role 金鑰存取)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=您的 service_role 金鑰（勿加 NEXT_PUBLIC_ 前綴、勿外洩）

# PayUni (統一金流 - 預設為測試環境)
PAYUNI_MERID=MS12345678
PAYUNI_HASH_KEY=YOUR_PAYUNI_HASH_KEY
PAYUNI_HASH_IV=YOUR_PAYUNI_HASH_IV
```

> 完整環境變數清單以 [`.env.example`](./.env.example) 為準（Supabase / PayUni / Resend / Bunny / NextAuth）。

### 3. 一鍵初始化（建議）
填好 `.env.local` 後，於根目錄執行：
```bash
npm run setup                 # 驗證環境變數、檢查資料表、建立 uploads bucket
npm run setup -- --migrate    # 另用 SUPABASE_DB_URL 自動執行 SQL 建置所有資料表（含 RLS）
```
或手動於 Supabase SQL Editor 依序貼上 `db/*.sql`（最後跑 `db/enable_rls.sql`）。

### 4. 啟動開發伺服器
```bash
npm run dev
```

## 📚 文件總覽
- [`PRODUCT-INTRO.md`](./PRODUCT-INTRO.md) — 對客戶的技術與安全介紹
- [`SALES-ONEPAGER.md`](./SALES-ONEPAGER.md) — 一頁賣點摘要（報價／簡報用）
- [`LAUNCH-CHECKLIST.md`](./LAUNCH-CHECKLIST.md) — 賣方上線前最終檢查單
- [`CUSTOMER-ACCEPTANCE.md`](./CUSTOMER-ACCEPTANCE.md) — 客戶 30 分鐘驗收清單
- [`GO-LIVE-TEST.md`](./GO-LIVE-TEST.md) — 逐項上線測試（含金流真卡）
- [`SETUP-GUIDE.md`](./SETUP-GUIDE.md) — 從零到上線設定（含 Supabase / Bunny / PayUni / Netlify）

## 遷移步驟 (Migration Guide)
1. **影片遷移**: 將影片上傳至 **Bunny.net Stream Library**，開啟 Embed Token 驗證，於後台課程章節填入影片網址或 GUID（影片以限時簽章網址保護，防盜看）。
2. **課程資料**: 於後台「課程」管理新增課程與章節（標題、描述、價格、分類、封面）。
3. **金流切換**: 測試無誤後，將 `.env.local` 的 PayUni 改為正式 MerID / HashKey / HashIV，並把 `NEXT_PUBLIC_PAYUNI_UPP_URL` 設為正式端點 `https://api.payuni.com.tw/api/upp`（端點由環境變數決定，**無需改程式碼**）。

## 維運成本預估（數百～數千會員規模）
- **主機 (Netlify)**: 0 元（免費方案，允許商用）
- **資料庫 (Supabase)**: 0 元（免費額度充足）
- **寄信 (Resend) / 影片 (Bunny.net)**: 0 元（免費額度內）
- **網域**: 約 500-800 元 / 年
- **總計**: < 1,000 元 / 年（對比原先約 50,000 元 / 年）
