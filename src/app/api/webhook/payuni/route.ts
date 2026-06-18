// PayUni 付款非同步通知 Webhook（PRD 指定路徑 /api/webhook/payuni）。
// 實作沿用 /api/checkout/callback 的處理邏輯（驗 Hash、防重送、金額校驗、開通權限），
// 兩個路徑皆可接收，確保 PayUni 後台 NotifyURL 對齊 PRD 規格。
export { POST } from "@/app/api/checkout/callback/route";
