import sanitizeHtmlLib from 'sanitize-html';

/**
 * 富文本 HTML 消毒（防儲存型 XSS）。
 *
 * 取代先前的 isomorphic-dompurify——它會把整包 jsdom（12MB+）打包進
 * Cloudflare Worker，導致 handler 超過體積上限而部署失敗。
 * sanitize-html 不依賴 jsdom（改用 htmlparser2），體積小很多、可在 Workers 執行。
 *
 * 允許清單對準 RichTextEditor / ArticleModal 的輸出：
 * 標題、粗斜體底線刪除線、清單、引用、連結、圖片、表格、文字色/底色/大小、縮排。
 * 一律過濾 <script>、on* 事件屬性、javascript: 等 XSS 向量。
 */
const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    'p', 'div', 'span', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'ins',
    'sub', 'sup', 'small', 'mark', 'font',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
    'caption', 'colgroup', 'col',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    font: ['color', 'size', 'face'],
    table: ['border', 'cellpadding', 'cellspacing', 'width', 'align', 'style'],
    td: ['colspan', 'rowspan', 'align', 'valign', 'width', 'style'],
    th: ['colspan', 'rowspan', 'align', 'valign', 'width', 'style'],
    col: ['span', 'width', 'style'],
    // 全域允許 style / align / dir，讓編輯器產生的 inline 樣式（顏色、底色、縮排）得以保留
    '*': ['style', 'align', 'dir'],
  },
  // 連結只允許安全協定（自動擋掉 javascript:）；圖片額外允許 data: 以支援貼上的內嵌圖
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  // 只放行不具危險性的 CSS 屬性，值以白名單正則限制（擋掉 expression()、url() 等）
  allowedStyles: {
    '*': {
      color: [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(/, /^rgba\(/, /^[a-zA-Z]+$/],
      'background-color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(/, /^rgba\(/, /^[a-zA-Z]+$/],
      'text-align': [/^(left|right|center|justify)$/],
      'text-decoration': [/^(underline|line-through|none)$/],
      'font-weight': [/^(normal|bold|[1-9]00)$/],
      'font-style': [/^(normal|italic)$/],
      'font-size': [/^\d+(?:\.\d+)?(px|em|rem|%|pt)$/],
      width: [/^\d+(?:\.\d+)?(px|em|rem|%)$/],
      height: [/^\d+(?:\.\d+)?(px|em|rem|%)$/],
      'border': [/^[\w\s#().,%-]+$/],
      'border-collapse': [/^(collapse|separate)$/],
      'padding': [/^[\d\s.pxemrt%-]+$/],
      'margin': [/^[\d\s.pxemrt%-]+$/],
      'margin-left': [/^\d+(?:\.\d+)?(px|em|rem|%)$/],
      'vertical-align': [/^(top|middle|bottom|baseline)$/],
      'list-style-type': [/^[a-z-]+$/],
    },
  },
  // 對外連結補上 rel（防 tabnabbing）；不強制加，交由內容決定
  allowProtocolRelative: false,
};

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return sanitizeHtmlLib(dirty, OPTIONS);
}
