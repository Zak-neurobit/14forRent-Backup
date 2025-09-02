
# 14ForRent - Rental Property Platform

## Project Summary

14ForRent is a comprehensive rental property listing platform built with React, TypeScript, and Supabase. The platform enables property owners to list their rental properties and allows potential renters to search, view, and schedule tours of available properties.

## Key Features

### Core Functionality
- **Property Listings**: Create, edit, and manage rental property listings with images and videos
- **AI-Powered Search**: Advanced search with semantic search capabilities using OpenAI embeddings
- **User Authentication**: Secure user registration and login system
- **Property Tours**: Schedule and manage property showing appointments
- **Favorites System**: Save and manage favorite properties
- **Admin Dashboard**: Comprehensive admin panel for managing users, listings, and system settings
- **Real-time Chat**: AI-powered chatbot for property inquiries
- **Email Notifications**: Automated email system for property matches and updates

### Advanced Features
- **AI Description Generation**: Automatically generate property descriptions using OpenAI
- **Vector Search**: Semantic search using PostgreSQL vector extensions
- **Image Processing**: Automated watermarking for property images
- **Blog System**: Content management for blog posts
- **User Profiles**: Detailed user profiles with property requirements
- **Analytics Dashboard**: Admin analytics and reporting
- **Mobile Responsive**: Fully responsive design for all devices

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components with shadcn/ui
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Toast Notifications**: Sonner

### Backend & Database
- **Database**: Supabase (PostgreSQL with extensions)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions
- **Vector Search**: pgvector extension for AI search
- **Edge Functions**: Deno-based serverless functions

### AI & ML
- **OpenAI Integration**: GPT-4o-mini for chat and content generation
- **Vector Embeddings**: text-embedding-3-small for semantic search
- **Knowledge Base**: Vector-based knowledge management

### External Services
- **Email**: SMTP integration for notifications
- **Image Processing**: Server-side watermarking
- **YouTube Integration**: Video embedding support

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin dashboard components
│   ├── chat/           # AI chat components
│   ├── listing/        # Property listing components
│   ├── property/       # Property detail components
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── user/           # User-specific components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility functions
├── pages/              # Page components
├── services/           # API services and business logic
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities
```

## Key Components

### Critical Business Logic
1. **Property Management** (`src/hooks/usePropertyForm.ts`)
2. **AI Search Service** (`src/services/ai/search.ts`)
3. **Authentication Context** (`src/contexts/AuthContext.tsx`)
4. **Admin User Management** (`src/hooks/useUserManagement.ts`)
5. **Real-time Notifications** (`src/hooks/useSoldPropertyNotification.ts`)

### Core UI Components
1. **Property Cards** (`src/components/PropertyCardAdapter.tsx`)
2. **Search Interface** (`src/components/AISearch.tsx`)
3. **Admin Dashboard** (`src/components/admin/AdminLayout.tsx`)
4. **Chat Interface** (`src/components/chat/AIChat.tsx`)
5. **Property Forms** (`src/components/listing/`)

This platform serves as a complete solution for rental property management with modern web technologies and AI-enhanced user experience.
