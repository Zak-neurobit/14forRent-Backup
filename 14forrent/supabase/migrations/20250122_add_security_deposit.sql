-- Add security_deposit column to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10, 2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.listings.security_deposit IS 'Security deposit amount for the rental property';

-- Create index for better query performance when filtering by security deposit
CREATE INDEX IF NOT EXISTS idx_listings_security_deposit ON public.listings(security_deposit);