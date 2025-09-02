# TODO: Fix RLS Policies for contact_submissions table

## Current Status
- RLS is currently DISABLED on contact_submissions table
- This allows the contact form to work but is not secure for production

## Required Fix
Need to create proper RLS policies that:
1. Allow anonymous users to INSERT contact submissions
2. Allow admins to view/manage all submissions  
3. Allow authenticated users to view their own submissions (by email)

## Suggested SQL
```sql
-- Re-enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public can insert" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins full access" ON public.contact_submissions;

-- Create new policies
CREATE POLICY "anon_insert_policy" ON public.contact_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "admin_all_policy" ON public.contact_submissions
  FOR ALL
  TO authenticated  
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_roles)
  );

CREATE POLICY "user_view_own_policy" ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );
```

## Testing Required
After implementing, test:
1. Anonymous user can submit contact form
2. Admin can view all submissions
3. Regular user can view their own submissions
4. Regular user cannot view others' submissions