-- Create an optimized function to get only the first image from listings
-- This is MUCH faster than fetching the entire images array
CREATE OR REPLACE FUNCTION get_first_image(listing_id UUID)
RETURNS TABLE(first_image TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT images[1] as first_image
  FROM listings
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_first_image TO authenticated;
GRANT EXECUTE ON FUNCTION get_first_image TO anon;

-- Create an index on listings.id if not exists for faster lookups
CREATE INDEX IF NOT EXISTS idx_listings_id ON listings(id);

-- Create a composite index for common property queries
CREATE INDEX IF NOT EXISTS idx_listings_property_query 
ON listings(id, title, price, location, bedrooms, bathrooms, user_id);