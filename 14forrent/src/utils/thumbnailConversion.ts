import imageCompression from 'browser-image-compression';

/**
 * Convert an image to JPEG format for social media preview compatibility
 * This runs in the background when saving a listing
 */
export const convertToJPEGForSocialPreview = async (
  imageUrl: string,
  quality: number = 0.85
): Promise<Blob> => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Create a File object from the blob
    const file = new File([blob], 'thumbnail.jpg', { type: blob.type });
    
    // Convert to JPEG with good quality for social media
    const options = {
      maxSizeMB: 0.8, // 800KB max for social media
      maxWidthOrHeight: 1200, // Good resolution for social previews
      quality: quality,
      fileType: 'image/jpeg', // Force JPEG output
      useWebWorker: true
    };
    
    const jpegFile = await imageCompression(file, options);
    return jpegFile;
  } catch (error) {
    console.error('Error converting image to JPEG:', error);
    throw error;
  }
};

/**
 * Upload JPEG thumbnail to Supabase storage
 */
export const uploadJPEGThumbnail = async (
  jpegBlob: Blob,
  listingId: string,
  originalImagePath: string
): Promise<string> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Create a unique filename for the JPEG version
    const timestamp = Date.now();
    const jpegFileName = `${listingId}/social_preview_${timestamp}.jpg`;
    
    // Upload to a special folder for social media previews
    const { data, error } = await supabase.storage
      .from('property_images')
      .upload(jpegFileName, jpegBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading JPEG thumbnail:', error);
      throw error;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('property_images')
      .getPublicUrl(jpegFileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading JPEG thumbnail:', error);
    throw error;
  }
};

/**
 * Process thumbnail for social media preview
 * This is called in the background when saving a listing
 */
export const processThumbnailForSocialMedia = async (
  thumbnailUrl: string,
  listingId: string
): Promise<string | null> => {
  try {
    console.log('Processing thumbnail for social media preview...');
    
    // Skip if already a JPEG
    if (thumbnailUrl.toLowerCase().includes('.jpg') || 
        thumbnailUrl.toLowerCase().includes('.jpeg')) {
      console.log('Thumbnail is already JPEG, skipping conversion');
      return thumbnailUrl;
    }
    
    // Convert WebP to JPEG
    const jpegBlob = await convertToJPEGForSocialPreview(thumbnailUrl);
    
    // Upload the JPEG version
    const jpegUrl = await uploadJPEGThumbnail(
      jpegBlob,
      listingId,
      thumbnailUrl
    );
    
    console.log('JPEG thumbnail created for social media:', jpegUrl);
    return jpegUrl;
  } catch (error) {
    console.error('Failed to process thumbnail for social media:', error);
    // Return null on failure - the WebP will still work for the website
    return null;
  }
};