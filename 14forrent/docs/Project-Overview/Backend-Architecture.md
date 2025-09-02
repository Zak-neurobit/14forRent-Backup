
# Backend Architecture

## Overview
The backend infrastructure is built on Supabase, providing a complete Backend-as-a-Service (BaaS) solution with PostgreSQL database, authentication, real-time subscriptions, and edge functions.

## Database Architecture

### Database Schema Design

#### Core Tables

**1. listings** - Central property listing table
```sql
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'available',
  embedding VECTOR(1536), -- For AI search
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**2. profiles** - Extended user profile information
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**3. scheduled_showings** - Property tour scheduling
```sql
CREATE TABLE public.scheduled_showings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  user_id UUID REFERENCES auth.users(id),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**4. favorites** - User favorite properties
```sql
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id UUID NOT NULL REFERENCES listings(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
```

#### Advanced Tables

**5. user_roles** - Role-based access control
```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
```

**6. ai_settings** - AI configuration management
```sql
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openai_api_key TEXT,
  model TEXT DEFAULT 'gpt-4o-mini',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1024,
  system_prompt TEXT,
  knowledge_base TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**7. kb_chunks** - Knowledge base for AI
```sql
CREATE TABLE public.kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS) Policies

#### Listings Security
```sql
-- Users can manage their own listings
CREATE POLICY "Users can manage own listings" ON listings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Everyone can view available listings
CREATE POLICY "Anyone can view listings" ON listings
  FOR SELECT USING (true);

-- Admins can manage all listings
CREATE POLICY "Admins can manage all listings" ON listings
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());
```

#### User Management Security
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

## Database Functions

### Admin Functions
```sql
-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
END;
$$;

-- Get all users (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE(id UUID, email TEXT, last_sign_in_at TIMESTAMPTZ, created_at TIMESTAMPTZ, is_active BOOLEAN, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT au.id, au.email, au.last_sign_in_at, au.created_at,
         COALESCE((au.raw_user_meta_data->>'is_active')::boolean, true) as is_active,
         COALESCE((au.raw_user_meta_data->>'role')::text, 'user') as role
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;
```

### AI Search Functions
```sql
-- Vector similarity search for listings
CREATE OR REPLACE FUNCTION public.match_listings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  match_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  price NUMERIC,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  amenities TEXT[],
  images TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.title, l.description, l.location, l.price,
         l.bedrooms, l.bathrooms, l.amenities, l.images,
         1 - (l.embedding <=> query_embedding) as similarity
  FROM listings l
  WHERE l.embedding IS NOT NULL 
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count
  OFFSET match_offset;
END;
$$;
```

## Authentication Architecture

### Supabase Auth Integration
```javascript
// Authentication configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### User Registration Flow
1. User signs up via Supabase Auth
2. Trigger creates profile record in `profiles` table
3. Default user role assigned in `user_roles` table
4. Email verification sent (if configured)

### Admin Role Management
```sql
-- Trigger to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, display_name, first_name, last_name)
  VALUES (NEW.id, 
          COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
          NEW.raw_user_meta_data->>'first_name',
          NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$$;
```

## Edge Functions Architecture

### 1. AI Chat Function (`chatbot`)
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { message, context } = await req.json();
  
  // Process AI chat request
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]
  });
  
  return new Response(JSON.stringify({
    response: response.choices[0].message.content
  }));
});
```

### 2. Image Watermarking (`watermark-image`)
```typescript
// Automatically watermarks uploaded property images
serve(async (req) => {
  const { bucket, path } = await req.json();
  
  // Download image from storage
  const { data: imageData } = await supabase.storage
    .from(bucket)
    .download(path);
  
  // Apply watermark
  const watermarkedImage = await applyWatermark(imageData);
  
  // Upload watermarked version
  await supabase.storage
    .from(bucket)
    .upload(`watermarked/${path}`, watermarkedImage, {
      upsert: true
    });
});
```

### 3. Property SSR (`property-ssr`)
```typescript
// Server-side rendering for property pages (SEO)
serve(async (req) => {
  const url = new URL(req.url);
  const propertyId = url.pathname.split('/').pop();
  
  // Fetch property data
  const { data: property } = await supabase
    .from('listings')
    .select('*')
    .eq('id', propertyId)
    .single();
  
  // Generate HTML with meta tags
  const html = generatePropertyHTML(property);
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
});
```

## Storage Architecture

### Bucket Organization
```
storage/
├── property_images/     # Property listing images
├── blog_images/         # Blog post images
├── assets/              # General site assets
└── user_avatars/        # User profile pictures
```

### Image Processing Pipeline
1. **Upload**: Images uploaded to `property_images` bucket
2. **Trigger**: Storage trigger calls `watermark-image` function
3. **Processing**: Function applies watermark and optimization
4. **Storage**: Processed images stored with original filenames
5. **Cleanup**: Optional cleanup of original unwatermarked images

## Real-time Features

### Supabase Realtime Integration
```javascript
// Real-time property status updates
const channel = supabase
  .channel('property-status-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'listings',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Handle real-time updates
    handlePropertyStatusChange(payload);
  })
  .subscribe();
```

### Notification System
```javascript
// Real-time notifications for property owners
useEffect(() => {
  const subscription = supabase
    .channel(`notifications-${user.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'scheduled_showings',
      filter: `listing_id=in.(${userListingIds.join(',')})`
    }, (payload) => {
      toast.success(`New showing scheduled for ${payload.new.listing_title}`);
    })
    .subscribe();
}, [user, userListingIds]);
```

## Performance Optimizations

### Database Optimizations
1. **Indexes**: Strategic indexes on frequently queried columns
2. **Vector Indexes**: HNSW indexes for embedding similarity search
3. **Materialized Views**: For complex reporting queries
4. **Connection Pooling**: Supabase handles connection pooling automatically

### Caching Strategy
1. **Browser Cache**: Static assets cached with long TTL
2. **CDN Cache**: Supabase CDN for global content delivery
3. **Application Cache**: React Query for API response caching
4. **Database Cache**: PostgreSQL query result caching

### Security Measures
1. **RLS Policies**: Comprehensive row-level security
2. **API Rate Limiting**: Supabase built-in rate limiting
3. **Input Validation**: Server-side validation for all inputs
4. **SQL Injection Prevention**: Parameterized queries only
5. **CORS Configuration**: Proper CORS headers for security

This backend architecture provides a scalable, secure, and performant foundation for the rental property platform with modern serverless patterns and comprehensive data management.
