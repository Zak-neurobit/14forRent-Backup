# 🚀 Performance Improvement Plan for 14ForRent

## Executive Summary
Current performance testing shows critical issues with page load times. The homepage takes 15.6 seconds to load (target: <1 second). This plan provides step-by-step optimizations to achieve sub-1-second load times across all pages.

## 📊 Current Performance Status

### Critical Issues (Must Fix Immediately)
- **Homepage**: 15.6s (14.6s over target) ⚠️ CRITICAL
- **Contact Page**: 5.3s (4.3s over target) ⚠️ HIGH
- **Search Page**: 2s (1s over target) ⚠️ HIGH

### Minor Issues
- **Available Units**: 1.1s (0.1s over target)
- **Login Page**: 1.3s (0.3s over target)

### Performing Well ✅
- Blog, Signup, Terms, Fair Housing, Get Preapproved, All Neighborhood pages

## 🎯 Phase 1: Immediate Fixes (Week 1)
*Expected improvement: 50-70% reduction in load times*

### 1.1 Homepage Optimization (Priority: CRITICAL)

#### Problem Analysis
The homepage is loading everything at once, including:
- All property images
- Heavy animations
- Multiple API calls
- Large JavaScript bundles

#### Solutions

**A. Implement Lazy Loading for Images**
```tsx
// Install: npm install react-lazy-load-image-component
// In PropertyCard.tsx and similar components:
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

// Replace <img> with:
<LazyLoadImage
  src={imageUrl}
  alt={property.title}
  effect="blur"
  threshold={100}
/>
```

**B. Optimize Hero Section**
```tsx
// In Index.tsx - Split hero into critical and non-critical
const HeroSection = lazy(() => import('./components/HeroSection'));
const FeaturesSection = lazy(() => import('./components/FeaturesSection'));

// Load critical content first
return (
  <>
    <div className="hero-placeholder">
      {/* Minimal inline styles for immediate display */}
    </div>
    <Suspense fallback={<div>Loading...</div>}>
      <HeroSection />
    </Suspense>
  </>
);
```

**C. Implement Intersection Observer for Sections**
```tsx
// Create a custom hook for lazy loading sections
const useIntersectionObserver = (ref, options) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);
    
    if (ref.current) observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return isVisible;
};
```

### 1.2 Search Page Optimization

**A. Implement Debounced Search**
```tsx
// In Search.tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value) => {
    performSearch(value);
  },
  300 // Wait 300ms after user stops typing
);
```

**B. Virtual Scrolling for Results**
```tsx
// Install: npm install react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={properties.length}
  itemSize={200}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <PropertyCard property={properties[index]} />
    </div>
  )}
</FixedSizeList>
```

### 1.3 Contact Page Optimization

**A. Lazy Load Google Maps**
```tsx
// Only load maps when user scrolls to it
const MapSection = lazy(() => import('./components/MapSection'));

{showMap && (
  <Suspense fallback={<MapPlaceholder />}>
    <MapSection />
  </Suspense>
)}
```

## 🚀 Phase 2: Build Optimization (Week 2)
*Expected improvement: 30-40% additional reduction*

### 2.1 Enable Production Build Optimizations

**A. Update Vite Configuration**
```js
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/*'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

**B. Enable Compression**
```js
// Install: npm install vite-plugin-compression
import viteCompression from 'vite-plugin-compression';

plugins: [
  viteCompression({
    algorithm: 'gzip',
    threshold: 10240,
  }),
  viteCompression({
    algorithm: 'brotliCompress',
    threshold: 10240,
  })
]
```

### 2.2 Implement Code Splitting

**A. Route-based Splitting**
```tsx
// Already implemented in App.tsx - ensure all heavy routes are lazy loaded
const AdminDashboard = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/Admin')
);
```

**B. Component-based Splitting**
```tsx
// Split heavy components
const PropertyGallery = lazy(() => import('./PropertyGallery'));
const PropertyMap = lazy(() => import('./PropertyMap'));
const PropertyTour = lazy(() => import('./PropertyTour'));
```

## 💾 Phase 3: Caching Strategy (Week 2)
*Expected improvement: 20-30% for returning visitors*

### 3.1 Browser Caching

**A. Service Worker Implementation**
```js
// Create service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/static/css/main.css',
        '/static/js/main.js',
      ]);
    })
  );
});
```

### 3.2 React Query Caching

**A. Optimize Query Settings**
```tsx
// In App.tsx - already configured but can be optimized further
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    }
  }
});
```

## 🗄️ Phase 4: Database Optimization (Week 3)
*Expected improvement: 40-50% for data-heavy pages*

### 4.1 Supabase Query Optimization

**A. Add Database Indexes**
```sql
-- Run these migrations via Supabase
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(city, state);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
```

**B. Implement Pagination**
```tsx
// In property queries
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .range(offset, offset + limit - 1)
  .order('created_at', { ascending: false });
