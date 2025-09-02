
import React from 'react';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

const YouTubeEmbed = ({ url, title = "Property Tour" }: YouTubeEmbedProps) => {
  const extractYouTubeId = (url: string): string => {
    // Regular YouTube videos
    const regularMatch = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([\w-]{11})/);
    if (regularMatch) return regularMatch[1];
    
    // YouTube Shorts
    const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    
    return '';
  };

  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return null;
  }

  // Check if it's a YouTube Short for different aspect ratio
  const isShort = url.includes('/shorts/');

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className={`relative ${isShort ? 'aspect-[9/16] max-w-md mx-auto' : 'aspect-video'} rounded-lg overflow-hidden shadow-lg`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};

export default YouTubeEmbed;
