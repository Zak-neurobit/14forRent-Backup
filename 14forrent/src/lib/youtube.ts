
/**
 * Accepts any YouTube or Shorts URL and returns:
 *   { id: "VIDEO_ID", isShort: true|false }
 * Returns null if the URL isn't recognised.
 */
export function parseYouTube(url: string): { id: string; isShort: boolean } | null {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const u = new URL(url.trim());
    
    // youtu.be/VIDEO
    if (/youtu\.be$/.test(u.host)) {
      const id = u.pathname.slice(1);
      if (id && id.length === 11) {
        return { id, isShort: false };
      }
    }

    if (/youtube\./.test(u.host)) {
      // shorts: /shorts/VIDEO_ID
      const shorts = u.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shorts) return { id: shorts[1], isShort: true };

      // /watch?v=VIDEO
      if (u.pathname === "/watch" && u.searchParams.get("v")) {
        const id = u.searchParams.get("v")!;
        if (id.length === 11) {
          return { id, isShort: false };
        }
      }

      // /embed/VIDEO
      const embed = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed) return { id: embed[1], isShort: false };
    }
  } catch {
    // bad URL
  }
  return null;
}

/**
 * Generate embed URL for YouTube video or short
 */
export function getYouTubeEmbedUrl(id: string, isShort: boolean): string {
  // Basic embed parameters that work for both regular videos and shorts
  const baseParams = new URLSearchParams({
    controls: '1',
    modestbranding: '1',
    rel: '0',
    autoplay: '0',
    mute: '0'
  });

  if (isShort) {
    // For YouTube Shorts, use standard embed with basic parameters
    return `https://www.youtube.com/embed/${id}?${baseParams.toString()}`;
  }
  
  // For regular videos, add additional parameters
  return `https://www.youtube.com/embed/${id}?${baseParams.toString()}`;
}

/**
 * Get alternative embed URL for Shorts (fallback method)
 */
export function getAlternativeEmbedUrl(id: string): string {
  // Try embedding as a regular video instead of a Short
  return `https://www.youtube.com/embed/${id}?controls=1&modestbranding=1&rel=0&start=0`;
}

/**
 * Validate if a YouTube video ID is likely to be embeddable
 */
export function isValidYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}
