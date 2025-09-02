-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_property_optimized CASCADE;

-- Create optimized function that fetches property with limited images for fast initial load
CREATE OR REPLACE FUNCTION get_property_optimized(
  property_id UUID,
  image_limit INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  location TEXT,
  address TEXT,
  description TEXT,
  bedrooms INT,
  bathrooms INT,
  sqft INT,
  amenities TEXT[],
  featured BOOLEAN,
  type TEXT,
  status TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
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
  security_deposit NUMERIC,
  initial_images TEXT[],
  total_image_count INT
)
LANGUAGE plpgsql
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
    l.created_at,
    l.updated_at,
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
    l.security_deposit,
    -- Get only first N images for initial load
    ARRAY(
      SELECT unnest(l.images) 
      LIMIT image_limit
    ) as initial_images,
    -- Return total count so UI knows how many images exist
    COALESCE(array_length(l.images, 1), 0) as total_image_count
  FROM listings l
  WHERE l.id = property_id
  LIMIT 1;
END;
$$;

-- Create function to fetch remaining images (called after initial page load)
CREATE OR REPLACE FUNCTION get_property_remaining_images(
  property_id UUID,
  offset_num INT DEFAULT 3
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  all_images TEXT[];
BEGIN
  SELECT images INTO all_images
  FROM listings
  WHERE id = property_id;
  
  IF all_images IS NULL OR array_length(all_images, 1) IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Return images starting from offset
  RETURN ARRAY(
    SELECT unnest(all_images) 
    OFFSET offset_num
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_property_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_optimized TO anon;
GRANT EXECUTE ON FUNCTION get_property_remaining_images TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_remaining_images TO anon;

-- Create index for faster property lookups if not exists
CREATE INDEX IF NOT EXISTS idx_listings_id ON listings(id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);