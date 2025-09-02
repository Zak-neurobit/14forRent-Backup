
import { supabase } from "@/integrations/supabase/client";

interface PropertyDetails {
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  imageDescriptions?: string[];
}

export const generatePropertyDescription = async (propertyDetails: PropertyDetails): Promise<string> => {
  try {
    // Get API key from AI settings table
    const { data: aiSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('openai_api_key')
      .limit(1)
      .maybeSingle();

    if (settingsError || !aiSettings?.openai_api_key) {
      console.error("Failed to get OpenAI API key from AI settings:", settingsError);
      throw new Error("OpenAI API key not configured in AI settings. Please set it up in the admin panel.");
    }

    const openAiKey = aiSettings.openai_api_key;

    // Get model preference from AI settings, or default to gpt-4o-mini
    const { data: modelSettings } = await supabase
      .from('ai_settings')
      .select('model')
      .limit(1)
      .maybeSingle();

    const model = modelSettings?.model || 'gpt-4o-mini';

    // Prepare image descriptions if available
    const imageSection = propertyDetails.imageDescriptions && propertyDetails.imageDescriptions.length > 0
      ? `\n\nThe property has the following visual features:\n${propertyDetails.imageDescriptions.join('\n')}`
      : "";

    // Create a prompt for the description
    const prompt = `
    Create an engaging, professional real estate description for the following property:
    
    Property: ${propertyDetails.title}
    Location: ${propertyDetails.location}
    Price: $${propertyDetails.price}/month
    Bedrooms: ${propertyDetails.bedrooms}
    Bathrooms: ${propertyDetails.bathrooms}
    Amenities: ${propertyDetails.amenities.join(', ')}
    ${imageSection}
    
    The description should be engaging, highlight the best features of the property, and be around 150-200 words. 
    Focus on the property's uniqueness, location benefits, and amenities. 
    Use persuasive but professional language that would appeal to potential renters.
    `;

    console.log("Sending to OpenAI:", { model, prompt });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional real estate copywriter who creates compelling property descriptions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log("OpenAI response:", data);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in generatePropertyDescription:', error);
    if (error instanceof Error && error.message.includes('API key not configured')) {
      return "OpenAI API key not configured in AI settings. Please set it up in the admin panel to use AI description generation.";
    }
    return "Unable to generate AI description. Please write your own or try again later.";
  }
};
