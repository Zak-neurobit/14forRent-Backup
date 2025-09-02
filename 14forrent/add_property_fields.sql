-- Add new property detail fields to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS date_available DATE,
ADD COLUMN IF NOT EXISTS laundry_type TEXT,
ADD COLUMN IF NOT EXISTS parking_type TEXT,
ADD COLUMN IF NOT EXISTS heating_type TEXT,
ADD COLUMN IF NOT EXISTS rental_type TEXT,
ADD COLUMN IF NOT EXISTS cat_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dog_friendly BOOLEAN DEFAULT false;

-- Add indexes for better query performance on commonly filtered fields
CREATE INDEX IF NOT EXISTS idx_listings_date_available ON public.listings(date_available);
CREATE INDEX IF NOT EXISTS idx_listings_cat_friendly ON public.listings(cat_friendly);
CREATE INDEX IF NOT EXISTS idx_listings_dog_friendly ON public.listings(dog_friendly);
CREATE INDEX IF NOT EXISTS idx_listings_rental_type ON public.listings(rental_type);