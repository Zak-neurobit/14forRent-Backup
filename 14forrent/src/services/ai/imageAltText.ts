import { supabase } from '@/integrations/supabase/client';

export interface ImageAltTextContext {
  propertyTitle?: string;
  propertyLocation?: string;
  propertyType?: string;
  propertyPrice?: number;
  propertyBedrooms?: number;
  propertyBathrooms?: number;
  propertyAmenities?: string[];
  imageIndex?: number;
  totalImages?: number;
}

export interface ImageAltTextResult {
  altText: string;
  confidence: number;
  generatedBy: 'ai' | 'fallback';
}

/**
 * Generates SEO-optimized alt text for property images using OpenAI Vision API
 */
export class ImageAltTextGenerator {
  private openaiApiKey: string | null = null;

  constructor() {
    this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('openai_api_key')
        .limit(1)
        .single();

      if (error || !data?.openai_api_key) {
        console.warn('OpenAI API key not found in ai_settings');
        return;
      }

      this.openaiApiKey = data.openai_api_key;
    } catch (error) {
      console.error('Error loading OpenAI API key:', error);
    }
  }

  /**
   * Generate alt text for an image using OpenAI Vision API
   */
  async generateAltText(
    imageFile: File | string,
    context: ImageAltTextContext = {}
  ): Promise<ImageAltTextResult> {
    // If no API key, use fallback
    if (!this.openaiApiKey) {
      await this.loadApiKey();
      if (!this.openaiApiKey) {
        return this.generateFallbackAltText(context);
      }
    }

    try {
      // Convert image to base64 if it's a File
      let imageBase64: string;
      if (imageFile instanceof File) {
        imageBase64 = await this.fileToBase64(imageFile);
      } else {
        // If it's a URL, we'll use it directly
        imageBase64 = imageFile;
      }

      const prompt = this.createPrompt(context);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageFile instanceof File ? 
                      `data:image/jpeg;base64,${imageBase64}` : 
                      imageBase64,
                    detail: 'low' // Use low detail for faster processing
                  }
                }
              ]
            }
          ],
          max_tokens: 100,
          temperature: 0.3 // Lower temperature for more consistent, factual descriptions
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const altText = data.choices[0]?.message?.content?.trim();

      if (!altText) {
        throw new Error('No alt text generated from OpenAI');
      }

      return {
        altText,
        confidence: 0.9,
        generatedBy: 'ai'
      };

    } catch (error) {
      console.error('Error generating AI alt text:', error);
      return this.generateFallbackAltText(context);
    }
  }

  /**
   * Create a context-aware prompt for alt text generation
   */
  private createPrompt(context: ImageAltTextContext): string {
    const basePrompt = "Generate a concise, SEO-friendly alt text (max 125 characters) for this property image. Focus on what's visible in the image.";
    
    let contextPrompt = "";
    
    if (context.propertyTitle || context.propertyLocation) {
      contextPrompt += `\n\nProperty context:`;
      if (context.propertyTitle) contextPrompt += `\n- Title: ${context.propertyTitle}`;
      if (context.propertyLocation) contextPrompt += `\n- Location: ${context.propertyLocation}`;
      if (context.propertyType) contextPrompt += `\n- Type: ${context.propertyType}`;
      if (context.propertyBedrooms) contextPrompt += `\n- Bedrooms: ${context.propertyBedrooms}`;
      if (context.propertyBathrooms) contextPrompt += `\n- Bathrooms: ${context.propertyBathrooms}`;
    }

    const instructions = `\n\nInstructions:
- Describe what you see in the image (room type, features, style)
- Include property location if relevant
- Keep it under 125 characters
- Make it descriptive but natural
- Don't use promotional language
- Focus on features visible in the image

Example: "Modern kitchen with stainless steel appliances and granite countertops in Downtown LA apartment"

Return only the alt text, no quotes or extra text.`;

    return basePrompt + contextPrompt + instructions;
  }

  /**
   * Generate fallback alt text when AI is not available
   */
  private generateFallbackAltText(context: ImageAltTextContext): ImageAltTextResult {
    let altText = '';

    // Build descriptive alt text from context
    if (context.propertyType && context.propertyLocation) {
      altText = `${context.propertyType} interior in ${context.propertyLocation}`;
    } else if (context.propertyTitle) {
      altText = `Property image - ${context.propertyTitle}`;
    } else if (context.propertyLocation) {
      altText = `Property image in ${context.propertyLocation}`;
    } else {
      altText = 'Property image';
    }

    // Add image index if available
    if (context.imageIndex !== undefined && context.totalImages !== undefined) {
      altText += ` (${context.imageIndex + 1} of ${context.totalImages})`;
    }

    return {
      altText,
      confidence: 0.6,
      generatedBy: 'fallback'
    };
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate alt text for multiple images in batch
   */
  async generateBatchAltText(
    images: { file: File; context?: ImageAltTextContext }[]
  ): Promise<ImageAltTextResult[]> {
    const results: ImageAltTextResult[] = [];
    
    // Process images sequentially to avoid rate limits
    for (let i = 0; i < images.length; i++) {
      const { file, context = {} } = images[i];
      const enhancedContext = {
        ...context,
        imageIndex: i,
        totalImages: images.length
      };
      
      const result = await this.generateAltText(file, enhancedContext);
      results.push(result);
      
      // Add small delay between requests to avoid rate limits
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const imageAltTextGenerator = new ImageAltTextGenerator();