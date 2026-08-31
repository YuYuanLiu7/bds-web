// 從 Next 的檔案追蹤（.nft.json）移除 @vercel/og 參照。
//
// 為什麼：本站未使用動態 OG 圖片（ImageResponse / opengraph-image），
// 但 Next 16 (Turbopack) 仍會把 @vercel/og/index.node.js 列進追蹤檔。
// OpenNext Cloudflare 會據此判定「有用到 OG」，於是把 resvg.wasm(≈1.35MB)+yoga.wasm
// 打包進 Worker。wasm 為二進位、gzip 幾乎壓不動，是壓垮 3MB 免費上限的主因。
// （next.config 的 outputFileTracingExcludes 在 Turbopack 下不生效，故改用本腳本。）
//
// 用法：next build 之後、opennextjs-cloudflare build --skipNextBuild 之前執行。

import { readFileSync, writeFileSync, globSync } from 'node:fs';

// 以 Node 內建 globSync（Node 22+）掃描，不依賴外部 glob 套件
const files = globSync('.next/server/**/*.nft.json');

let touched = 0;
let removed = 0;
for (const f of files) {
  const json = JSON.parse(readFileSync(f, 'utf8'));
  if (!Array.isArray(json.files)) continue;
  const before = json.files.length;
  json.files = json.files.filter((p) => !p.includes('@vercel/og'));
  const diff = before - json.files.length;
  if (diff > 0) {
    writeFileSync(f, JSON.stringify(json));
    touched++;
    removed += diff;
  }
}

console.log(`[strip-og-trace] 掃描 ${files.length} 個 .nft.json，清理 ${touched} 個檔、移除 ${removed} 筆 @vercel/og 參照。`);
