-- Temporarily disable RLS to allow submissions
ALTER TABLE public.contact_submissions DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON public.contact_submissions TO anon;
GRANT ALL ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO public;