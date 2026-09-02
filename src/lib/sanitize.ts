import { FilterXSS } from 'xss';

/**
 * 富文本 HTML 消毒（防儲存型 XSS）。
 *
 * 使用 js-xss（純 JS、無 jsdom、無 postcss），可在 Cloudflare Workers 執行且體積極小。
 * 先前用 isomorphic-dompurify 會把 jsdom（18-20MB）打包進 Worker；改用 sanitize-html
 * 又會帶進 postcss（Turbopack 產生雜湊模組名，Windows 本機建置解析失敗）。js-xss 兩者皆無。
 *
 * 允許清單對準 RichTextEditor / ArticleModal 的輸出：
 * 標題、粗斜體底線刪除線、清單、引用、連結、圖片、表格、文字色/底色/大小、縮排。
 * 一律過濾 <script>（連同內容）、on* 事件屬性、javascript: 等 XSS 向量；
 * style 屬性交由 xss 內建 CSS 過濾器（cssfilter）以安全白名單處理（保留 color/背景/邊框等）。
 */
const STYLED = ['style'];
const filter = new FilterXSS({
  whiteList: {
    p: STYLED, div: STYLED, span: STYLED, br: [], hr: [],
    h1: STYLED, h2: STYLED, h3: STYLED, h4: STYLED, h5: STYLED, h6: STYLED,
    b: [], strong: [], i: [], em: [], u: [], s: [], strike: [], del: [], ins: [],
    sub: [], sup: [], small: [], mark: [],
    font: ['color', 'size', 'face'],
    ul: STYLED, ol: STYLED, li: STYLED,
    blockquote: STYLED, pre: [], code: [],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    table: ['border', 'cellpadding', 'cellspacing', 'width', 'align', 'style'],
    thead: [], tbody: [], tfoot: [],
    tr: STYLED,
    td: ['colspan', 'rowspan', 'align', 'valign', 'width', 'style'],
    th: ['colspan', 'rowspan', 'align', 'valign', 'width', 'style'],
    caption: [], colgroup: [], col: ['span', 'width', 'style'],
  },
  // script/style 標籤連同內容整段移除（其餘未列標籤只移除標籤、保留文字）
  stripIgnoreTagBody: ['script', 'style'],
  allowCommentTag: false,
  css: {}, // 啟用 cssfilter 預設安全白名單（color/background/border/padding/font-* 等）
});

// 舊式 <font color/size/face> 以「HTML 屬性」上色，會被前台 Tailwind `prose` 的 CSS 蓋掉
// （行內 style 才蓋得過）。這裡先把 <font ...> 轉成帶 inline style 的 <span>，
// 再交給 xss 消毒（style 值仍會過 cssfilter 白名單，安全）。如此舊內容也一併正常顯示。
const FONT_SIZE_MAP: Record<string, string> = {
  '1': '0.75rem', '2': '0.875rem', '3': '1rem', '4': '1.125rem',
  '5': '1.5rem', '6': '2rem', '7': '3rem',
};
function fontTagsToInlineSpan(html: string): string {
  return html
    .replace(/<font\b([^>]*)>/gi, (_m, attrs: string) => {
      const clean = (v?: string) => (v || '').replace(/[<>"';]/g, '').trim();
      const color = clean(/color\s*=\s*"?([^"\s>]+)"?/i.exec(attrs)?.[1]);
      const size = clean(/size\s*=\s*"?([1-7])"?/i.exec(attrs)?.[1]);
      const face = clean(/face\s*=\s*"([^"]+)"/i.exec(attrs)?.[1]);
      const styles: string[] = [];
      if (color) styles.push(`color:${color}`);
      if (size && FONT_SIZE_MAP[size]) styles.push(`font-size:${FONT_SIZE_MAP[size]}`);
      if (face) styles.push(`font-family:${face}`);
      return styles.length ? `<span style="${styles.join(';')}">` : '<span>';
    })
    .replace(/<\/font>/gi, '</span>');
}

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return filter.process(fontTagsToInlineSpan(dirty));
}
