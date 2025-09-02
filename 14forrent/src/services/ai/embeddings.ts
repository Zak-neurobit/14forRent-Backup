
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates an embedding for a listing to enable semantic search
 */
export const embedListing = async (listingId: string) => {
  try {
    // Get the listing data
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, description, location, amenities')
      .eq('id', listingId)
      .single();
    
    if (listingError || !listing) {
      console.error("Error fetching listing for embedding:", listingError);
      return { success: false, error: listingError };
    }

    // Get API settings
    const { data: apiKeyData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'openai_api_key')
      .single();

    if (!apiKeyData?.value) {
      console.error("OpenAI API key not found");
      return { success: false, error: "API key not configured" };
    }

    // Create content to embed
    const contentToEmbed = `
      Title: ${listing.title}
      Location: ${listing.location}
      Description: ${listing.description}
      Amenities: ${listing.amenities.join(', ')}
    `.trim();

    // Get embedding from OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyData.value}`
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: contentToEmbed
      })
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json();
      console.error("OpenAI API error:", errorData);
      return { success: false, error: errorData };
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Update the listing with the embedding
    const { error: updateError } = await supabase
      .from('listings')
      .update({ embedding })
      .eq('id', listingId);

    if (updateError) {
      console.error("Error updating listing with embedding:", updateError);
      return { success: false, error: updateError };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in embedListing:", error);
    return { success: false, error };
  }
};
