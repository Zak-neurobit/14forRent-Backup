-- Performance optimization indexes for listings table
-- These indexes will significantly speed up common queries

-- Index for filtering by status (used in almost every query)
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);

-- Index for ordering by creation date (used for newest listings)
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

-- Index for featured properties
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(featured);

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);

-- Index for location searches
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);

-- Index for bedrooms filter
CREATE INDEX IF NOT EXISTS idx_listings_bedrooms ON public.listings(bedrooms);

-- Index for bathrooms filter
CREATE INDEX IF NOT EXISTS idx_listings_bathrooms ON public.listings(bathrooms);

-- Composite index for the most common query pattern (non-sold, ordered by date)
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON public.listings(status, created_at DESC) 
WHERE status != 'sold';

-- Composite index for featured non-sold properties
CREATE INDEX IF NOT EXISTS idx_listings_featured_status ON public.listings(featured, status, created_at DESC)
WHERE featured = true AND status != 'sold';

-- Index for full text search on title and description
CREATE INDEX IF NOT EXISTS idx_listings_title_gin ON public.listings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_gin ON public.listings USING gin(to_tsvector('english', description));

-- Analyze the table to update statistics for query planner
ANALYZE public.listings;

-- Create a materialized view for hot deals (can be refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS hot_deals_cache AS
SELECT 
  id, title, price, location, address, description, 
  bedrooms, bathrooms, sqft, images, amenities, 
  featured, type, status, created_at, updated_at
FROM public.listings
WHERE status != 'sold'
ORDER BY created_at DESC
LIMIT 100;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_hot_deals_cache_created ON hot_deals_cache(created_at DESC);

-- Function to refresh the cache (can be called periodically)
CREATE OR REPLACE FUNCTION refresh_hot_deals_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY hot_deals_cache;
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up automatic refresh every 5 minutes using pg_cron (if available)
-- SELECT cron.schedule('refresh-hot-deals', '*/5 * * * *', 'SELECT refresh_hot_deals_cache();');