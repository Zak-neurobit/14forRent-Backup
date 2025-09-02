-- Email System Setup Migration
-- Creates necessary tables for email notifications and tour scheduling

-- SMTP Settings Table
CREATE TABLE IF NOT EXISTS public.smtp_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_username TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT NOT NULL DEFAULT '14ForRent',
    encryption_type TEXT NOT NULL DEFAULT 'tls',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    email_type TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Scheduled Showings Table (if not exists)
CREATE TABLE IF NOT EXISTS public.scheduled_showings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default email templates
INSERT INTO public.email_templates (template_name, subject, content) VALUES
('admin_tour_notification', 'New Tour Request - {{property_title}}', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1A2953;">New Tour Scheduled</h2>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1A2953; margin-top: 0;">Property Details</h3>
        <p><strong>Property:</strong> {{property_title}}</p>
        <p><strong>Location:</strong> {{property_location}}</p>
    </div>
    
    <div style="background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1A2953; margin-top: 0;">Guest Information</h3>
        <p><strong>Name:</strong> {{guest_name}}</p>
        <p><strong>Email:</strong> {{guest_email}}</p>
        <p><strong>Phone:</strong> {{guest_phone}}</p>
    </div>
    
    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1A2953; margin-top: 0;">Scheduled Details</h3>
        <p><strong>Date:</strong> {{scheduled_date}}</p>
        <p><strong>Time:</strong> {{scheduled_time}}</p>
        <p><strong>Additional Notes:</strong> {{description}}</p>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
    <p style="color: #666; font-size: 14px;">Please log in to the admin panel to manage this tour request.</p>
    <p style="color: #666; font-size: 14px;">This is an automated notification from 14ForRent.com</p>
</div>')

ON CONFLICT (template_name) DO UPDATE SET
    subject = EXCLUDED.subject,
    content = EXCLUDED.content,
    updated_at = timezone('utc'::text, now());

-- Insert default SMTP settings (placeholder - to be configured)
INSERT INTO public.smtp_settings (smtp_host, smtp_port, smtp_username, smtp_password, from_email, from_name, is_active) VALUES
('smtp.gmail.com', 587, 'noreply@14forrent.com', 'placeholder_password', 'noreply@14forrent.com', '14ForRent', false)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_showings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SMTP Settings (Admin only)
DROP POLICY IF EXISTS "Allow admins to manage SMTP settings" ON public.smtp_settings;
CREATE POLICY "Allow admins to manage SMTP settings" ON public.smtp_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for Email Templates (Admin only)
DROP POLICY IF EXISTS "Allow admins to manage email templates" ON public.email_templates;
CREATE POLICY "Allow admins to manage email templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for Email Logs (Admin only)
DROP POLICY IF EXISTS "Allow admins to view email logs" ON public.email_logs;
CREATE POLICY "Allow admins to view email logs" ON public.email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for Scheduled Showings
DROP POLICY IF EXISTS "Users can view their own showings" ON public.scheduled_showings;
CREATE POLICY "Users can view their own showings" ON public.scheduled_showings
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create showings" ON public.scheduled_showings;
CREATE POLICY "Users can create showings" ON public.scheduled_showings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all showings" ON public.scheduled_showings;
CREATE POLICY "Admins can manage all showings" ON public.scheduled_showings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_showings_listing_id ON public.scheduled_showings(listing_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_showings_user_id ON public.scheduled_showings(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_showings_date ON public.scheduled_showings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);