
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";

interface YouTubeUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const YouTubeUrlInput = ({ value, onChange, error }: YouTubeUrlInputProps) => {
  const isValidYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  };

  const getEmbedUrl = (url: string): string => {
    if (!url) return "";
    
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    return url;
  };

  const isValid = value ? isValidYouTubeUrl(value) : true;

  return (
    <div className="space-y-2">
      <Label htmlFor="youtube-url" className="flex items-center gap-2">
        YouTube Video URL
        {value && (
          isValid ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )
        )}
      </Label>
      
      <Input
        id="youtube-url"
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/shorts/..."
        className={`${
          value && !isValid ? 'border-red-300 focus:border-red-500' : ''
        }`}
      />
      
      {value && !isValid && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Please enter a valid YouTube URL (regular videos, shorts, or embeds)
        </p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>Supported YouTube URL formats:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
          <li>https://youtu.be/VIDEO_ID</li>
          <li>https://www.youtube.com/shorts/VIDEO_ID</li>
          <li>https://www.youtube.com/embed/VIDEO_ID</li>
        </ul>
      </div>
      
      {value && isValid && (
        <div className="mt-4">
          <Label className="text-sm font-medium">Preview:</Label>
          <div className="mt-2 aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={getEmbedUrl(value)}
              title="YouTube video preview"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};
