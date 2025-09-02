import { supabase } from "@/integrations/supabase/client";

/**
 * Normalizes image URLs to ensure they work correctly across the app
 * Handles relative paths, full URLs, and various edge cases
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg';
  
  // Remove any leading/trailing whitespace
  const trimmed = url.trim();
  
  // If it's already a full URL, return it
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // If it's a placeholder or local asset, return as-is
  if (trimmed.startsWith('/placeholder') || trimmed.startsWith('/assets')) {
    return trimmed;
  }
  
  // If it's a relative path, convert to full Supabase URL
  // The path should be something like: df1f5b87-fb01-483c-ab03-3622aa8d6a71/1754335215501-3a174evw7vp.webp
  const { data } = supabase.storage
    .from('property_images')
    .getPublicUrl(trimmed);
  
  return data?.publicUrl || '/placeholder.svg';
}

/**
 * Normalizes an array of image URLs
 */
export function normalizeImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(url => normalizeImageUrl(url));
}

/**
 * Gets the Supabase storage URL for a given path
 * This is a direct URL construction without using the SDK
 */
export function getSupabaseImageUrl(path: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('Supabase URL not configured');
    return '/placeholder.svg';
  }
  
  // Ensure we have a valid path
  if (!path || path.trim() === '') {
    return '/placeholder.svg';
  }
  
  // Remove any leading slashes
  const cleanPath = path.replace(/^\/+/, '');
  
  // Construct the full URL
  return `${supabaseUrl}/storage/v1/object/public/property_images/${cleanPath}`;
}