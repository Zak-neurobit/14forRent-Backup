# Frontend Architecture

## Overview
The frontend is built as a Single Page Application (SPA) using React 18 with TypeScript, following modern React patterns and best practices.

## Architecture Patterns

### Component Architecture
- **Atomic Design Pattern**: Components are organized in increasing complexity
  - Atoms: Basic UI components (`Button`, `Input`, etc.)
  - Molecules: Component combinations (`SearchBar`, `PropertyCard`)
  - Organisms: Complex components (`Navbar`, `PropertyGrid`)
  - Templates: Page layouts
  - Pages: Complete views

### State Management Strategy
- **Server State**: TanStack React Query for API data management
- **Client State**: React Context for global state (Auth, Theme)
- **Form State**: React Hook Form for form management
- **Local State**: useState/useReducer for component-specific state

## Key Architectural Decisions

### 1. Context Providers
```typescript
// AuthContext provides global authentication state
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Manages user authentication, admin status, and auth state
}
```

### 2. Custom Hooks Pattern
- **Data Fetching Hooks**: `useUserManagement`, `useAdminStats`
- **Business Logic Hooks**: `usePropertyForm`, `useEditListing`
- **Utility Hooks**: `useSoldPropertyNotification`

### 3. Service Layer
```
services/
├── ai/                 # AI-related services
│   ├── search.ts      # Vector search implementation
│   ├── embeddings.ts  # OpenAI embeddings
│   └── types.ts       # AI service types
├── authService.ts     # Authentication logic
├── notificationService.ts  # Push notifications
└── webhookService.ts  # Webhook handling
```

### 4. Component Organization
```
components/
├── admin/             # Admin-specific components
│   ├── Dashboard.tsx
│   ├── UserManagement.tsx
│   └── ListingManagement.tsx
├── listing/           # Property listing components
│   ├── ImageUploader.tsx
│   ├── PropertyDetailsForm.tsx
│   └── VideoUploader.tsx
├── property/          # Property display components
│   ├── PropertyCard.tsx
│   └── PropertyImageGallery.tsx
├── chat/              # AI chat components
└── ui/                # Base UI components (shadcn/ui)
```

## Data Flow Architecture

### 1. Server State Management
```typescript
// React Query for server state
const { data, isLoading, error } = useQuery({
  queryKey: ['listings'],
  queryFn: fetchListings,
});
```

### 2. Real-time Updates
```typescript
// Supabase real-time subscriptions
useEffect(() => {
  const channel = supabase
    .channel('property-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'listings'
    }, handlePropertyUpdate)
    .subscribe();
}, []);
```

### 3. Form Handling
```typescript
// React Hook Form with Zod validation
const form = useForm<PropertyFormData>({
  resolver: zodResolver(propertySchema),
  defaultValues: {
    title: '',
    price: 0,
    // ... other fields
  }
});
```

## Routing Architecture

### Route Structure
```typescript
// App.tsx - Main routing
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/search" element={<Search />} />
  <Route path="/property/:id" element={<PropertyDetail />} />
  <Route path="/admin" element={<Admin />} />
  // ... other routes
</Routes>
```

### Protected Routes Pattern
```typescript
// Route protection using auth context
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};
```

## Performance Optimizations

### 1. Code Splitting
- Dynamic imports for route-based splitting
- Lazy loading of admin components
- Component-level splitting for large features

### 2. Data Optimization
- React Query caching strategies
- Infinite scroll for property listings
- Image lazy loading and optimization

### 3. Bundle Optimization
- Vite for fast development and optimized builds
- Tree shaking for unused code elimination
- Asset optimization and compression

## Error Handling Strategy

### 1. Error Boundaries
```typescript
// ErrorBoundary component for catching React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### 2. API Error Handling
```typescript
// Centralized error handling in React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Custom retry logic
        return failureCount < 3 && !error.message.includes('404');
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    },
  },
});
```

## Styling Architecture

### Design System
```css
/* index.css - CSS custom properties for theming */
:root {
  --forrent-navy: #1A2953;
  --forrent-orange: #FF6B35;
  --forrent-lightOrange: #FF8C69;
  --forrent-gray: #F8F9FA;
}
```

### Component Styling Pattern
```typescript
// Tailwind with semantic classes
const PropertyCard = ({ property }) => (
  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <img className="w-full h-48 object-cover rounded-t-lg" />
    <div className="p-4">
      <h3 className="text-forrent-navy font-semibold">{property.title}</h3>
      <p className="text-forrent-orange font-bold">${property.price}/month</p>
    </div>
  </div>
);
```

## Testing Strategy

### Unit Testing
- Jest and React Testing Library for component tests
- Mock service layer for isolated testing
- Snapshot testing for UI consistency

### Integration Testing
- End-to-end user flow testing
- API integration testing
- Real-time feature testing

### Performance Testing
- Bundle size monitoring
- Core Web Vitals tracking
- Load testing for search functionality

This architecture ensures scalability, maintainability, and optimal user experience while following React best practices and modern web development standards.
