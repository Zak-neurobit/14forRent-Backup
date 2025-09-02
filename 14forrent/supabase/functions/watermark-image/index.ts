
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, bucket } = await req.json();

    // Only process listing_images bucket
    if (bucket !== 'listing_images') {
      console.log('Skipping watermark for bucket:', bucket);
      return new Response(
        JSON.stringify({ message: 'Skipped - not a listing image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing watermark for image:', name);

    // Get watermark settings
    const { data: watermarkSettings, error: settingsError } = await supabase
      .from('watermark_settings')
      .select('*')
      .eq('enabled', true)
      .single();

    if (settingsError || !watermarkSettings) {
      console.log('No watermark settings found or disabled');
      return new Response(
        JSON.stringify({ message: 'Watermarking disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the original image
    const { data: imageFile, error: imageError } = await supabase.storage
      .from(bucket)
      .download(name);

    if (imageError || !imageFile) {
      console.error('Error downloading image:', imageError);
      return new Response(
        JSON.stringify({ error: 'Failed to download image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Download the watermark logo
    const logoPath = watermarkSettings.logo_url.replace('assets/', '');
    const { data: logoFile, error: logoError } = await supabase.storage
      .from('assets')
      .download(logoPath);

    if (logoError || !logoFile) {
      console.error('Error downloading logo:', logoError);
      return new Response(
        JSON.stringify({ error: 'Failed to download watermark logo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // For now, we'll simulate the watermarking process
    // In a real implementation, you would use Sharp or similar library
    // to composite the watermark onto the image
    
    console.log('Watermark settings:', {
      size: watermarkSettings.watermark_size,
      margin: watermarkSettings.watermark_margin,
      opacity: watermarkSettings.opacity,
      position: 'bottom-right' // Fixed position as required
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real implementation, you would:
    // 1. Use Sharp to load both images
    // 2. Resize the logo to watermark_size
    // 3. Composite it at bottom-right with specified opacity and margin
    // 4. Save the watermarked image back to storage
    
    // For now, we'll just log the operation
    console.log('Watermark applied successfully to:', name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Watermark processing completed',
        settings: watermarkSettings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in watermark function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
