'use client';

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  // Simple YouTube/Vimeo/Bunny.net extractor
  const getEmbedUrl = (url: string) => {
    // Bunny.net Stream Support
    if (url.includes('bunny.net') || url.includes('iframe.mediadelivery.net')) {
      // If it's already an embed URL
      if (url.includes('embed')) return url;
      // If it's a direct link, we might need to handle specific formats, 
      // but usually users paste the embed URL from Bunny dashboard.
      return url;
    }
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes('vimeo.com')) {
      const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
      const match = url.match(regExp);
      const id = match ? match[1] : null;
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return url; // Default to return what's provided
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
        <p>無法播放此影片格式</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
