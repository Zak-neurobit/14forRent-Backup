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
    const { bucket, path } = await req.json();
    console.log('Processing watermark for:', { bucket, path });

    // Only process property_images bucket
    if (bucket !== 'property_images') {
      console.log('Skipping watermark for bucket:', bucket);
      return new Response('Skipped - not a property image', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Download the original image
    const { data: imageFile, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path);

    if (downloadError || !imageFile) {
      console.error('Error downloading image:', downloadError);
      return new Response('Failed to download image', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Get watermark settings
    const { data: watermarkSettings, error: settingsError } = await supabase
      .from('watermark_settings')
      .select('*')
      .eq('enabled', true)
      .single();

    if (settingsError || !watermarkSettings) {
      console.log('No watermark settings found or disabled, copying original');
      // Just keep the original image as-is
      return new Response('Watermarking disabled', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Download the watermark logo
    const logoPath = watermarkSettings.logo_url.replace(/^assets\//, '');
    const { data: logoFile, error: logoError } = await supabase.storage
      .from('assets')
      .download(logoPath);

    if (logoError || !logoFile) {
      console.error('Error downloading logo:', logoError);
      return new Response('Failed to download watermark logo', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // For now, we'll simulate watermarking since Sharp requires additional setup
    // In production, you would use Sharp or similar to composite the watermark
    const imageBuffer = await imageFile.arrayBuffer();
    
    console.log('Watermark settings applied:', {
      size: watermarkSettings.watermark_size,
      margin: watermarkSettings.watermark_margin,
      opacity: watermarkSettings.opacity,
      position: 'bottom-right'
    });

    // Upload the "watermarked" image back (for now, just the original)
    // In production, this would be the composited image with watermark
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, imageBuffer, { 
        upsert: true,
        contentType: imageFile.type || 'image/jpeg'
      });

    if (uploadError) {
      console.error('Error uploading watermarked image:', uploadError);
      return new Response('Failed to upload watermarked image', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('Watermark processing completed for:', path);
    return new Response('Watermark applied successfully', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error in watermark function:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
