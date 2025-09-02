
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

    console.log('Starting automatic cleanup of sold listings...');

    // Call the database function to cleanup sold listings
    const { data, error } = await supabase.rpc('cleanup_sold_listings');

    if (error) {
      console.error('Error cleaning up sold listings:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup sold listings', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully cleaned up sold listings');

    // Get the last cleanup timestamp
    const { data: lastCleanup } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'last_sold_cleanup')
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sold listings cleanup completed',
        lastCleanup: lastCleanup?.value || 'Unknown'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
