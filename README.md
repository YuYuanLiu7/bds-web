# BDS (By Doing So) 網站重構專案

本專案旨在協助從 Teachify 平台遷移至完全客製化的 Next.js 平台，以大幅降低維運成本（預計每年可節省約 50,000 元台幣）。

## 技術棧 (Tech Stack)
- **前端/API**: Next.js 15 (App Router)
- **樣式**: Tailwind CSS
- **身份驗證**: NextAuth.js
- **資料庫**: PostgreSQL (建議搭配 Supabase)
- **金流**: 統一金流 (PayUni)
- **部署**: Vercel

## 快速開始 (Quick Start)

### 1. 安裝依賴
```bash
npm install
```

### 2. 環境變數設定
請在根目錄建立 `.env.local` 並填入以下資訊：
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=您的隨機密鑰

# Supabase (資料庫串接)
DATABASE_URL=您的資料庫連結

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
npm run setup -- --migrate    # 另用 SUPABASE_DB_URL 自動跑完所有 SQL 遷移（含 RLS）
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
- [`DEPLOYMENT.md`](./DEPLOYMENT.md)、[`SETUP-GUIDE.md`](./SETUP-GUIDE.md) — 部署與新手設定

## 遷移步驟 (Migration Guide)
1. **影片遷移**: 將影片上傳至 **Bunny.net Stream Library**，開啟 Embed Token 驗證，於後台課程章節填入影片網址或 GUID（影片以限時簽章網址保護，防盜看）。
2. **課程資料**: 於後台「課程」管理新增課程與章節（標題、描述、價格、分類、封面）。
3. **金流切換**: 測試無誤後，將 `.env.local` 的 PayUni 改為正式 MerID / HashKey / HashIV，並把 `NEXT_PUBLIC_PAYUNI_UPP_URL` 設為正式端點 `https://api.payuni.com.tw/api/upp`（端點由環境變數決定，**無需改程式碼**）。

## 維運成本預估
- **主機 (Vercel)**: 0 元 (個人方案免費額度充足)
- **資料庫 (Supabase)**: 0 元 (免費額度充足)
- **網域**: 約 500-800 元 / 年
- **總計**: < 1,000 元 / 年 (對比原先 50,000 元 / 年)

---
由 Gemini CLI 協助開發。
