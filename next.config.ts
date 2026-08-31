import type { NextConfig } from "next";

// 容錯防呆：若環境變數 NEXTAUTH_URL 包含中文說明或非合法 URL（例如部署時誤把說明文字貼入），
// 先行清理，避免 NextAuth / Next.js 在載入時 `new URL()` 拋出 Invalid URL 崩潰。
if (process.env.NEXTAUTH_URL) {
  try {
    new URL(process.env.NEXTAUTH_URL);
  } catch {
    console.warn(`[next.config] Invalid NEXTAUTH_URL detected, removing: ${process.env.NEXTAUTH_URL}`);
    delete process.env.NEXTAUTH_URL;
  }
}

const nextConfig: NextConfig = {
  // 本站未使用動態 OG 圖片（ImageResponse / opengraph-image），
  // 將 @vercel/og 的 resvg.wasm(1.3MB)+yoga.wasm 從伺服器追蹤中排除，
  // 避免被打包進 Cloudflare Worker、撐大體積。
  outputFileTracingExcludes: {
    '*': [
      'node_modules/next/dist/compiled/@vercel/og/**',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    proxyClientMaxBodySize: '5gb',
  },
  // 全站 HTTP 安全標頭（保守設定，不致破壞既有功能；嚴格 CSP 留待後續測試後導入）
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS 僅在 HTTPS 生效（本機 http 會被瀏覽器忽略），正式網域可強制 https
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
