    -- Visitor Analytics Tables Migration
    -- Created: 2025-08-05

    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Table for tracking page views
    CREATE TABLE IF NOT EXISTS page_views (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id text NOT NULL,
        user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
        page_path text NOT NULL,
        user_agent text,
        ip_address inet,
        referrer text,
        created_at timestamptz DEFAULT now()
    );

    -- Table for tracking active sessions
    CREATE TABLE IF NOT EXISTS active_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id text UNIQUE NOT NULL,
        user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
        last_activity timestamptz DEFAULT now(),
        ip_address inet,
        user_agent text,
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
    CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
    CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
    CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);

    CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);
    CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity);
    CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active);
    CREATE INDEX IF NOT EXISTS idx_active_sessions_created_at ON active_sessions(created_at);

    -- Function to cleanup inactive sessions (older than 5 minutes)
    CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
    RETURNS void AS $$
    BEGIN
        UPDATE active_sessions 
        SET is_active = false 
        WHERE last_activity < now() - interval '5 minutes' 
        AND is_active = true;
    END;
    $$ LANGUAGE plpgsql;

    -- Function to get live visitor count
    CREATE OR REPLACE FUNCTION get_live_visitor_count()
    RETURNS integer AS $$
    BEGIN
        -- First cleanup inactive sessions
        PERFORM cleanup_inactive_sessions();
        
        -- Return count of active sessions
        RETURN (
            SELECT COUNT(DISTINCT session_id)
            FROM active_sessions 
            WHERE is_active = true 
            AND last_activity > now() - interval '5 minutes'
        );
    END;
    $$ LANGUAGE plpgsql;

    -- Function to get daily visitor count
    CREATE OR REPLACE FUNCTION get_daily_visitor_count(target_date date DEFAULT CURRENT_DATE)
    RETURNS integer AS $$
    BEGIN
        RETURN (
            SELECT COUNT(DISTINCT session_id)
            FROM page_views 
            WHERE DATE(created_at) = target_date
        );
    END;
    $$ LANGUAGE plpgsql;

    -- Function to update or insert active session
    CREATE OR REPLACE FUNCTION upsert_active_session(
        p_session_id text,
        p_user_id uuid DEFAULT NULL,
        p_ip_address inet DEFAULT NULL,
        p_user_agent text DEFAULT NULL
    )
    RETURNS void AS $$
    BEGIN
        INSERT INTO active_sessions (session_id, user_id, ip_address, user_agent, last_activity, is_active)
        VALUES (p_session_id, p_user_id, p_ip_address, p_user_agent, now(), true)
        ON CONFLICT (session_id) 
        DO UPDATE SET 
            last_activity = now(),
            is_active = true,
            user_id = COALESCE(p_user_id, active_sessions.user_id),
            ip_address = COALESCE(p_ip_address, active_sessions.ip_address),
            user_agent = COALESCE(p_user_agent, active_sessions.user_agent);
    END;
    $$ LANGUAGE plpgsql;

    -- Row Level Security (RLS) policies
    ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
    ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

    -- Policy for page_views - only admin users can read/write
    CREATE POLICY "Admin users can manage page_views" ON page_views
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        );

    -- Policy for active_sessions - only admin users can read/write
    CREATE POLICY "Admin users can manage active_sessions" ON active_sessions
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        );

    -- Grant permissions to authenticated users for function execution
    GRANT EXECUTE ON FUNCTION get_live_visitor_count() TO authenticated;
    GRANT EXECUTE ON FUNCTION get_daily_visitor_count(date) TO authenticated;
    GRANT EXECUTE ON FUNCTION upsert_active_session(text, uuid, inet, text) TO authenticated;
    GRANT EXECUTE ON FUNCTION cleanup_inactive_sessions() TO authenticated;

    -- Comment the tables
    COMMENT ON TABLE page_views IS 'Tracks individual page views with session information';
    COMMENT ON TABLE active_sessions IS 'Tracks active user sessions for live visitor count';
    COMMENT ON FUNCTION get_live_visitor_count() IS 'Returns the current count of active visitors';
    COMMENT ON FUNCTION get_daily_visitor_count(date) IS 'Returns the count of unique visitors for a specific date';
    COMMENT ON FUNCTION upsert_active_session(text, uuid, inet, text) IS 'Updates or inserts an active session record';
    COMMENT ON FUNCTION cleanup_inactive_sessions() IS 'Marks sessions as inactive if no activity for 5+ minutes';