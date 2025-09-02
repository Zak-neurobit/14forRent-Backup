# Security Guidelines

## Environment Variables

All sensitive configuration is now managed through environment variables:

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Admin Configuration  
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Security Features Implemented

### 1. **Environment Variable Protection**
- ✅ Supabase credentials moved to environment variables
- ✅ Admin emails moved to environment variables
- ✅ `.env` file added to `.gitignore`
- ✅ `.env.example` provided for team setup

### 2. **API Key Management**
- ✅ OpenAI API keys stored securely in database (`ai_settings` table)
- ✅ Keys are encrypted at rest in Supabase
- ✅ Admin-only access to API key management
- ✅ No hardcoded API keys in source code

### 3. **Database Security**
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Admin-only policies for sensitive operations
- ✅ User isolation for property data
- ✅ Proper foreign key constraints

### 4. **Authentication & Authorization**
- ✅ Supabase Auth for user management
- ✅ Admin role validation via database
- ✅ Protected admin routes and components
- ✅ Session management with secure tokens

### 5. **Storage Security**
- ✅ RLS policies on storage buckets
- ✅ User-specific upload permissions
- ✅ Admin override capabilities
- ✅ Public read access for property images

## Deployment Security Checklist

### Before Deployment:

- [ ] Verify `.env` is not committed to git
- [ ] Set environment variables in production platform
- [ ] Update Supabase RLS policies for production
- [ ] Configure CORS settings for production domain
- [ ] Review admin email list
- [ ] Test authentication flows
- [ ] Verify API key storage in database

### Production Environment Variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_ADMIN_EMAILS=production-admin@company.com
```

## Security Best Practices

### For Developers:
1. Never commit `.env` files
2. Use environment variables for all configuration
3. Keep dependencies updated
4. Review code for hardcoded secrets
5. Test with different user permissions

### For Admins:
1. Regularly rotate API keys
2. Monitor access logs
3. Review user permissions
4. Keep admin email list updated
5. Use strong passwords for admin accounts

## What's NOT Included (By Design)

- **Service Role Key**: Not needed in client-side code
- **JWT Secret**: Managed by Supabase
- **Database Passwords**: Handled by Supabase
- **Private Keys**: All operations use RLS policies

## Emergency Procedures

### If API Key is Compromised:
1. Revoke key in OpenAI dashboard
2. Generate new key
3. Update in Supabase admin panel
4. Monitor for unusual activity

### If Supabase Keys are Compromised:
1. Regenerate keys in Supabase dashboard
2. Update environment variables
3. Redeploy application
4. Review access logs

## Contact

For security concerns, contact: [admin email from environment]