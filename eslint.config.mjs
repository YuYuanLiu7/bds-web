import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React Compiler（react-hooks v6）此規則過於嚴格，會把常見且正當的寫法
      // （開啟 Modal 時初始化表單、effect 內同步寫入已取得的資料、切換路由時關閉選單等）
      // 一律標為 error。這些並非 bug，僅為「可能多一次 render」的效能提示，
      // 故降為 warning，避免阻斷 lint；真正的純粹性問題（purity/immutability）仍維持 error。
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
