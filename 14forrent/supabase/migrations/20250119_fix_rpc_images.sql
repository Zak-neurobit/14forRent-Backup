-- Fix RPC functions to include full images array and resolve type mismatches
-- This ensures all property images are loaded properly

-- Drop existing functions
DROP FUNCTION IF EXISTS get_property_optimized CASCADE;
DROP FUNCTION IF EXISTS get_property_with_first_image CASCADE;

-- Create improved get_property_with_images function that includes full images array
CREATE OR REPLACE FUNCTION get_property_with_images(property_id UUID)
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
  images TEXT[],  -- Full images array
  first_image TEXT,  -- First image for quick loading
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
    l.images,  -- Return full images array
    CASE 
      WHEN l.images IS NOT NULL AND array_length(l.images, 1) > 0 
      THEN l.images[1]
      ELSE NULL
    END::TEXT as first_image,
    l.youtube_url,
    l.video_id,
    l.is_short,
    l.date_available,
    l.laundry_type::TEXT,  -- Ensure TEXT type
    l.parking_type::TEXT,  -- Ensure TEXT type
    l.heating_type::TEXT,  -- Ensure TEXT type
    l.rental_type::TEXT,   -- Ensure TEXT type
    l.cat_friendly,
    l.dog_friendly,
    l.created_at,
    l.updated_at
  FROM listings l
  WHERE l.id = property_id
  LIMIT 1;
END;
$$;

-- Create optimized function with owner info and images
CREATE OR REPLACE FUNCTION get_property_optimized(property_id UUID)
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
  images TEXT[],  -- Full images array
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
  updated_at TIMESTAMPTZ,
  image_count INTEGER,
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
    l.images,  -- Return full images array
    CASE 
      WHEN l.images IS NOT NULL AND array_length(l.images, 1) > 0 
      THEN l.images[1]
      ELSE NULL
    END::TEXT as first_image,
    l.youtube_url,
    l.video_id,
    l.is_short,
    l.date_available,
    l.laundry_type::TEXT,  -- Cast to TEXT to avoid type mismatch
    l.parking_type::TEXT,  -- Cast to TEXT to avoid type mismatch
    l.heating_type::TEXT,  -- Cast to TEXT to avoid type mismatch
    l.rental_type::TEXT,   -- Cast to TEXT to avoid type mismatch
    l.cat_friendly,
    l.dog_friendly,
    l.created_at,
    l.updated_at,
    CASE 
      WHEN l.images IS NOT NULL 
      THEN array_length(l.images, 1)
      ELSE 0
    END::INTEGER as image_count,
    COALESCE(au.email, 'info@14ForRent.com')::TEXT as owner_email,
    COALESCE(p.phone_number, '+1 323-774-4700')::TEXT as owner_phone,
    COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name), 'Property Manager')::TEXT as owner_name
  FROM listings l
  LEFT JOIN auth.users au ON l.user_id = au.id
  LEFT JOIN profiles p ON l.user_id = p.id
  WHERE l.id = property_id
  LIMIT 1;
END;
$$;

-- Create alias for backward compatibility
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
  images TEXT[],  -- Now includes full images array
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
AS $$
BEGIN
  -- Simply call the new function with images
  RETURN QUERY
  SELECT * FROM get_property_with_images(property_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_property_with_images TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_property_optimized TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_property_with_first_image TO anon, authenticated;