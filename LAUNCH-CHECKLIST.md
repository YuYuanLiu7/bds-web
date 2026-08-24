# 🚀 上線前最終檢查單（一頁勾選版）

> 程式與 UX 已達商業等級。本清單只列「**設定／營運**」的必做事項——全部打勾才算「能實際收錢營運」。
> 詳細步驟見 [`SETUP-GUIDE.md`](./SETUP-GUIDE.md)，逐項測試見 [`GO-LIVE-TEST.md`](./GO-LIVE-TEST.md)。

---

## ⚡ 快速設定（一鍵腳本，建議優先用）

填好 `.env.local` 後，於專案根目錄執行：

```bash
# 驗證環境變數、檢查資料表、自動建立 uploads bucket
npm run setup

# 進階：另用 SUPABASE_DB_URL 自動執行 SQL 建置所有資料表（含 RLS，冪等可重跑）
npm run setup -- --migrate

# 一併建立管理員帳號（密碼至少 6 位，會自動雜湊）
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=你的密碼 ADMIN_NAME=站長 npm run setup -- --migrate --admin
```

腳本會逐項回報 ✓／⚠／✗。下方第 1～2 區若用腳本完成，可直接打勾；金流真卡實測等仍須人工。

---

## 1. 資料庫（Supabase 建置）
> 💡 上述 `npm run setup -- --migrate --admin` 可一次自動建置好資料表與管理員帳號；以下為手動對照。
- [ ] 建立 Supabase 專案，於 SQL Editor 執行 `db/init.sql`（冪等，可重跑）
- [ ] 執行 `db/enable_rls.sql`（**最後**執行，對所有資料表開啟 RLS）
- [ ] 確認 Storage 有 `uploads` bucket（`npm run setup` 會自動建立，亦可手動建）
- [ ] 建立**管理員帳號**：用腳本 `--admin`，或先註冊一個帳號再到 `users` 表把 `role` 改為 `admin`

## 2. 環境變數（以 `.env.example` 為準，全部填齊）
- [ ] `NEXTAUTH_URL` = 正式網域、`NEXTAUTH_SECRET` = 隨機字串（`openssl rand -base64 32`）
- [ ] `NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（**勿加** `NEXT_PUBLIC_` 前綴、勿外洩）
- [ ] PayUni：`PAYUNI_MERID` / `PAYUNI_HASH_KEY` / `PAYUNI_HASH_IV`
- [ ] `NEXT_PUBLIC_PAYUNI_UPP_URL` = **正式端點** `https://api.payuni.com.tw/api/upp`（非 sandbox）
- [ ] `ENABLE_PAYMENT_SIMULATION` = `false`（正式環境務必關閉模擬付款）
- [ ] Resend：`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `CONTACT_TO_EMAIL`
- [ ] Bunny：`BUNNY_STREAM_LIBRARY_ID` / `BUNNY_TOKEN_AUTH_KEY`

## 3. 金流（PayUni）— ⚠️ 唯一一定要親自驗證的高風險點
- [ ] 已換成**正式**商店金鑰（非 sandbox）
- [ ] **用真卡實際跑通一筆付款**：下單 → PayUni 付款 → callback 成功 → 訂單變 `paid` → 開通權限 → 收到通知信
- [ ] 確認金額以資料庫為準（前端傳錯金額不影響實收）

## 4. Email（Resend）
- [ ] **驗證寄件網域**（未驗證 → 購買通知信、聯絡表單會寄不出去）
- [ ] 寄一封測試信確認可送達

## 5. 影片（Bunny.net）
- [ ] 建立 Stream 影片庫並上傳至少一支測試影片
- [ ] 設定 token 金鑰，確認**付費課程影片**在看課頁可正常播放（簽名有效）

## 6. 部署（Netlify 免費版）
- [ ] 連結 repo、設定上述所有環境變數
- [ ] 綁定自訂網域、確認 `NEXTAUTH_URL` 與網域一致（HTTPS）
- [ ] 部署成功、首頁與後台皆可開啟

## 7. 全流程驗收（照 `GO-LIVE-TEST.md` 跑一遍）
- [ ] 訪客：瀏覽課程／文章／活動／下載，無破圖、無錯誤
- [ ] 註冊 → 登入 → 購買 → 看課 → 下載教材
- [ ] 後台：課程／活動／文章／會員／訂單／留言審核 皆可操作
- [ ] 手機開後台：漢堡選單、抽屜、表格橫向捲動正常
- [ ] 後台改主色 → 全站主色同步變更

## 8. 備份與維運（建議，非必須）
- [ ] GitHub Actions 每日 `pg_dump` → Google Drive 備份已啟用
- [ ] keep-alive cron 已啟用（避免 Supabase 閒置暫停）

---

## 已知限制（交付時請向客戶說明）
- **無自動化測試**：目前靠 `npm run build` + `npm run lint` + 本清單手動把關。若長期多客戶營運，建議未來補上金流 callback 與權限守衛的測試。
- **真實金流**：上線前的 PayUni 真卡實測（§3）是唯一無法在開發階段預先驗證的項目，務必執行。

> ✅ 全部打勾 = 可正式對外營運／交付客戶。
>
> 📋 本清單是給**你（賣方／部署者）**用的。交付給客戶驗收時，請改給對方
> [`CUSTOMER-ACCEPTANCE.md`](./CUSTOMER-ACCEPTANCE.md)（純點擊、約 30 分鐘、不含技術設定）。
