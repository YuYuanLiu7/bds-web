// 上傳檔案類型白名單（單一事實來源）：
// 一般上傳（/api/admin/upload）與大檔直傳（/api/admin/upload-url）共用同一份，避免兩處規則不一致。
//
// 明確排除 .svg / .html 等可被瀏覽器當作內容執行、造成儲存型 XSS 的類型；
// 簡報/文件格式（pptx/ppt/key/doc/docx/xls/xlsx）不會被瀏覽器當程式執行，加入是安全的。
// 影片與音訊為課程長片與音檔常見格式。
export const ALLOWED = new Map<string, string>([
  ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['png', 'image/png'],
  ['gif', 'image/gif'], ['webp', 'image/webp'],
  // 影片（課程長片：新增 avi/m4v/mkv/wmv/flv，保留 mp4/webm/mov）
  ['mp4', 'video/mp4'], ['webm', 'video/webm'], ['mov', 'video/quicktime'],
  ['avi', 'video/x-msvideo'], ['m4v', 'video/x-m4v'],
  ['mkv', 'video/x-matroska'], ['wmv', 'video/x-ms-wmv'], ['flv', 'video/x-flv'],
  // 音訊
  ['mp3', 'audio/mpeg'],
  ['pdf', 'application/pdf'], ['zip', 'application/zip'],
  // 簡報與文件（課程教材常見格式）
  ['ppt', 'application/vnd.ms-powerpoint'],
  ['pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['key', 'application/vnd.apple.keynote'],
  ['doc', 'application/msword'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['xls', 'application/vnd.ms-excel'],
  ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
]);

/** 不支援類型時的統一錯誤訊息 */
export const UNSUPPORTED_TYPE_MESSAGE =
  '不支援的檔案類型。允許：JPG/PNG/GIF/WEBP、MP4/WEBM/MOV/AVI/M4V/MKV/WMV/FLV、MP3、PDF/ZIP、Word/Excel/PPT/Keynote';
