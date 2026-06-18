# BDS 最簡上線路徑（給完全不懂技術的人）

只做「必做」這幾步就能上線開賣。標 ⏳「進階（可稍後）」的可以之後再弄，不影響先上線。
卡住的話，這幾步請朋友/工程師幫一次（約 20 分鐘），之後新增課程你自己來就行。

> 🖼️ = 建議在此放一張截圖（畫面說明已寫在括號裡，方便你對照與補圖）。

---

## ✅ 必做 1：開帳號
GitHub、Supabase、Netlify、Resend、PayUni（要商家審核）。影片若要用，再開 Bunny.net。

## ✅ 必做 2：建資料庫（Supabase）
1. Supabase → **New project**，設定並**記住資料庫密碼**。
   🖼️（建立專案的畫面：填 Name、Database Password、Region）
2. 左側 **SQL Editor → New query**，把 `db/` 內這 4 個檔案**依序**整份貼上各按 Run：
   `init.sql` → `add_performance_indexes.sql` → `add_rate_limiting.sql` → `enable_rls.sql`
   🖼️（SQL Editor 畫面：貼上後右下角 **Run** 按鈕）
3. 左側齒輪 **Project Settings → API**，複製：**Project URL**、**anon public**、**service_role**。
   🖼️（API 設定頁：三個值的位置；service_role 需按眼睛圖示顯示）
4. 左側 **Storage → New bucket** → 名稱 `uploads`、勾 **Public** → 建立。
   🖼️（New bucket 視窗：名稱欄與 Public 勾選）

## ✅ 必做 3：部署網站（Netlify）
1. Netlify → **Add new site → Import from GitHub** → 選你的 repo。
   🖼️（Import 畫面：選擇 repository 清單）
2. **Site configuration → Environment variables**，照 `.env.example` 把值貼進去（至少：`NEXTAUTH_URL`、`NEXTAUTH_SECRET`、三個 Supabase 值、PayUni 四個值、Resend、Bunny）。
   - `NEXTAUTH_SECRET` 產生：終端機跑 `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`，或上 https://generate-secret.vercel.app/32 複製。
   🖼️（Environment variables 頁：Add a variable 的 Key/Value 欄位）
3. 按 **Deploy**，等幾分鐘 → 得到網址。

## ✅ 必做 4：開通你的管理員
1. 開網站 `/signup` 註冊一個帳號。
2. Supabase **SQL Editor** 執行（換成你的信箱）：
   `UPDATE users SET role = 'admin' WHERE email = '你的信箱';`
3. 重新登入 → 進 `/admin`。🎉 到這裡網站已能用、能賣。

## ✅ 必做 5：金流與影片（要收費/放影片才需要）
- **PayUni**：把測試金鑰填進 Netlify 環境變數；PayUni 後台 Notify/Return URL 設 `https://你的網域/api/webhook/payuni`。
- **Bunny**：影片上傳到 Stream Library、開 Embed Token Authentication、把 Library ID 與 Token Key 填進環境變數。

## ✅ 必做 6：每日備份（只需設 1 個東西！）
1. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**。
   🖼️（Secrets 頁：New repository secret 按鈕）
2. 新增 `SUPABASE_DB_URL`＝Supabase 的資料庫連線字串
   （Supabase **Project Settings → Database → Connection string → URI**，把 `[YOUR-PASSWORD]` 換成你的資料庫密碼）。
3. 完成！系統每天自動把資料庫備份成檔案存在 GitHub（**Actions → Artifacts**，保留 90 天）。可到 **Actions → 每日資料庫備份 → Run workflow** 立刻測一次。

---

## ⏳ 進階（可稍後，不急）
- **把備份額外存到 Google Drive**：見 `SETUP-GUIDE.md` 步驟 8（需設定 rclone）。在你弄好之前，上面必做 6 的 GitHub 備份已每天保護你的資料。
- **Supabase 保活**（防免費版休眠）：見 `SETUP-GUIDE.md` 步驟 9。有日常流量其實就不會休眠。
- **綁自己的網域** `bds.fu-notes.com`：Netlify Domain settings 綁定，並把 `NEXTAUTH_URL` 改成它。

---

## 上線前 & 日常
- 上線前照 `GO-LIVE-TEST.md` 逐項打勾（含用 PayUni 測試卡刷一筆、放一支測試影片確認能播）。
- 日常只用 `/admin` 後台：新增課程、文章、活動、看訂單、回留言。全是點選，免技術。

> 需要完整逐步（含每個技術細節）→ 看 `SETUP-GUIDE.md`；技術摘要 → 看 `DEPLOYMENT.md`。
