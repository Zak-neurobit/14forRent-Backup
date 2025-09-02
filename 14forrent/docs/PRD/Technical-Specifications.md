
# Technical Specifications - 14ForRent Platform

## Architecture Overview

### System Architecture
14ForRent follows a modern, cloud-native architecture pattern with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   External      │
│   (React SPA)   │───▶│   (Supabase)     │───▶│   Services      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend Stack
- **Framework**: React 18.3.1 with TypeScript 5.x
- **Build Tool**: Vite 5.x (fast development server and optimized builds)
- **Styling**: Tailwind CSS 3.x with custom design system
- **Component Library**: Radix UI primitives with shadcn/ui components
- **State Management**: 
  - TanStack Query (React Query) for server state
  - React Context for global client state
  - React Hook Form for form state management
- **Routing**: React Router DOM 6.x with lazy loading
- **Icons**: Lucide React (consistent icon system)
- **Charts**: Recharts for data visualization

#### Backend Stack
- **Database**: PostgreSQL 15+ with vector extensions (pgvector)
- **Backend-as-a-Service**: Supabase
  - Authentication: Supabase Auth with RLS policies
  - Database: PostgreSQL with real-time subscriptions
  - Storage: Supabase Storage for file management
  - Edge Functions: Deno-based serverless functions
- **AI Integration**: OpenAI API (GPT-4o-mini, text-embedding-3-small)
- **Email Service**: Configurable SMTP integration

#### Infrastructure & Deployment
- **Frontend Deployment**: Vercel (automatic deployments from Git)
- **Backend**: Supabase managed infrastructure
- **CDN**: Supabase CDN for static assets
- **Domain Management**: Custom domain configuration
- **SSL**: Automatic SSL certificate management

## Database Design

### Core Tables Structure

```sql
-- Core business entities
├── listings                 -- Property listings
├── profiles                 -- Extended user profiles
├── scheduled_showings      -- Tour scheduling
├── favorites              -- User saved properties
├── listing_views          -- Analytics tracking

-- User management
├── user_roles             -- RBAC implementation
├── user_property_requirements  -- Search preferences

-- Communication
├── notifications          -- In-app notifications
├── email_notifications    -- Email tracking
├── email_templates        -- Template management

-- AI & Content
├── ai_settings            -- AI configuration
├── kb_chunks              -- Knowledge base
├── blog_posts            -- Content management

-- System configuration
├── settings              -- Application settings
├── smtp_settings         -- Email configuration
├── watermark_settings    -- Image processing
```

### Advanced Database Features

#### Vector Search Implementation
```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to listings
ALTER TABLE listings ADD COLUMN embedding vector(1536);

-- Create vector index for similarity search
CREATE INDEX listings_embedding_idx 
ON listings USING hnsw (embedding vector_cosine_ops);

-- Similarity search function
CREATE FUNCTION match_listings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) RETURNS TABLE (
  id uuid,
  title text,
  similarity float
) AS $$
  SELECT id, title, 1 - (embedding <=> query_embedding) as similarity
  FROM listings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$ LANGUAGE sql;
```

#### Row Level Security (RLS) Policies
```sql
-- Users can only manage their own listings
CREATE POLICY "users_manage_own_listings" ON listings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin access to all resources
CREATE POLICY "admin_all_access" ON listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Public read access to published listings
CREATE POLICY "public_read_listings" ON listings
  FOR SELECT USING (status = 'available');
```

## API Design

### RESTful Endpoints Structure

```typescript
// Property Management
GET    /api/listings                    // List properties
POST   /api/listings                    // Create property
GET    /api/listings/:id                // Get property details
PUT    /api/listings/:id                // Update property
DELETE /api/listings/:id                // Delete property

// Search & Discovery  
GET    /api/search                      // Traditional search
POST   /api/search/ai                   // AI-powered search
GET    /api/search/saved                // User's saved searches
POST   /api/search/save                 // Save search criteria

// User Management
GET    /api/profile                     // Get user profile
PUT    /api/profile                     // Update profile
GET    /api/favorites                   // User favorites
POST   /api/favorites                   // Add to favorites
DELETE /api/favorites/:id               // Remove favorite

// Communication
GET    /api/showings                    // User's scheduled showings
POST   /api/showings                    // Schedule showing
PUT    /api/showings/:id                // Update showing
GET    /api/notifications               // Get notifications
PUT    /api/notifications/:id/read      // Mark as read

// Admin Endpoints
GET    /api/admin/users                 // Manage users
GET    /api/admin/listings              // Manage all listings
GET    /api/admin/analytics             // System analytics
```

### Supabase Client Configuration

```typescript
// Client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://[project-ref].supabase.co';
const supabaseKey = '[anon-key]';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

## AI Integration Specifications

### OpenAI Integration Architecture

```typescript
// AI Service Configuration
interface AIConfig {
  apiKey: string;
  model: 'gpt-4o-mini' | 'gpt-4o';
  temperature: number; // 0.0 - 1.0
  maxTokens: number;
  embeddingModel: 'text-embedding-3-small';
}

// Search Enhancement Pipeline
class AISearchService {
  async enhancedSearch(query: string): Promise<SearchResults> {
    // 1. Generate query embedding
    const embedding = await this.generateEmbedding(query);
    
    // 2. Semantic vector search
    const vectorResults = await this.vectorSearch(embedding);
    
    // 3. Traditional keyword search
    const keywordResults = await this.keywordSearch(query);
    
    // 4. Merge and rank results
    return this.mergeAndRankResults(vectorResults, keywordResults);
  }
  
