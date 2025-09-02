# Environment Setup

## Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **Project API Keys** → **anon/public** key → Use as `VITE_SUPABASE_ANON_KEY`

## Security Notes

- The **anon key** is safe to use in client-side code
- It only allows operations permitted by your Row Level Security (RLS) policies
- Never commit the `.env` file to version control
- Use the `.env.example` file as a template for team members

## Development Setup

1. Copy `.env.example` to `.env`
2. Fill in your actual Supabase credentials
3. Run the development server: `npm run dev`

The application will automatically validate that all required environment variables are present and throw an error if any are missing.