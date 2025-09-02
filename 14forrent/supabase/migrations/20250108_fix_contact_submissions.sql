-- Create contact_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  property_id TEXT,
  property_title TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'archived')),
  notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON public.contact_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.contact_submissions;

-- Create RLS Policies
-- Policy 1: Admins can view and manage all submissions
CREATE POLICY "Admins can view all submissions" ON public.contact_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

-- Policy 2: Anyone can insert submissions (including anonymous users)
CREATE POLICY "Anyone can insert submissions" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

-- Policy 3: Logged-in users can view their own submissions
CREATE POLICY "Users can view their own submissions" ON public.contact_submissions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON public.contact_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_submissions TO authenticated;

-- Grant permissions to anon users for inserting
GRANT INSERT ON public.contact_submissions TO anon;

-- Add comment for clarity
COMMENT ON TABLE public.contact_submissions IS 'Stores contact form submissions from users';