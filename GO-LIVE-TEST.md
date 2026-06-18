# BDS 上線前實測清單（PayUni 金流 + Bunny 影片 + 核心流程）

逐項做完打勾，全部通過即可正式對外。**先用測試環境/測試帳號做，確認無誤再切正式。**

---

## 0. 前置確認
- [ ] Supabase 已執行 `db/init.sql`、`db/add_performance_indexes.sql`、`db/add_rate_limiting.sql`、`db/enable_rls.sql`（RLS 已開啟）
- [ ] `.env.local`（或部署平台環境變數）已填：Supabase（含 `SUPABASE_SERVICE_ROLE_KEY`）、PayUni、Resend、Bunny、`NEXTAUTH_URL`/`NEXTAUTH_SECRET`
- [ ] Supabase Storage 有 `uploads`（Public）bucket
- [ ] 已建立一個管理員帳號（`UPDATE users SET role='admin' WHERE email=...`）

---

## 1. PayUni 金流實測（用 PayUni **測試（sandbox）**商店金鑰）
- [ ] `NEXT_PUBLIC_PAYUNI_UPP_URL` = sandbox 端點、`ENABLE_PAYMENT_SIMULATION` 不設或非 true
- [ ] PayUni 後台「Notify URL / Return URL」設為 `https://你的網域/api/webhook/payuni`
- [ ] 後台建立一門「測試課程」（設個小價格，如 NT$1）
- [ ] 以一般學員帳號登入 → 點「立即購買」→ 應跳轉 PayUni 付款頁（用 PayUni 提供的測試卡號付款）
- [ ] 付款完成後：
  - [ ] PayUni 後台顯示交易成功
  - [ ] 伺服器 log 顯示 `/api/webhook/payuni` 收到通知、Hash 驗證通過（無 `Invalid HashInfo`）
  - [ ] 資料庫 `orders` 該筆 `status` = `paid`
  - [ ] 該學員「我的學習」已能看到並進入這門課（權限已開通）
  - [ ] 收到「購買成功」通知信（Resend）
- [ ] **防竄改驗證**：用瀏覽器 DevTools 把送出的金額改小 → 後端仍以 DB 價格計算（PayUni 收到的是 DB 金額），且 Webhook 的金額一致性校驗會擋下不符的回呼
- [ ] **未登入擋下**：登出後直接打 `/api/checkout` 應回 401
- [ ] 測試完成、要正式上線時：換成 PayUni **正式**商店金鑰與正式 UPP 端點

> 重點：這一步同時驗證「加密格式被 PayUni 接受」「Webhook 簽章驗證」「訂單開通」三件事，是金流整合唯一能 100% 確認的方式。

---

## 2. Bunny.net 影片防盜實測
- [ ] 影片已上傳到 Bunny **Stream Library**
- [ ] 該影片庫 **Security → Embed View Token Authentication** 已開啟
- [ ] `BUNNY_STREAM_LIBRARY_ID`、`BUNNY_TOKEN_AUTH_KEY` 已設定（皆無 NEXT_PUBLIC_ 前綴）
- [ ] 後台課程章節「影片網址」填該影片的 embed 網址或 GUID
- [ ] 用**有購課權限**的學員進入該單元 → 影片正常播放
- [ ] **防盜驗證**：
  - [ ] 在播放頁面看原始碼，影片網址帶有 `?token=...&expires=...`（短效）
  - [ ] 直接把不帶 token 的 Bunny 原始 embed 網址貼到無痕視窗 → 應**無法播放**（被 Token Auth 擋）
  - [ ] 等 6 小時後（或把 expires 改過期）原 token 網址失效
- [ ] 若 Bunny 端回報驗章失敗 → 依 `src/lib/bunny.ts` 註解調整 token 串接順序後再測

---

## 3. 核心流程冒煙測試
- [ ] 註冊新帳號（密碼太短應被擋；email 格式錯應被擋）
- [ ] 登入 / 登出正常
- [ ] 文章付費牆：未購買/未登入看會員或購課限定文章 → 只見摘要被鎖；有權限 → 看到全文
- [ ] 數位下載：未購買付費商品按「立即購買」→ 進金流；已購買 → 可下載
- [ ] 後台 CRUD：新增/編輯/刪除 課程、文章、活動、下載、會員方案、成員，重整後資料仍在（已持久化）
- [ ] 後台上傳圖片 → 成功（存到 Supabase Storage，網址為 supabase 網域）
- [ ] 聯絡表單送出 → 客服信箱收到信
- [ ] 速率限制：連續快速登入錯誤多次 → 被擋（需先在 Supabase 跑 `db/add_rate_limiting.sql`）

---

## 4. 備份 / 保活實測（GitHub Actions）
- [ ] repo Secrets 已設：`SUPABASE_DB_URL`、`RCLONE_CONFIG_BASE64`、`RCLONE_REMOTE`、`SUPABASE_URL`、`SUPABASE_ANON_KEY`
- [ ] 到 GitHub **Actions** 手動觸發「每日資料庫備份」→ 執行成功
  - [ ] Google Drive 的 `BDS-Backups/` 出現 `.sql.gz` 備份檔
  - [ ] 該次執行的 Artifacts 也有一份備份（雙保險）
- [ ] 手動觸發「Supabase 保活」→ 回應碼 200

---

## 5. 正式上線切換
- [ ] `NEXTAUTH_URL` = 正式網域；`bds.fu-notes.com` 已指向部署平台
- [ ] PayUni 換正式金鑰 + 正式 UPP 端點；`ENABLE_PAYMENT_SIMULATION` 未設為 true
- [ ] 後台「設定」品牌資訊（站名/Logo/主色/聯絡信箱/FAQ/公告）已更新
- [ ] 移除測試用的測試課程/測試訂單
- [ ] （若從 Teachify 搬家）會員與已購紀錄已匯入、並完成「重設密碼」通知
