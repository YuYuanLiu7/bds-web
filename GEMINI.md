# BDS 網站重構專案記憶 (Project Memory)

## 專案目標
- 將網站從 Teachify 遷移至自建 Next.js 平台。
- 核心目標：大幅降低維運成本（每年省下 50,000 元）。
- 營運模式：權限全交由 AI 主動推動模式。

## 技術架構 (Current Stack)
- **框架**: Next.js 15 (App Router) + TypeScript.
- **金流系統**: **PayUni (唯一指定)**。
  - 已移除 ECPay。
  - 核心邏輯位於 `src/lib/payuni.ts`。
  - 結帳 API: `src/app/api/checkout/route.ts`。
  - 回傳接收 API: `src/app/api/checkout/callback/route.ts`。
- **資料庫**: PostgreSQL / Supabase (Schema 位於 `db/schema.sql`)。
- **部署平台**: Vercel。

## 目前進度
- [x] 專案初始化與 UI 基礎架構。
- [x] 課程列表、課程詳情頁面開發。
- [x] PayUni 金流加密、簽章與回傳邏輯完整實作。
- [x] 修正 PayUni TypeScript 型別錯誤，確保 Production Build 通過。
- [x] 建立 `.env.example` 供設定參考。
- [x] 實作 Supabase 資料庫串接，將課程列表與詳情轉為動態抓取。
- [x] 實作結帳流程中的訂單紀錄與權限開通邏輯。
- [x] 實作課程學習頁面 (Player)，支援影片嵌入與權限檢查。

## 下一步待辦 (Next Steps)
1. **正式環境設定**: 需要使用者在 `.env.local` 填入真實的 PayUni 密鑰與 Supabase DATABASE_URL/SUPABASE_URL。
2. **後台管理介面**: 實作簡單的課程與章節管理功能 (Admin only)。
3. **使用者 Profile**: 實作「我的課程」頁面，方便學員快速找回已購買課程。

## 使用者偏好與特殊規範
- 使用者要求「權限全給你」模式，AI 應主動發現問題並修復。
- 嚴格僅保留 PayUni 金流，不使用其他平台。
- 追求極簡、效能與最低維運成本。
