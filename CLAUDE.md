# CLAUDE.md - BDS 網站專案開發與工作流指南

此檔案提供給 **Claude CLI (Claude Code)** 及開發者，說明本專案的建置、排錯、測試指令，以及程式碼規範與開發工作流。

---

## 1. 核心命令 (Core Commands)

### 開發與建置 (Development & Build)
* 啟動開發伺服器：`npm run dev`
* 專案完整建置 (Production Build)：`npm run build`
* 啟動 Production 伺服器：`npm run start`

### 程式碼檢查與修復 (Linting & Code Quality)
* 執行 ESLint 檢查：`npm run lint`
* 執行 ESLint 並自動修復：`npx eslint . --fix`
* 執行 TypeScript 型別檢查：`npx tsc --noEmit`

### 測試 (Testing)
* *本專案目前未配置單元測試框架，若需進行測試，請以建置 (`npm run build`) 與 ESLint 檢查 (`npm run lint`) 作為基本驗證手段。*

---

## 2. 專案技術架構 (Technology Stack)

* **框架**：Next.js 16 (App Router) + TypeScript + React 19。
* **樣式**：Tailwind CSS v4 (配合 `@tailwindcss/postcss`)。
* **資料庫**：PostgreSQL / Supabase (資料表 Schema 定義於 `db/schema.sql`)。
* **金流系統**：**PayUni (唯一指定金流，已移除 ECPay)**。
  * 核心加密與簽章邏輯：`src/lib/payuni.ts`
  * 建立訂單與結帳 API：`src/app/api/checkout/route.ts`
  * 金流回傳接收 API：`src/app/api/checkout/callback/route.ts`

---

## 3. 開發規範與原則 (Development Guidelines)

### 語系與程式碼註解
* 專案內所有使用者介面 (UI)、錯誤訊息、Git Commit 訊息以及**程式碼註解**，皆必須使用 **繁體中文 (Traditional Chinese)**。

### Next.js 與 React 規範
* **RSC 優先**：預設使用 React Server Components (RSC)。只有在需要使用 React hooks (如 `useState`, `useEffect`) 或瀏覽器事件監聽時，才在檔案頂部宣告 `"use client"`。
* **API 路由**：API 必須放置於 `src/app/api/` 目錄下，使用 `route.ts`，並正確處理 Request/Response 的型別。
* **SEO 規範**：每個頁面應有適當的 `Metadata` 定義（包括 title 與 description），使用 HTML5 語意化標籤。

### TypeScript 規範
* **型別安全**：嚴禁濫用 `any`。所有 API 回傳值、資料庫 Query、元件 Props 都必須宣告明確的 TypeScript interface 或 type。
* **建置檢查**：在提交任何程式碼或推播前，必須執行 `npm run build`，確保無任何 TypeScript 或 ESLint 錯誤。

### Git 工作流與雙向推播
* 本專案已設定 Git 別名 `git push2`，用來同時推播至團隊倉庫 (`origin`) 與個人備份倉庫 (`personal`)。
* **在完成功能開發、修復或更新後，請務必執行 `git push2` 進行雙向推播。**

---

## 4. 驗證與 Code Review 工作流 (Verification Workflow)

當 Claude CLI 協助進行 Code Review 或功能變更時，請遵循以下步驟：
1. **變更分析**：詳細閱讀 [CODEBASE_SPEC.md](file:///Users/yuyuanliu/Desktop/BSD/WEB/CODEBASE_SPEC.md) 以了解前後台之業務邏輯。
2. **靜態檢查**：執行 `npm run lint` 及 `npx tsc --noEmit`，確認無語法與型別錯誤。
3. **編譯測試**：執行 `npm run build` 確認專案在 Production 環境下可正常編譯。
4. **雙向推送**：確認無誤後，使用 `git push2` 將變更推播至所有遠端倉庫。
