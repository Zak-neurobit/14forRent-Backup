-- Comprehensive performance optimization for property detail pages
-- This migration creates optimized functions and indexes to reduce load times from 10+ seconds to <2 seconds

-- Drop existing functions if they exist to recreate with optimizations
DROP FUNCTION IF EXISTS get_property_with_first_image CASCADE;
DROP FUNCTION IF EXISTS get_property_images CASCADE;
DROP FUNCTION IF EXISTS get_property_optimized CASCADE;

-- Create the most optimized function that gets everything in one query
CREATE OR REPLACE FUNCTION get_property_optimized(property_id UUID)
RETURNS TABLE (
  -- Property fields
  id UUID,
  title TEXT,
  price NUMERIC,
  location TEXT,
  address TEXT,
  description TEXT,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  sqft INTEGER,
  amenities TEXT[],
  featured BOOLEAN,
  type TEXT,
  status TEXT,
  user_id UUID,
  youtube_url TEXT,
  video_id TEXT,
  is_short BOOLEAN,
  date_available DATE,
  laundry_type TEXT,
  parking_type TEXT,
  heating_type TEXT,
  rental_type TEXT,
  cat_friendly BOOLEAN,
  dog_friendly BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Optimized image fields
  first_image TEXT,
  image_count INTEGER,
  -- Contact info (joined in single query!)
  owner_email TEXT,
  owner_phone TEXT,
  owner_name TEXT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.price,
    l.location,
    l.address,
    l.description,
    l.bedrooms,
    l.bathrooms,
    l.sqft,
    l.amenities,
    l.featured,
    l.type,
    l.status,
    l.user_id,
    l.youtube_url,
    l.video_id,
    l.is_short,
    l.date_available,
    l.laundry_type,
    l.parking_type,
    l.heating_type,
    l.rental_type,
    l.cat_friendly,
    l.dog_friendly,
    l.created_at,
    l.updated_at,
    -- Get first image without loading entire array (TEXT[] array)
    CASE 
      WHEN l.images IS NOT NULL AND array_length(l.images, 1) > 0 
      THEN l.images[1]
      ELSE NULL
    END::TEXT as first_image,
    -- Get image count for UI display
    CASE 
      WHEN l.images IS NOT NULL 
      THEN array_length(l.images, 1)
      ELSE 0
    END::INTEGER as image_count,
    -- Join profile data in same query
    COALESCE(au.email, 'info@14ForRent.com') as owner_email,
    COALESCE(p.phone_number, '+1 323-774-4700') as owner_phone,
    COALESCE(p.display_name, p.first_name || ' ' || p.last_name, 'Property Manager') as owner_name
  FROM listings l
  LEFT JOIN auth.users au ON l.user_id = au.id
  LEFT JOIN profiles p ON l.user_id = p.id
  WHERE l.id = property_id
  LIMIT 1;
END;
$$;

-- Optimized function to get just the images array separately (for progressive loading)
CREATE OR REPLACE FUNCTION get_property_images_optimized(property_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  images_array TEXT[];
BEGIN
  SELECT images INTO images_array
  FROM listings
  WHERE id = property_id;
  
  RETURN images_array;
END;
$$;

-- Create function to get first N images (for initial gallery)
CREATE OR REPLACE FUNCTION get_property_images_preview(property_id UUID, limit_count INTEGER DEFAULT 3)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  images_array TEXT[];
  result TEXT[];
  i INTEGER;
BEGIN
  SELECT images INTO images_array
  FROM listings
  WHERE id = property_id;
  
  IF images_array IS NULL OR array_length(images_array, 1) IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Extract first N images
  result := ARRAY[]::TEXT[];
  FOR i IN 1..LEAST(limit_count, array_length(images_array, 1)) LOOP
    result := array_append(result, images_array[i]);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Recreate the simple first image function with better performance
CREATE OR REPLACE FUNCTION get_property_with_first_image(property_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  location TEXT,
  address TEXT,
  description TEXT,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  sqft INTEGER,
  amenities TEXT[],
  featured BOOLEAN,
  type TEXT,
  status TEXT,
  user_id UUID,
  first_image TEXT,
  youtube_url TEXT,
  video_id TEXT,
  is_short BOOLEAN,
  date_available DATE,
  laundry_type TEXT,
  parking_type TEXT,
  heating_type TEXT,
  rental_type TEXT,
  cat_friendly BOOLEAN,
  dog_friendly BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.price,
    l.location,
    l.address,
    l.description,
    l.bedrooms,
    l.bathrooms,
    l.sqft,
    l.amenities,
    l.featured,
    l.type,
    l.status,
    l.user_id,
    CASE 
      WHEN l.images IS NOT NULL AND array_length(l.images, 1) > 0 
      THEN l.images[1]
      ELSE NULL
    END as first_image,
    l.youtube_url,
    l.video_id,
    l.is_short,
    l.date_available,
    l.laundry_type,
    l.parking_type,
    l.heating_type,
    l.rental_type,
    l.cat_friendly,
    l.dog_friendly,
    l.created_at,
    l.updated_at
  FROM listings l
  WHERE l.id = property_id;
END;
$$;

-- Create materialized view for frequently accessed properties (refresh every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_properties_cache AS
SELECT 
  l.id,
  l.title,
  l.price,
  l.location,
  l.bedrooms,
  l.bathrooms,
  l.sqft,
  CASE 
    WHEN l.images IS NOT NULL AND array_length(l.images, 1) > 0 
    THEN l.images[1]
    ELSE NULL
  END as first_image,
  COUNT(lv.id) as view_count
FROM listings l
LEFT JOIN listing_views lv ON l.id = lv.listing_id
WHERE l.status != 'sold'
GROUP BY l.id
ORDER BY view_count DESC
LIMIT 50;

-- Create indexes for maximum performance
CREATE INDEX IF NOT EXISTS idx_listings_id_status ON listings(id, status);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Create partial index for active listings only
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(id) 
WHERE status != 'sold' AND status != 'inactive';

-- Create index on TEXT[] images array for faster access
CREATE INDEX IF NOT EXISTS idx_listings_images_gin ON listings USING GIN (images);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_property_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_optimized TO anon;
GRANT EXECUTE ON FUNCTION get_property_images_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_images_optimized TO anon;
GRANT EXECUTE ON FUNCTION get_property_images_preview TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_images_preview TO anon;
GRANT EXECUTE ON FUNCTION get_property_with_first_image TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_with_first_image TO anon;

GRANT SELECT ON popular_properties_cache TO authenticated;
GRANT SELECT ON popular_properties_cache TO anon;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_popular_properties()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_properties_cache;
END;
$$;

-- Schedule refresh (needs pg_cron extension or external scheduler)
-- This is a comment for manual setup:
-- SELECT cron.schedule('refresh-popular-properties', '0 * * * *', 'SELECT refresh_popular_properties();');