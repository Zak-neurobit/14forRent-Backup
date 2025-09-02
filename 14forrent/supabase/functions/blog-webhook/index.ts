
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const { title, image, content, published = false, slug } = await req.json()

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate slug if not provided
    let finalSlug = slug || generateSlug(title)

    // Check if slug already exists and make it unique if needed
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('slug', finalSlug)
      .single()

    if (existingPost) {
      const timestamp = Date.now()
      finalSlug = `${finalSlug}-${timestamp}`
    }

    // Get a default author (first admin user)
    const { data: adminUser, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (adminError || !adminUser) {
      console.error('No admin user found:', adminError)
      return new Response(
        JSON.stringify({ error: 'No admin user available to create blog post' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create the blog post
    const { data: blogPost, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        content,
        image_url: image || null,
        published: published === true,
        slug: finalSlug,
        author_id: adminUser.user_id
      })
      .select('id, published, slug')
      .single()

    if (error) {
      console.error('Error creating blog post:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create blog post' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        id: blogPost.id,
        slug: blogPost.slug,
        status: blogPost.published ? 'published' : 'draft'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in blog-webhook function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
