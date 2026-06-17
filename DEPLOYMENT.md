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
2. 開啟 **SQL Editor**，把專案內 `db/init.sql` 整份貼上執行。它會：
   - 建立所有資料表（使用者、課程、章節、訂單、文章、活動、下載、會員方案、評價、留言、設定…）
   - 建立初始示範資料（會員方案、活動、文章等，可日後在後台調整或刪除）
3. **啟用 Row Level Security（RLS）以保護資料**：本平台所有資料存取都在伺服器端、以 `service_role` 金鑰進行，因此可（且建議）對所有資料表開啟 RLS，阻擋任何人用 public 金鑰直接連線存取。
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

## 6. 部署到 Vercel
1. 將專案推到 GitHub，於 Vercel 匯入該 repo。
2. 在 Vercel 專案 **Settings → Environment Variables** 填入與 `.env.local` 相同的所有變數
   （`NEXTAUTH_URL` 改為你的 Vercel/正式網域）。
3. Deploy。完成後到 PayUni 後台把 NotifyURL / ReturnURL 指向你的正式網域
   （`https://你的網域/api/checkout/callback`）。

---

## 7. 上線前檢查清單
- [ ] Supabase 已執行 `db/init.sql` 且已開啟 RLS
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已設定（伺服器端讀寫正常）
- [ ] 已建立管理員帳號並能登入 `/admin`
- [ ] PayUni 已換成正式商店金鑰與正式 UPP 端點，`ENABLE_PAYMENT_SIMULATION` 未設為 true
- [ ] Resend 寄件網域已驗證，`RESEND_FROM_EMAIL` 使用該網域
- [ ] 後台「設定」中的網站名稱、Logo、主色、聯絡信箱、FAQ、公告皆已更新為你的品牌
- [ ] 已新增實際課程 / 文章 / 活動 / 下載商品，移除不需要的示範資料

---

## 8. 後台功能總覽（`/admin`）
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
