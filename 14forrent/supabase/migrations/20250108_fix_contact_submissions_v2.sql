-- Drop existing table if it exists
DROP TABLE IF EXISTS public.contact_submissions CASCADE;

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
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
  responded_by UUID
);

-- Create indexes for better performance
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_submissions_submitted_at ON public.contact_submissions(submitted_at DESC);
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Policy 1: Anyone can insert submissions (including anonymous users)
CREATE POLICY "Anyone can insert submissions" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

-- Policy 2: Admins can view and manage all submissions
CREATE POLICY "Admins can manage all submissions" ON public.contact_submissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_roles
    )
  );

-- Policy 3: Logged-in users can view their own submissions
CREATE POLICY "Users can view their own submissions" ON public.contact_submissions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text IN (
      SELECT id::text FROM auth.users WHERE email = contact_submissions.email
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.contact_submissions TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Add comment for clarity
COMMENT ON TABLE public.contact_submissions IS 'Stores contact form submissions from users';