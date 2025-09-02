import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  description: string;
  url?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  description,
  url = window.location.href,
  variant = "outline",
  size = "sm",
  showText = true,
  className = ""
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: description,
      url: url
    };

    // Check if Web Share API is supported (mainly mobile devices)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
        toast.success("Property shared successfully!");
        return;
      } catch (error) {
        // User cancelled sharing or error occurred, fall back to copy
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }

    // Fallback to copying link to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Property link copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      
      // Final fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopied(true);
        toast.success("Property link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('All clipboard methods failed:', fallbackError);
        toast.error("Unable to copy link. Please copy the URL from your browser.");
      }
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={`transition-all duration-200 ${className}`}
      aria-label={`Share ${title}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2 text-sm">
          {copied ? "Copied!" : "Share"}
        </span>
      )}
    </Button>
  );
};