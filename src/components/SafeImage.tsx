'use client';

import { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 圖片載入失敗或無來源時顯示的預設圖 */
  fallbackSrc?: string;
}

/**
 * 具備失敗降級的圖片元件：當外部圖片網址失效（例如種子資料的 Unsplash 連結 404）
 * 或無來源時，自動退回本地預設圖，避免畫面出現破圖。
 * 為 client component，可安全用於 server 或 client component 中。
 */
export default function SafeImage({
  src,
  alt = '',
  fallbackSrc = '/images/course-placeholder.svg',
  ...rest
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = failed || !src ? fallbackSrc : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}
