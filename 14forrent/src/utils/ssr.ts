
/**
 * SSR Utility Functions
 * 
 * This file contains utilities for Server-Side Rendering integration.
 * You can modify these settings to adjust SSR behavior.
 */

export interface SSRConfig {
  enabled: boolean;
  edgeFunctionUrl: string;
  fallbackTimeout: number; // milliseconds
  cacheTimeout: number; // seconds
}

// SSR Configuration - Modify these settings as needed
export const SSR_CONFIG: SSRConfig = {
  enabled: true,
  edgeFunctionUrl: 'https://hdigtojmeagwaqdknblj.supabase.co/functions/v1/property-ssr',
  fallbackTimeout: 3000, // 3 seconds before falling back to client-side rendering
  cacheTimeout: 300, // 5 minutes cache timeout
};

/**
 * Check if current request is from a bot/crawler
 */
export const isBotRequest = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const bots = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest/0.',
    'developers.google.com/+/web/snippet',
    'whatsapp',
    'telegram'
  ];
  
  return bots.some(bot => userAgent.includes(bot));
};

/**
 * Get the SSR URL for a property
 */
export const getSSRUrl = (propertyId: string): string => {
  return `${SSR_CONFIG.edgeFunctionUrl}/${propertyId}`;
};

/**
 * Check if SSR data is available in the window
 */
export const hasSSRData = (propertyId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const ssrData = (window as any).__PROPERTY_DATA__;
  return ssrData && ssrData.id === propertyId;
};

/**
 * Clean up SSR data from window
 */
export const cleanupSSRData = (): void => {
  if (typeof window !== 'undefined') {
    delete (window as any).__PROPERTY_DATA__;
  }
};

/**
 * Log SSR events for debugging
 */
export const logSSREvent = (event: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SSR] ${event}`, data);
  }
};
