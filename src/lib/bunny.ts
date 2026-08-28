import crypto from 'crypto';

// ⚠️ 皆為「伺服器端」機密，切勿加 NEXT_PUBLIC_ 前綴、勿外洩到瀏覽器
const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || '';
const TOKEN_KEY = process.env.BUNNY_TOKEN_AUTH_KEY || '';

const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** 從輸入（GUID、embed 網址或 .m3u8 路徑）抽出 Bunny 影片 ID */
export function extractBunnyVideoId(input: string): string | null {
  if (!input) return null;
  const embed = input.match(/embed\/\d+\/([0-9a-f-]{36})/i);
  if (embed) return embed[1];
  const g = input.match(GUID);
  return g ? g[0] : null;
}

/** 判斷是否為 Bunny 影片來源 */
export function isBunnyVideo(input: string): boolean {
  if (!input) return false;
  return input.includes('mediadelivery.net') || input.includes('b-cdn.net') || input.includes('bunny') || !!extractBunnyVideoId(input);
}

/**
 * 產生帶 Token 的 Bunny Stream 嵌入網址（防盜）。
 * 演算法：SHA256(TokenAuthKey + VideoID + Expiration)，效期預設 30 分鐘
 * （效期越短，簽好的網址被複製轉發後可濫用的時間越短；播放頁每次載入都會重新簽發）。
 * 必須在「伺服器端」呼叫（API Route / server component），且需設定
 * BUNNY_STREAM_LIBRARY_ID 與 BUNNY_TOKEN_AUTH_KEY。
 *
 * 前置：Bunny 後台 → Stream Library → Security 開啟「Embed View Token Authentication」。
 * 注意：不同 Bunny 設定的 token 串接順序可能略有差異，上線前請以一支測試影片驗證；
 *       若 Bunny 端驗章失敗，請對照官方文件調整下方 update() 的串接順序。
 * 回傳 null 代表未設定 env 或非 Bunny 影片（呼叫端應退回原始網址處理）。
 */
export function signBunnyEmbedUrl(videoUrlOrId: string, expiresInSeconds = 30 * 60): string | null {
  const videoId = extractBunnyVideoId(videoUrlOrId);
  if (!videoId || !LIBRARY_ID || !TOKEN_KEY) return null;

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const token = crypto
    .createHash('sha256')
    .update(TOKEN_KEY + videoId + expires)
    .digest('hex');

  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}?token=${token}&expires=${expires}&autoplay=false`;
}

/**
 * 產生帶 Token 的 Bunny CDN HLS 播放網址（對應 PRD 的 .m3u8 形式，供自訂播放器使用）。
 * 演算法為 Bunny CDN URL Token Authentication：base64url(sha256_raw(SecurityKey + path + expires [+ ip]))。
 * 需設定 BUNNY_CDN_HOSTNAME 與 BUNNY_TOKEN_AUTH_KEY。
 */
export function signBunnyHlsUrl(videoUrlOrId: string, userIp?: string, expiresInSeconds = 6 * 60 * 60): string | null {
  const host = process.env.BUNNY_CDN_HOSTNAME || '';
  const videoId = extractBunnyVideoId(videoUrlOrId);
  if (!videoId || !host || !TOKEN_KEY) return null;

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const path = `/${videoId}/playlist.m3u8`;
  let base = TOKEN_KEY + path + expires;
  if (userIp) base += userIp;
  const token = crypto
    .createHash('sha256')
    .update(base)
    .digest('base64')
    .replace(/\n/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `https://${host}${path}?token=${token}&expires=${expires}`;
}
