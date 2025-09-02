-- Add security_deposit column to listings table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10, 2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.listings.security_deposit IS 'Security deposit amount for the rental property';

-- Create index for better query performance when filtering by security deposit
CREATE INDEX IF NOT EXISTS idx_listings_security_deposit ON public.listings(security_deposit);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'listings' 
  AND column_name = 'security_deposit';