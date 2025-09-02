import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  type: 'admin_tour_notification' | 'user_tour_update' | 'owner_tour_notification';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, subject, template, data, type }: EmailRequest = await req.json();

    // Get SMTP settings
    const { data: smtpSettings, error: smtpError } = await supabaseClient
      .from('smtp_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (smtpError || !smtpSettings) {
      console.error('SMTP settings not configured:', smtpError);
      return new Response(JSON.stringify({ 
        error: 'Email service not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get email template
    const { data: emailTemplate, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_name', template)
      .eq('is_active', true)
      .single();

    let emailContent = '';
    let emailSubject = subject;

    if (emailTemplate && !templateError) {
      emailContent = emailTemplate.content;
      emailSubject = emailTemplate.subject;
    } else {
      // Fallback templates
      switch (type) {
        case 'admin_tour_notification':
          emailContent = `
            <h2>New Tour Scheduled</h2>
            <p>A new tour has been scheduled for property: <strong>{{property_title}}</strong></p>
            <p><strong>Location:</strong> {{property_location}}</p>
            <p><strong>Guest Name:</strong> {{guest_name}}</p>
            <p><strong>Guest Email:</strong> {{guest_email}}</p>
            <p><strong>Guest Phone:</strong> {{guest_phone}}</p>
            <p><strong>Scheduled Date:</strong> {{scheduled_date}}</p>
            <p><strong>Scheduled Time:</strong> {{scheduled_time}}</p>
            <p><strong>Message:</strong> {{description}}</p>
            <hr>
            <p>Please log in to the admin panel to manage this tour request.</p>
          `;
          emailSubject = 'New Tour Request - {{property_title}}';
          break;
        
        case 'user_tour_update':
          emailContent = `
            <h2>Tour Update</h2>
            <p>Hello {{guest_name}},</p>
            <p>Your scheduled tour for <strong>{{property_title}}</strong> has been updated.</p>
            <p><strong>Status:</strong> {{status}}</p>
            <p><strong>New Date:</strong> {{scheduled_date}}</p>
            <p><strong>New Time:</strong> {{scheduled_time}}</p>
            <p><strong>Message from Admin:</strong> {{admin_message}}</p>
            <p>If you have any questions, please contact us.</p>
          `;
          emailSubject = 'Tour Update - {{property_title}}';
          break;
        
        case 'owner_tour_notification':
          emailContent = `
            <h2>Tour Scheduled for Your Property</h2>
            <p>A tour has been scheduled for your property: <strong>{{property_title}}</strong></p>
            <p><strong>Location:</strong> {{property_location}}</p>
            <p><strong>Scheduled Date:</strong> {{scheduled_date}}</p>
            <p><strong>Scheduled Time:</strong> {{scheduled_time}}</p>
            <p>Note: Guest details are kept private for security reasons.</p>
            <hr>
            <p>You can manage your properties in the owner dashboard.</p>
          `;
          emailSubject = 'Tour Scheduled - {{property_title}}';
          break;
        
        default:
          emailContent = '<p>{{message}}</p>';
      }
    }

    // Replace template variables
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      emailContent = emailContent.replace(new RegExp(placeholder, 'g'), data[key] || '');
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });

    // Send email using SMTP
    let emailSent = false;
    let errorMessage = '';
    
    try {
      if (smtpSettings.is_active && smtpSettings.smtp_password !== 'placeholder_password') {
        const client = new SmtpClient();
        
        await client.connect({
          hostname: smtpSettings.smtp_host,
          port: smtpSettings.smtp_port,
          username: smtpSettings.smtp_username,
          password: smtpSettings.smtp_password,
        });

        await client.send({
          from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
          to: to,
          subject: emailSubject,
          content: emailContent,
          html: emailContent,
        });

        await client.close();
        emailSent = true;
        console.log('Email sent successfully to:', to);
      } else {
        console.log('SMTP not configured, skipping actual send');
      }
    } catch (error) {
      console.error('SMTP sending failed:', error);
      errorMessage = error.message;
    }

    // For tour notifications, also send directly to jason@14forrent.com as fallback
    if (type === 'admin_tour_notification' && to !== 'jason@14forrent.com') {
      try {
        // Send a copy to jason@14forrent.com regardless of admin roles
        if (smtpSettings.is_active && smtpSettings.smtp_password !== 'placeholder_password') {
          const client = new SmtpClient();
          
          await client.connect({
            hostname: smtpSettings.smtp_host,
            port: smtpSettings.smtp_port,
            username: smtpSettings.smtp_username,
            password: smtpSettings.smtp_password,
          });

          await client.send({
            from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
            to: 'jason@14forrent.com',
            subject: emailSubject,
            content: emailContent,
            html: emailContent,
          });

          await client.close();
          console.log('Tour notification also sent to jason@14forrent.com');
        }
      } catch (error) {
        console.error('Failed to send copy to jason@14forrent.com:', error);
      }
    }

    const emailData = {
      to,
      subject: emailSubject,
      html: emailContent,
      from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
      sent: emailSent,
      error: errorMessage || null
    };

    // Store email log
    await supabaseClient
      .from('email_logs')
      .insert({
        recipient: to,
        subject: emailSubject,
        content: emailContent,
        status: emailSent ? 'sent' : 'failed',
        email_type: type,
        error_message: errorMessage || null,
        sent_at: emailSent ? new Date().toISOString() : null
      });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email sent successfully',
      emailData // For debugging
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send email',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});