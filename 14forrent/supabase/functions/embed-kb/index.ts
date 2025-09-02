
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching AI settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('id, knowledge_base, openai_api_key')
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!settings?.knowledge_base || settings.knowledge_base.trim() === '') {
      console.log('No knowledge base content found');
      return new Response(JSON.stringify({ message: 'No knowledge base content to embed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing knowledge base content...');
    
    // Split knowledge base into chunks
    const chunkSize = 1000;
    const overlap = 200;
    const text = settings.knowledge_base;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.slice(i, i + chunkSize);
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }

    console.log(`Created ${chunks.length} chunks from knowledge base`);

    // Generate embeddings using OpenAI
    const openaiApiKey = settings.openai_api_key || Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const vectors = [];
    for (const chunk of chunks) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: chunk,
            model: 'text-embedding-3-small'
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const embeddingData = await response.json();
        vectors.push({
          content: chunk,
          embedding: embeddingData.data[0].embedding
        });
      } catch (error) {
        console.error('Error generating embedding:', error);
        continue;
      }
    }

    console.log(`Generated ${vectors.length} embeddings`);

    // Clear existing chunks
    const { error: deleteError } = await supabase
      .from('kb_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing kb_chunks:', deleteError);
    }

    // Insert new chunks
    if (vectors.length > 0) {
      const { error: insertError } = await supabase
        .from('kb_chunks')
        .insert(vectors);

      if (insertError) {
        console.error('Error inserting chunks:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to insert embeddings' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Update embeddings_updated flag
    const { error: updateError } = await supabase
      .from('ai_settings')
      .update({ embeddings_updated: true })
      .eq('id', settings.id);

    if (updateError) {
      console.error('Error updating embeddings flag:', updateError);
    }

    console.log('Knowledge base embedding completed successfully');
    return new Response(JSON.stringify({ 
      message: 'Knowledge base embedded successfully',
      chunks: vectors.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in embed-kb function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
