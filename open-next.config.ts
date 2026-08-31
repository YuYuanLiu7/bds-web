import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// OpenNext Cloudflare 轉接器設定。
// 預設不啟用 R2/KV 快取（此站多為動態內容）；日後要 ISR 快取可再加 incrementalCache 等。
export default defineCloudflareConfig({});
