// 將未使用的 @vercel/og WebAssembly 檔清空為「合法的空模組」（8 bytes）。
//
// 為什麼：本站未使用動態 OG 圖片（ImageResponse / opengraph-image），但 OpenNext
// 仍會把 resvg.wasm(≈1.35MB)+yoga.wasm 打包進 Worker。wasm 為二進位、gzip 幾乎壓不動，
// 是壓垮 Cloudflare 免費版 3MB 上限的主因（清追蹤檔的方式對它無效，實測移除 0 筆）。
//
// 空模組（\0asm\1\0\0\0）可正常編譯、可被載入；由於本站永遠不會呼叫 OG 圖片產生，
// 這些 wasm 的匯出從不會被使用，清空後無任何副作用。
//
// 用法：於 opennextjs-cloudflare build 之後、wrangler deploy 之前執行。

import { writeFileSync, statSync, globSync } from 'node:fs';

const EMPTY_WASM = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

const patterns = [
  'node_modules/next/dist/compiled/@vercel/og/*.wasm',
  '.open-next/**/@vercel/og/*.wasm',
  '.open-next/**/resvg.wasm',
  '.open-next/**/yoga.wasm',
];

let count = 0;
let saved = 0;
const seen = new Set();
for (const pat of patterns) {
  for (const f of globSync(pat)) {
    if (seen.has(f)) continue;
    seen.add(f);
    try {
      const before = statSync(f).size;
      if (before <= EMPTY_WASM.length) continue;
      writeFileSync(f, EMPTY_WASM);
      count++;
      saved += before;
    } catch (e) {
      console.warn(`[blank-og-wasm] 略過 ${f}: ${e.message}`);
    }
  }
}

console.log(`[blank-og-wasm] 清空 ${count} 個 OG wasm 檔，省下約 ${(saved / 1024).toFixed(0)} KiB`);
