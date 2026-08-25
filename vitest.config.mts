import { defineConfig } from 'vitest/config';
import path from 'node:path';

// 讓測試檔能用 `@/...` 匯入 src 底下的模組（與 Next 的路徑別名一致）
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
