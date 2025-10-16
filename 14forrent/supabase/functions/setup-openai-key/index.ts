import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { apiKey, model, temperature, maxTokens, fixRLS, systemPrompt } = await req.json();

    // First, fix RLS policies if requested
    if (fixRLS) {
      console.log('Fixing RLS policies for ai_settings table...');

      const rlsSQL = `
        -- Enable RLS
        ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Admins can read ai_settings" ON ai_settings;
        DROP POLICY IF EXISTS "Admins can update ai_settings" ON ai_settings;
        DROP POLICY IF EXISTS "Admins can insert ai_settings" ON ai_settings;

        -- Policy 1: Admins can read ai_settings
        CREATE POLICY "Admins can read ai_settings"
          ON ai_settings FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid()
              AND user_roles.role = 'admin'
            )
          );

        -- Policy 2: Admins can update ai_settings
        CREATE POLICY "Admins can update ai_settings"
          ON ai_settings FOR UPDATE
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid()
              AND user_roles.role = 'admin'
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid()
              AND user_roles.role = 'admin'
            )
          );

        -- Policy 3: Admins can insert ai_settings
        CREATE POLICY "Admins can insert ai_settings"
          ON ai_settings FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid()
              AND user_roles.role = 'admin'
            )
          );
      `;

      try {
        await supabaseClient.rpc('exec_sql', { sql: rlsSQL });
        console.log('RLS policies updated successfully');
      } catch (rlsError) {
        console.log('Note: RLS update attempted, continuing with API key setup');
      }
    }

    console.log('Setting up OpenAI API key...');

    // Test the API key first
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid API key - OpenAI rejected the key'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('API key validated successfully');

    // Check if settings exist
    const { data: existingSettings, error: fetchError } = await supabaseClient
      .from('ai_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const settingsData = {
      openai_api_key: apiKey,
      model: model || 'gpt-4o-mini',
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens || 1000,
      ...(systemPrompt && { system_prompt: systemPrompt }),
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingSettings && !fetchError) {
      // Update existing record
      console.log('Updating existing AI settings');
      result = await supabaseClient
        .from('ai_settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .select();
    } else {
      // Insert new record
      console.log('Creating new AI settings record');
      result = await supabaseClient
        .from('ai_settings')
        .insert([{
          ...settingsData,
          created_at: new Date().toISOString()
        }])
        .select();
    }

    if (result.error) {
      console.error('Database error:', result.error);
      throw result.error;
    }

    console.log('API key saved successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'OpenAI API key configured successfully',
      settings: result.data[0]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
