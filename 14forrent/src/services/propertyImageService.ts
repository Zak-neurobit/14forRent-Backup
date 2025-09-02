import { supabase } from '@/integrations/supabase/client';
import { imageAltTextGenerator, ImageAltTextContext } from './ai/imageAltText';
import { Tables } from '@/integrations/supabase/types';

export type PropertyImage = Tables<'property_images'>;

export interface PropertyImageUpload {
  file: File;
  altText?: string;
  caption?: string;
  order?: number;
  isThumbnail?: boolean;
}

export interface PropertyImageWithAltText {
  id: string;
  image_url: string;
  alt_text: string;
  caption?: string;
  image_order: number;
  is_thumbnail: boolean;
  generated_by: string;
  confidence_score?: number;
}

export class PropertyImageService {
  
  /**
   * Upload property images with AI-generated alt text
   */
  async uploadPropertyImages(
    listingId: string,
    uploads: PropertyImageUpload[],
    propertyContext?: ImageAltTextContext
  ): Promise<PropertyImageWithAltText[]> {
    const results: PropertyImageWithAltText[] = [];
    
    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i];
      
      try {
        // Upload image to Supabase storage
        const fileName = `${listingId}/${Date.now()}_${upload.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property_images')
          .upload(fileName, upload.file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('property_images')
          .getPublicUrl(uploadData.path);

        // Use provided alt text or generate a simple fallback
        let altText = upload.altText;
        let generatedBy = 'user';
        let confidenceScore: number | undefined;

        if (!altText && propertyContext) {
          // Generate simple fallback alt text (no AI)
          altText = `${propertyContext.propertyType || 'Property'} image ${i + 1} - ${propertyContext.propertyLocation || 'rental listing'}`;
          generatedBy = 'fallback';
          confidenceScore = 0.5;
        } else if (!altText) {
          altText = `Property image ${i + 1}`;
          generatedBy = 'fallback';
          confidenceScore = 0.3;
        }

        // Get image dimensions and file info
        const imageDimensions = await this.getImageDimensions(upload.file);
        
        // Save to property_images table
        const { data: imageData, error: imageError } = await supabase
          .from('property_images')
          .insert([{
            listing_id: listingId,
            image_url: urlData.publicUrl,
            alt_text: altText,
            caption: upload.caption,
            image_order: upload.order ?? i,
            is_thumbnail: upload.isThumbnail ?? (i === 0),
            file_size: upload.file.size,
            width: imageDimensions.width,
            height: imageDimensions.height,
            format: upload.file.type,
            generated_by: generatedBy,
            confidence_score: confidenceScore
          }])
          .select()
          .single();

        if (imageError) {
          console.error('Error saving image metadata:', imageError);
          continue;
        }

        results.push({
          id: imageData.id,
          image_url: imageData.image_url,
          alt_text: imageData.alt_text || '',
          caption: imageData.caption || undefined,
          image_order: imageData.image_order,
          is_thumbnail: imageData.is_thumbnail || false,
          generated_by: imageData.generated_by || 'user',
          confidence_score: imageData.confidence_score || undefined
        });

      } catch (error) {
        console.error('Error processing image upload:', error);
      }
    }

    // Update the listing's images array for backward compatibility
    await this.updateListingImagesArray(listingId);

    return results;
  }

  /**
   * Get property images for a listing
   */
  async getPropertyImages(listingId: string): Promise<PropertyImageWithAltText[]> {
    const { data, error } = await supabase
      .from('property_images')
      .select('*')
      .eq('listing_id', listingId)
      .order('image_order', { ascending: true });

    if (error) {
      console.error('Error fetching property images:', error);
      return [];
    }

    return data.map(img => ({
      id: img.id,
      image_url: img.image_url,
      alt_text: img.alt_text || this.generateFallbackAltText(img.image_url),
      caption: img.caption || undefined,
      image_order: img.image_order,
      is_thumbnail: img.is_thumbnail || false,
      generated_by: img.generated_by || 'fallback',
      confidence_score: img.confidence_score || undefined
    }));
  }

  /**
   * Update alt text for existing image
   */
  async updateImageAltText(
    imageId: string,
    altText: string,
    generatedBy: string = 'user'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('property_images')
      .update({
        alt_text: altText,
        generated_by: generatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId);

    if (error) {
      console.error('Error updating alt text:', error);
      return false;
    }

    return true;
  }

  /**
   * Regenerate alt text for all images in a listing using AI
   */
  async regenerateAltText(
    listingId: string,
    propertyContext: ImageAltTextContext
  ): Promise<number> {
    const images = await this.getPropertyImages(listingId);
    let updatedCount = 0;

    for (const image of images) {
      try {
        const altResult = await imageAltTextGenerator.generateAltText(
          image.image_url,
          {
            ...propertyContext,
            imageIndex: image.image_order,
            totalImages: images.length
          }
        );

        const success = await this.updateImageAltText(
          image.id,
          altResult.altText,
          altResult.generatedBy
        );

        if (success) {
          updatedCount++;
        }

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error regenerating alt text for image:', image.id, error);
      }
    }

    return updatedCount;
  }

  /**
   * Delete property image
   */
  async deletePropertyImage(imageId: string): Promise<boolean> {
    // Get image info first
    const { data: imageData, error: fetchError } = await supabase
      .from('property_images')
      .select('image_url, listing_id')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      console.error('Error fetching image for deletion:', fetchError);
      return false;
    }

    // Delete from storage
    const urlParts = imageData.image_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const listingId = imageData.listing_id;
    const storagePath = `${listingId}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from('property_images')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return false;
    }

    // Update listing images array
    await this.updateListingImagesArray(listingId);

    return true;
  }

  /**
   * Update the listings table images array for backward compatibility
   */
  private async updateListingImagesArray(listingId: string): Promise<void> {
    const images = await this.getPropertyImages(listingId);
    const imageUrls = images.map(img => img.image_url);

    const { error } = await supabase
      .from('listings')
      .update({ images: imageUrls })
      .eq('id', listingId);

    if (error) {
      console.error('Error updating listing images array:', error);
    }
  }

  /**
   * Get image dimensions from file
   */
  private getImageDimensions(file: File): Promise<{width: number, height: number}> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate fallback alt text from image URL
   */
  private generateFallbackAltText(imageUrl: string): string {
    const fileName = imageUrl.split('/').pop() || '';
    return `Property image - ${fileName.replace(/\.[^/.]+$/, '')}`;
  }
}

// Export singleton instance
export const propertyImageService = new PropertyImageService();