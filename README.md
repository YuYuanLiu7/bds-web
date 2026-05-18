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

### 3. 資料庫初始化
請將 `db/schema.sql` 中的內容複製到您的 PostgreSQL 資料庫（如 Supabase SQL Editor）中執行。

### 4. 啟動開發伺服器
```bash
npm run dev
```

## 遷移步驟 (Migration Guide)
1. **影片遷移**: 將原 Teachify 上的影片下載並上傳至 YouTube (設為不公開) 或 Vimeo，並取得嵌入碼。
2. **課程資料**: 將課程標題、描述、價格等填入資料庫的 `courses` 表格中。
3. **金流切換**: 當測試無誤後，請將 `.env.local` 中的 PayUni 資訊更換為正式帳號的 MerID, HashKey 與 HashIV，並將 `src/components/BuyButton.tsx` 中的 URL 改為正式環境。

## 維運成本預估
- **主機 (Vercel)**: 0 元 (個人方案免費額度充足)
- **資料庫 (Supabase)**: 0 元 (免費額度充足)
- **網域**: 約 500-800 元 / 年
- **總計**: < 1,000 元 / 年 (對比原先 50,000 元 / 年)

---
由 Gemini CLI 協助開發。
