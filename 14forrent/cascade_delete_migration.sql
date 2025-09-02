-- Migration to enable cascade deletion for listings
-- This ensures when a listing is deleted, all related data is also removed

-- Update favorites table foreign key to cascade on delete
ALTER TABLE public.favorites 
DROP CONSTRAINT IF EXISTS favorites_listing_id_fkey;

ALTER TABLE public.favorites
ADD CONSTRAINT favorites_listing_id_fkey 
FOREIGN KEY (listing_id) 
REFERENCES public.listings(id) 
ON DELETE CASCADE;

-- Update listing_views table foreign key to cascade on delete
ALTER TABLE public.listing_views
DROP CONSTRAINT IF EXISTS listing_views_listing_id_fkey;

ALTER TABLE public.listing_views
ADD CONSTRAINT listing_views_listing_id_fkey
FOREIGN KEY (listing_id) 
REFERENCES public.listings(id) 
ON DELETE CASCADE;

-- Update notifications table foreign key to cascade on delete
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_listing_id_fkey;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_listing_id_fkey
FOREIGN KEY (listing_id) 
REFERENCES public.listings(id) 
ON DELETE CASCADE;

-- Update property_images table foreign key to cascade on delete (if exists)
ALTER TABLE public.property_images
DROP CONSTRAINT IF EXISTS property_images_listing_id_fkey;

ALTER TABLE public.property_images
ADD CONSTRAINT property_images_listing_id_fkey
FOREIGN KEY (listing_id) 
REFERENCES public.listings(id) 
ON DELETE CASCADE;

-- Note: scheduled_showings already has ON DELETE CASCADE based on the existing migrations

-- Add a comment to the listings table about deletion behavior
COMMENT ON TABLE public.listings IS 'Main listings table. When a listing is deleted, all related data (favorites, views, notifications, images, showings) are automatically deleted via CASCADE.';

-- Create a function to clean up storage images before deletion
CREATE OR REPLACE FUNCTION delete_listing_storage_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion for audit purposes
  INSERT INTO public.audit_logs (action, table_name, record_id, user_id, details)
  VALUES ('DELETE', 'listings', OLD.id, auth.uid(), jsonb_build_object('title', OLD.title, 'images', OLD.images))
  ON CONFLICT DO NOTHING;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log deletions (optional - for audit trail)
DROP TRIGGER IF EXISTS log_listing_deletion ON public.listings;
CREATE TRIGGER log_listing_deletion
  BEFORE DELETE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION delete_listing_storage_images();

-- Create audit_logs table if it doesn't exist (for tracking deletions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Add RLS policy for audit logs (users can only see their own deletion logs)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);