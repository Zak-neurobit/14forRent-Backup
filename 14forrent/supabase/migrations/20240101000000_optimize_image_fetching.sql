-- Create an optimized RPC function to fetch property with first image only
CREATE OR REPLACE FUNCTION get_property_with_first_image(property_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  location TEXT,
  address TEXT,
  description TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
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

-- Create a function to fetch remaining images separately
CREATE OR REPLACE FUNCTION get_property_images(property_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
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

-- Create index on listings.id if not exists for faster lookups
CREATE INDEX IF NOT EXISTS idx_listings_id ON listings(id);

-- Create index on listings.status for faster filtering
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);