'use client';

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  // Check if the URL is a direct video file (e.g. .mp4, .mov, .webm)
  const isDirectVideo = (url: string) => {
    if (!url) return false;
    // Matches video extensions, ignoring case and potential query params (e.g., Supabase storage tokens)
    return /\.(mp4|webm|ogg|mov|m4v)(?:\?.*)?$/i.test(url) || url.startsWith('blob:');
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    // Bunny.net Stream Support
    if (url.includes('bunny.net') || url.includes('iframe.mediadelivery.net')) {
      if (url.includes('embed')) return url;
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

  if (isDirectVideo(url)) {
    return (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl relative">
        <video
          src={url}
          controls
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-slate-900 flex items-center justify-center text-white">
        <p>無法播放此影片格式</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl">
      <iframe
        src={embedUrl}
        title="課程影片播放器"
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
