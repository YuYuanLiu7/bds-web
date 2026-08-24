# BDS 線上課程系統｜新手從零到上線（照順序做）

這份是給「第一次架設」的人。**照著一步步做即可**。
標 🛠️ 的步驟需要一點技術（或請工程師協助 10–20 分鐘），其餘照點即可。
標 🖼️ 處建議放一張截圖（括號已描述該畫面長相，方便對照與補圖）。
全程約 1–2 小時。架好之後，日常只需用後台 `/admin` 點選操作（見最後一節）。

> 名詞：**環境變數**＝填在平台「設定」裡的一串設定值（像帳號密碼）。本專案所有要填的值都列在 `.env.example`。

---

## 步驟 0：先註冊這些免費帳號
- [GitHub](https://github.com)（放程式碼、跑自動備份）
- [Supabase](https://supabase.com)（資料庫＝會員/訂單/課程）
- [Netlify](https://netlify.com)（網站代管）
- [Bunny.net](https://bunny.net)（影片串流＋防盜）
- [Resend](https://resend.com)（系統寄信）
- [PayUni 統一金流](https://www.payuni.com.tw)（刷卡收款，需商家審核）
- Google 帳號（備份存到你的 Google Drive）

---

## 步驟 1：把程式碼放到你的 GitHub
1. 在 GitHub 右上角 **＋ → New repository**，建一個私有 repo（例如 `bds-web`）。
2. 把本專案推上去（若已經在 GitHub 就跳過）。

---

## 步驟 2：建立資料庫（Supabase）

> ⚠️ Supabase 介面常改版、欄位名稱會變。**最穩的做法是用儀表板頂部的「Connect」按鈕**——
> 它把「網址、金鑰、連線字串」都放在同一個視窗，不必到處找。若你看到的名稱與下方略有不同，
> 認「概念」而非死記名稱（找「給瀏覽器用的公開金鑰」與「給伺服器用的機密金鑰」即可）。

1. Supabase → **New project** → 取名、選區域、**設定並記下資料庫密碼**（很重要，等下備份要用）。
2. 左側 **SQL Editor → New query**，把專案 `db/` 資料夾裡的檔案**依序**整份貼上、各按 **Run**：
   1. `db/init.sql`
   2. `db/add_performance_indexes.sql`
   3. `db/add_rate_limiting.sql`
   4. `db/add_auth_flows.sql` ← **信箱驗證與密碼重設資料表**
   5. `db/enable_rls.sql` ← **最後執行（開啟資料保護）**
   > 💡 更快：本地跑 `npm run setup -- --migrate` 可一鍵自動跑完上面所有 SQL（需先有連線字串，見第 5 點）。
3. **取得網址與金鑰**——點儀表板頂部的 **Connect** 按鈕（或左側 **齒輪 Settings → API Keys**）：
   - **Project URL / `NEXT_PUBLIC_SUPABASE_URL`**（像 `https://xxxx.supabase.co`）— 在 Connect 視窗的 App Frameworks 分頁可直接看到。
   - **公開金鑰**（給瀏覽器）：新版叫 **Publishable key**；舊版叫 **anon public**。→ 填入 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
   - **機密金鑰**（給伺服器，⚠️ 絕不外洩）：新版叫 **Secret key**（`sb_secret_...`）；舊版叫 **service_role**（在 **Legacy API Keys** 分頁）。→ 兩者擇一填入 `SUPABASE_SERVICE_ROLE_KEY` 皆可。
4. 左側 **Storage → New bucket**，名稱打 `uploads`，勾選 **Public**，建立。（之後後台上傳圖片會用到；或由 `npm run setup` 自動建立）
5. 🛠️ **取得資料庫連線字串**（備份與 `--migrate` 會用到）：點 **Connect** 按鈕 → **ORMs / Connection string** 區，複製 **URI**（`postgresql://...`），把其中 `[YOUR-PASSWORD]` 換成步驟 1 設的資料庫密碼。
   （舊路徑 Settings → Database → Connection string 仍可能存在，但 Connect 視窗最穩定。）

---

## 步驟 3：設定影片（Bunny.net）
1. Bunny → **Stream** → 建一個 Video Library → 把課程影片上傳進去。
2. 進該 Library 的 **Security**，開啟 **Embed View Token Authentication**（這就是防盜開關）。
3. 在該 Library 找到兩個值：
   - **Library ID**（一串數字）— 在該 Library 的 **API** 分頁。
   - **Token Authentication Key**（⚠️ 機密）— 在 **Security** 分頁（即上一步開啟防盜開關處）。
4. 之後在後台課程章節的「影片網址」貼該影片的 **embed 網址或影片 GUID** 即可，系統會自動簽發短效防盜網址。

---

## 步驟 4：設定金流（PayUni）
1. 到 PayUni 申請商家帳號（需身分/營業審核，可能要幾個工作天）。
2. 取得金鑰：PayUni 後台 → **會員 → 商店清單 → 選擇 SHOP 開頭的商店 → 串接設定 → 《API 串接金鑰》**，
   複製 **商店代號 MerID**、**HashKey**、**HashIV**（測試階段先用 Sandbox 那組）。
3. 本系統會在送出付款時自動帶上回呼網址（`/api/webhook/payuni`）；若你的 PayUni 後台另有
   **Notify URL / Return URL** 欄位，一併填 `https://你的網域/api/webhook/payuni`（網域等步驟 6 部署後才有）。

---

## 步驟 5：設定寄信（Resend）
1. Resend → **API Keys → Create**，複製 API Key。
2. （建議）**Domains** 驗證你的網域，之後寄件人用 `no-reply@你的網域`。未驗證前可先用 `onboarding@resend.dev` 測試。

---

## 步驟 6：部署到 Netlify（含填環境變數）
> ⚠️ Netlify 已把「Site（網站）」改稱「**Project（專案）**」。若你看到的是「Site settings」等舊字眼，
> 對應的就是下方的「Project configuration」，概念相同。
1. Netlify → **Add new project → Import an existing project** → 選 **GitHub** → 你的 repo。
2. 進 **Project configuration → Environment variables**，照 `.env.example` 把以下全部加進去
   （可用「Import from a .env file」貼上整份更快）：
   - `NEXTAUTH_URL`：先填 Netlify 給的網址，之後綁自己網域再改
   - `NEXTAUTH_SECRET`：一段隨機字串。產生方法（擇一）：
     - 終端機跑：`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
     - 或上 https://generate-secret.vercel.app/32 複製
   - `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`（步驟 2）
   - `PAYUNI_MERID`、`PAYUNI_HASH_KEY`、`PAYUNI_HASH_IV`、`NEXT_PUBLIC_PAYUNI_UPP_URL`（測試先填 sandbox 端點）、`NEXT_PUBLIC_PAYUNI_MERID`（步驟 4）
   - `BUNNY_STREAM_LIBRARY_ID`、`BUNNY_TOKEN_AUTH_KEY`（步驟 3）
   - `RESEND_API_KEY`、`RESEND_FROM_EMAIL`、`CONTACT_TO_EMAIL`（步驟 5）
3. 按 **Deploy**。完成後會得到一個網址。
4. （之後）到 Netlify **Project configuration → Domain management** 綁定你的 `bds.fu-notes.com` 子網域，並把 `NEXTAUTH_URL` 改成它、重新部署。

---

## 步驟 7：建立你的管理員帳號
1. 開網站 → `/signup` 註冊一個帳號。
2. 回 Supabase **SQL Editor**，執行（把信箱換成你註冊的）：
   ```sql
   UPDATE users SET role = 'admin' WHERE email = '你的信箱';
   ```
3. 重新登入 → 右上角會出現「管理後台」→ 進入 `/admin`。

---

## 步驟 8：設定每日自動備份到 Google Drive 🛠️
> 這是整份指南**最技術**的一步。做不來可先跳過——系統已內建「每日備份成 GitHub 檔案（artifact，保留 90 天）」零設定就有；之後再補 Google Drive 即可。但你要的是 Google Drive，照下面做：

**A. 在你電腦設定 rclone（連到你的 Google Drive）**
1. 到 https://rclone.org/downloads 下載 rclone（Windows 版解壓即用）。
2. 開終端機（PowerShell）切到 rclone 資料夾，執行：`rclone config`
3. 依序輸入：`n`（新增）→ 名稱打 `gdrive` → storage 選 `drive`（Google Drive）→ client_id / client_secret 直接 Enter 跳過 → scope 選 `1`（完整存取）→ 其餘 Enter → 問 `Use auto config?` 輸入 `y`（會跳出瀏覽器登入並授權你的 Google）→ team drive 選 `n` → 最後 `y` 確認。
4. 測試：`rclone lsd gdrive:`（能列出你的 Google Drive 資料夾就成功）。

**B. 取得 rclone 設定檔並轉成 base64**
1. 查設定檔位置：`rclone config file`（通常在 `C:\Users\你\AppData\Roaming\rclone\rclone.conf`）。
2. 在 PowerShell 把它轉成 base64（一行）：
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:APPDATA\rclone\rclone.conf"))
   ```
   複製印出來的那一長串。

**C. 到 GitHub 設定 Secrets**
🖼️（GitHub repo 的 Settings → Secrets and variables → Actions 頁：右上「New repository secret」按鈕、Name 與 Secret 兩個欄位）
GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**，新增：
- `SUPABASE_DB_URL`：步驟 2-5 的資料庫連線字串
- `RCLONE_CONFIG_BASE64`：上面複製的那串 base64
- `RCLONE_REMOTE`：`gdrive`

**D. 測試**
GitHub repo → **Actions → 每日資料庫備份 → Run workflow**。執行成功後，你的 Google Drive 會出現 `BDS-Backups/` 資料夾與一個 `.sql.gz` 備份檔。之後每天凌晨會自動備份。

---

## 步驟 9：設定保活（防 Supabase 休眠）
這是確保您的免費 Supabase 資料庫不會因為 7 天無人造訪而進入休眠的重要步驟。

**A. 在 Supabase 取得金鑰與網址**
1. 登入您的 [Supabase 控制台](https://supabase.com)。
2. 點選專案儀表板頂部的 **Connect** 按鈕。
3. 在彈出視窗的 **App Frameworks** 分頁中，複製以下兩個欄位值：
   - **Project URL**（格式類似 `https://xxxx.supabase.co`）
   - **Publishable key**（一串以 `eyJ...` 開頭的極長公開金鑰）

**B. 在 GitHub 設定 Secrets（安全變數）**
1. 前往您的 GitHub 專案網頁。
2. 點選上方選單最右側的 **Settings**（齒輪圖示）。
3. 在左側選單中，點擊 **Secrets and variables**，展開後點選 **Actions**。
4. 點擊綠色的 **New repository secret** 按鈕：
   - **Name** 輸入：`SUPABASE_URL`
   - **Value** 貼上您的 **Project URL**。
   - 點選 **Add secret** 存檔。
5. 再次點擊 **New repository secret** 按鈕：
   - **Name** 輸入：`SUPABASE_ANON_KEY`
   - **Value** 貼上您的 **Publishable key**。
   - 點選 **Add secret** 存檔。

**C. 手動執行測試與確認回應碼**
1. 點選專案上方選單的 **Actions** 分頁。
2. *（若提示工作流已被禁用，請點擊「I understand my workflows, go ahead and enable them」啟用 Actions 功能。）*
3. 在左側選單中，選取 **Supabase 保活（防免費版休眠）**。
4. 點擊右側的 **Run workflow** 下拉按鈕，並點選綠色的 **Run workflow** 開始執行。
5. 等待約 10~20 秒，會出現一筆正在執行的任務（黃色圈圈），當圖示變成**綠色打勾**時，點擊該筆紀錄進入。
6. **確認回應碼**：
   - 點擊左側選單「All jobs」底下的 **`ping`** 工作。
   - 在黑底日誌中，點擊展開 **`對 Supabase 做輕量查詢以保持喚醒`** 步驟。
   - 確認日誌的倒數第二行顯示：`Supabase 保活查詢回應碼：200`，即代表設定成功！

---

## 步驟 10：上線前實測
打開 `GO-LIVE-TEST.md`，照那份清單逐項打勾（PayUni 測試交易、Bunny 測試影片、核心流程、備份/保活）。全部通過後：
- PayUni 換成**正式**金鑰與正式端點。
- 後台「設定」把站名、Logo、主色、聯絡信箱、FAQ、公告改成你的品牌。
- 移除測試用的測試課程/訂單。

---

## 上線後的日常營運（這部分超簡單，任何人都會）
登入後到 `/admin`：
- **課程/章節**：新增課程、貼影片網址、上傳教材
- **文章 / 活動 / 數位下載 / 會員方案**：上架管理
- **成員**：管理學員、手動開通課程
- **財務**：看訂單與營收、匯出 CSV
- **留言**：審核/回覆學員提問
- **頁面管理 / 設定**：改關於我們、聯絡我們、站名、Logo、公告等

> 卡關時：技術性步驟（步驟 2、6、8）可請工程師協助一次性設定；設定好之後，新增課程與內容你自己來就行。
