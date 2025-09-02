
import React, { useState } from 'react';
import { getYouTubeEmbedUrl, getAlternativeEmbedUrl, isValidYouTubeId } from '@/lib/youtube';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoEmbedProps {
  id: string;
  isShort: boolean;
  title?: string;
  className?: string;
}

const VideoEmbed = ({ id, isShort, title = "Property Video", className = "" }: VideoEmbedProps) => {
  const [embedError, setEmbedError] = useState(false);
  const [useAlternative, setUseAlternative] = useState(false);

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <AlertCircle className="mx-auto mb-2 h-8 w-8" />
          <p>Invalid video ID</p>
        </div>
      </div>
    );
  }

  // Clean the ID (remove any whitespace)
  const cleanId = id.trim();
  
  if (!isValidYouTubeId(cleanId)) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <AlertCircle className="mx-auto mb-2 h-8 w-8" />
          <p>Invalid YouTube video ID format</p>
        </div>
      </div>
    );
  }

  const handleIframeError = () => {
    console.log('YouTube embed error, trying alternative method');
    if (isShort && !useAlternative) {
      setUseAlternative(true);
    } else {
      setEmbedError(true);
    }
  };

  const embedUrl = useAlternative ? getAlternativeEmbedUrl(cleanId) : getYouTubeEmbedUrl(cleanId, isShort);
  const youtubeUrl = isShort ? `https://www.youtube.com/shorts/${cleanId}` : `https://www.youtube.com/watch?v=${cleanId}`;

  if (embedError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="text-gray-600 mb-4">
            This {isShort ? 'YouTube Short' : 'video'} cannot be embedded
          </p>
          <Button
            onClick={() => window.open(youtubeUrl, '_blank')}
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Watch on YouTube
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isShort ? 'aspect-[9/16] max-w-md mx-auto' : 'aspect-video'} ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full rounded-lg"
        loading="lazy"
        onError={handleIframeError}
        onLoad={() => {
          // Reset error state if iframe loads successfully
          setEmbedError(false);
        }}
      />
      {isShort && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Short
        </div>
      )}
    </div>
  );
};

export default VideoEmbed;