  async generatePropertyDescription(property: PropertyData): Promise<string> {
    const prompt = this.buildDescriptionPrompt(property);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: DESCRIPTION_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    
    return response.choices[0].message.content;
  }
}
```

### Edge Functions Implementation

```typescript
// Edge Function: AI Chat Assistant
// File: supabase/functions/chatbot/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an AI assistant for 14ForRent, a rental property platform. 
                     Help users find properties and answer questions about listings.
                     Context: ${context}` 
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({
      response: data.choices[0].message.content,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## Frontend Architecture

### Component Architecture

```typescript
// Component hierarchy structure
src/
├── components/
│   ├── ui/                    // Base UI components (shadcn/ui)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── common/                // Common components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── LoadingSpinner.tsx
│   ├── property/              // Property-related components
│   │   ├── PropertyCard.tsx
│   │   ├── PropertyGrid.tsx
│   │   ├── PropertyDetails.tsx
│   │   └── PropertyImageGallery.tsx
│   ├── search/                // Search components
│   │   ├── SearchBar.tsx
│   │   ├── SearchFilters.tsx
│   │   ├── SearchResults.tsx
│   │   └── AISearchInterface.tsx
│   └── admin/                 // Admin components
│       ├── Dashboard.tsx
│       ├── UserManagement.tsx
│       └── ListingManagement.tsx
```

### State Management Strategy

```typescript
// Global Auth Context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// React Query Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        if (error.status === 404 || error.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Custom Hook Pattern
export const usePropertySearch = (params: SearchParams) => {
  return useQuery({
    queryKey: ['properties', 'search', params],
    queryFn: () => searchProperties(params),
    enabled: !!params.query || !!params.location,
    keepPreviousData: true,
  });
};
```

### Responsive Design System

```typescript
// Tailwind Configuration Extension
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'forrent': {
          navy: '#1A2953',
          orange: '#FF6B35',
          lightOrange: '#FF8C69',
          gray: '#F8F9FA',
        }
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

## Performance Specifications

### Frontend Performance Targets
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1

### Optimization Strategies

```typescript
// Code Splitting Implementation
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const AdminDashboard = lazy(() => import('@/pages/Admin'));
const PropertyDetails = lazy(() => import('@/pages/PropertyDetail'));

// Route-based code splitting
const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
    </Routes>
  </Suspense>
);

// Image optimization with lazy loading
const OptimizedImage = ({ src, alt, ...props }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    {...props}
    onError={(e) => {
      e.currentTarget.src = '/placeholder.svg';
    }}
  />
);
```

### Database Performance Optimization

```sql
-- Strategic indexes for common queries
CREATE INDEX CONCURRENTLY listings_search_idx 
ON listings (status, featured, created_at DESC);

CREATE INDEX CONCURRENTLY listings_location_idx 
ON listings USING gin (location gin_trgm_ops);

CREATE INDEX CONCURRENTLY listings_price_bedrooms_idx 
ON listings (price, bedrooms) WHERE status = 'available';

-- Materialized view for analytics
CREATE MATERIALIZED VIEW property_analytics AS
SELECT 
  listing_id,
  COUNT(*) as view_count,
  COUNT(DISTINCT viewer_id) as unique_viewers,
  AVG(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as weekly_engagement
FROM listing_views
GROUP BY listing_id;

-- Refresh schedule for materialized views
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY property_analytics;
END;
$$ LANGUAGE plpgsql;
```

## Security Specifications

### Authentication & Authorization

```typescript
// JWT Token Management
interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Role-based access control
enum UserRole {
  ADMIN = 'admin',
  PROPERTY_OWNER = 'property_owner',
  RENTER = 'renter'
}

const requireAuth = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const userRole = payload.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};
```

### Data Validation & Sanitization

```typescript
// Input validation with Zod
import { z } from 'zod';

const PropertyListingSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  price: z.number().positive().max(50000),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().positive().max(20),
  location: z.string().min(5).max(200),
  amenities: z.array(z.string()).max(50),
  images: z.array(z.string().url()).max(20),
});

// SQL injection prevention
const getListingById = async (id: string) => {
  // Using parameterized queries via Supabase
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)  // Automatically parameterized
    .single();
    
  if (error) throw error;
  return data;
};
```

### Content Security Policy

```typescript
// CSP Headers Configuration
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.openai.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.supabase.co;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
```

## Monitoring & Analytics

### Application Performance Monitoring

```typescript
// Error tracking and performance monitoring
import { captureException, addBreadcrumb } from '@sentry/react';

// Custom error boundary
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }
}

// Performance tracking
const trackPerformance = (metric: string, value: number) => {
  // Send to analytics service
  analytics.track('performance', {
    metric,
    value,
    timestamp: Date.now(),
    page: window.location.pathname,
  });
};
```

### Database Monitoring

```sql
-- Query performance tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;

-- Connection monitoring
SELECT 
  datname,
  usename,
  client_addr,
  state,
  query_start
FROM pg_stat_activity
WHERE state = 'active';
```

## Testing Strategy

### Unit Testing Configuration

```typescript
// Jest configuration
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// React Testing Library setup
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export const renderWithProviders = (ui: ReactElement) => {
  const testQueryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
};
```

### Integration Testing

```typescript
// API integration tests
describe('Property API', () => {
  beforeEach(() => {
    // Reset database state
    cy.task('db:seed');
  });

  it('should create a new property listing', () => {
    cy.login('property-owner@example.com');
    
    cy.visit('/list-property');
    cy.fillPropertyForm({
      title: 'Beautiful Downtown Apartment',
      price: 2500,
      bedrooms: 2,
      bathrooms: 2,
    });
    
    cy.get('[data-testid="submit-listing"]').click();
    cy.url().should('include', '/property/');
    cy.contains('Beautiful Downtown Apartment').should('be.visible');
  });
});
```

This comprehensive technical specification provides the foundation for building a scalable, secure, and performant rental property platform with modern web technologies and AI-enhanced capabilities.
