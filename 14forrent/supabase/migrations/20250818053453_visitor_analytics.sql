-- Create page_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create active_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON public.active_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON public.active_sessions(session_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous inserts to page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow anonymous updates to page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow admin reads of page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow anonymous inserts to active_sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow anonymous updates to active_sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow admin reads of active_sessions" ON public.active_sessions;

-- Create policies for page_views (allow insert for everyone, read for admins)
CREATE POLICY "Allow anonymous inserts to page_views" ON public.page_views
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous updates to page_views" ON public.page_views
    FOR UPDATE TO anon, authenticated
    USING (session_id = session_id)
    WITH CHECK (session_id = session_id);

CREATE POLICY "Allow admin reads of page_views" ON public.page_views
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE admin_roles.user_id = auth.uid()
        )
    );

-- Create policies for active_sessions
CREATE POLICY "Allow anonymous inserts to active_sessions" ON public.active_sessions
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous updates to active_sessions" ON public.active_sessions
    FOR UPDATE TO anon, authenticated
    USING (session_id = session_id)
    WITH CHECK (session_id = session_id);

CREATE POLICY "Allow admin reads of active_sessions" ON public.active_sessions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE admin_roles.user_id = auth.uid()
        )
    );

-- Create or replace the upsert_active_session function
CREATE OR REPLACE FUNCTION public.upsert_active_session(
    p_session_id TEXT,
    p_user_id UUID,
    p_ip_address TEXT,
    p_user_agent TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.active_sessions (session_id, user_id, ip_address, user_agent, last_activity)
    VALUES (p_session_id, p_user_id, p_ip_address, p_user_agent, NOW())
    ON CONFLICT (session_id) DO UPDATE
    SET 
        user_id = COALESCE(EXCLUDED.user_id, active_sessions.user_id),
        ip_address = COALESCE(EXCLUDED.ip_address, active_sessions.ip_address),
        user_agent = COALESCE(EXCLUDED.user_agent, active_sessions.user_agent),
        last_activity = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.upsert_active_session TO anon, authenticated;