```

### 4.2 Implement Edge Functions

**A. Create Cached Search Function**
```ts
// supabase/functions/cached-search/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { query } = await req.json()
  
  // Check cache first
  const cached = await getCachedResults(query)
  if (cached) return new Response(JSON.stringify(cached))
  
  // Fetch and cache
  const results = await searchProperties(query)
  await cacheResults(query, results)
  
  return new Response(JSON.stringify(results))
})
```

## 📱 Phase 5: Image Optimization (Week 3)
*Expected improvement: 30-40% reduction in image load times*

### 5.1 Image Processing

**A. Implement WebP with Fallback**
```tsx
<picture>
  <source srcSet={`${imageUrl}.webp`} type="image/webp" />
  <source srcSet={`${imageUrl}.jpg`} type="image/jpeg" />
  <img src={`${imageUrl}.jpg`} alt={property.title} />
</picture>
```

**B. Responsive Images**
```tsx
<img
  srcSet={`
    ${imageUrl}?w=300 300w,
    ${imageUrl}?w=600 600w,
    ${imageUrl}?w=1200 1200w
  `}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  src={`${imageUrl}?w=600`}
  alt={property.title}
/>
```

## 🔧 Phase 6: Bundle Size Optimization (Week 4)
*Expected improvement: 20-30% reduction in initial load*

### 6.1 Tree Shaking

**A. Remove Unused Imports**
```bash
# Install and run
npm install -D @typescript-eslint/eslint-plugin
npx eslint . --ext .ts,.tsx --fix
```

### 6.2 Replace Heavy Libraries

**A. Optimize Lodash Usage**
```tsx
// Instead of:
import _ from 'lodash';

// Use:
import debounce from 'lodash/debounce';
```

## 📈 Monitoring & Maintenance

### Setup Performance Monitoring

**A. Add Web Vitals Tracking**
```tsx
// Install: npm install web-vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Regular Performance Audits

1. **Weekly**: Run Lighthouse audits
2. **Bi-weekly**: Review React DevTools Profiler
3. **Monthly**: Analyze bundle size with webpack-bundle-analyzer

## 🎯 Success Metrics

### Target Performance Goals
- **Homepage**: < 1 second (from 15.6s)
- **Search Page**: < 800ms (from 2s)
- **Contact Page**: < 1 second (from 5.3s)
- **All Other Pages**: < 600ms

### Key Performance Indicators
- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 1s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

## 🚦 Implementation Priority

1. **Week 1**: Homepage hero optimization, lazy loading images
2. **Week 2**: Search debouncing, build configuration
3. **Week 3**: Database indexes, caching strategy
4. **Week 4**: Bundle optimization, monitoring setup

## 💡 Quick Wins (Can Do Today)

1. **Add loading="lazy" to all images** (5 minutes)
2. **Enable Vite production mode** (2 minutes)
3. **Add database indexes** (10 minutes)
4. **Implement search debouncing** (15 minutes)

## 📞 Next Steps

1. Start with Phase 1 immediately (biggest impact)
2. Run performance tests after each optimization
3. Monitor user metrics with real user monitoring (RUM)
4. Consider CDN implementation for static assets
5. Implement progressive web app (PWA) features

---

**Expected Total Improvement**: 80-90% reduction in load times
**Estimated Implementation Time**: 4 weeks
**Difficulty Level**: Medium
**Business Impact**: High (reduced bounce rate, improved SEO, better user experience)