import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8080';
const PERFORMANCE_THRESHOLD = 1000; // 1 second in milliseconds
const TEST_TIMEOUT = 60000; // 60 seconds per test

// Test credentials
const TEST_USER = {
  email: 'zak.seid@gmail.com',
  password: 'Neurobit@123'
};

// All routes to test
const ROUTES = {
  critical: [
    { path: '/', name: 'Home' },
    { path: '/search', name: 'Search' },
    { path: '/property/1', name: 'Property Detail' }, // Will need to get a real property ID
    { path: '/login', name: 'Login' },
    { path: '/signup', name: 'Signup' },
    { path: '/favorites', name: 'Favorites' }
  ],
  lazyLoaded: [
    { path: '/contact', name: 'Contact' },
    { path: '/list', name: 'List Property' },
    { path: '/my-listings', name: 'My Listings' },
    { path: '/available-units', name: 'Available Units' },
    { path: '/admin', name: 'Admin Dashboard' },
    { path: '/owner-dashboard', name: 'Owner Dashboard' },
    { path: '/blog', name: 'Blog' },
    { path: '/profile', name: 'Profile' },
    { path: '/get-preapproved', name: 'Get Preapproved' },
    { path: '/welcome-back', name: 'Welcome Back' }
  ],
  neighborhoods: [
    { path: '/neighborhoods/beverly-hills', name: 'Beverly Hills' },
    { path: '/neighborhoods/santa-monica', name: 'Santa Monica' },
    { path: '/neighborhoods/downtown-la', name: 'Downtown LA' }
  ],
  other: [
    { path: '/terms', name: 'Terms and Conditions' },
    { path: '/fair-housing', name: 'Fair Housing' }
  ]
};

// Performance metrics interface
interface PerformanceMetrics {
  route: string;
  name: string;
  loadTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  domContentLoaded: number;
  isLoggedIn: boolean;
  passed: boolean;
  errors: string[];
}

// Results storage
const performanceResults: PerformanceMetrics[] = [];

// Helper function to measure page performance
async function measurePagePerformance(
  page: Page,
  route: string,
  name: string,
  isLoggedIn: boolean
): Promise<PerformanceMetrics> {
  const errors: string[] = [];
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Start timing
  const startTime = Date.now();
  
  try {
    // Navigate to the page with performance tracking
    await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Get performance metrics
    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );
    
    const performanceEntries = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return {
        firstContentfulPaint: fcp ? fcp.startTime : 0
      };
    });
    
    // Calculate metrics
    const loadTime = Date.now() - startTime;
    const domContentLoaded = performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart;
    const timeToInteractive = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
    
    const metrics: PerformanceMetrics = {
      route,
      name,
      loadTime,
      firstContentfulPaint: performanceEntries.firstContentfulPaint,
      timeToInteractive,
      domContentLoaded,
      isLoggedIn,
      passed: loadTime < PERFORMANCE_THRESHOLD,
      errors
    };
    
    return metrics;
  } catch (error) {
    return {
      route,
      name,
      loadTime: Date.now() - startTime,
      firstContentfulPaint: 0,
      timeToInteractive: 0,
      domContentLoaded: 0,
      isLoggedIn,
      passed: false,
      errors: [...errors, error.message]
    };
  }
}

// Helper function to get a real property ID
async function getRealPropertyId(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/search`);
  await page.waitForSelector('[data-testid="property-card"], article', { timeout: 10000 });
  
  // Get the first property link
  const propertyLink = await page.evaluate(() => {
    const firstCard = document.querySelector('[data-testid="property-card"] a, article a');
    if (firstCard) {
      const href = firstCard.getAttribute('href');
      const match = href?.match(/\/property\/(.+)/);
      return match ? match[1] : null;
    }
    return null;
  });
  
  return propertyLink || '1';
}

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  
  // Check if already logged in
  const isAlreadyLoggedIn = await page.evaluate(() => {
    return window.location.pathname !== '/login';
  });
  
  if (isAlreadyLoggedIn) {
    console.log('Already logged in');
    return;
  }
  
  // Fill login form
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
}

// Main test suite
test.describe('Performance Testing - All Pages', () => {
  test.setTimeout(TEST_TIMEOUT * 10); // Longer timeout for full suite
  
  test('Measure performance for all pages (logged out)', async ({ page }) => {
    console.log('\n🚀 Starting performance tests for LOGGED OUT state\n');
    
    // Get a real property ID first
    const propertyId = await getRealPropertyId(page);
    console.log(`Using property ID: ${propertyId}`);
    
    // Update property detail route with real ID
    ROUTES.critical[2].path = `/property/${propertyId}`;
    
    // Test all routes
    const allRoutes = [
      ...ROUTES.critical,
      ...ROUTES.lazyLoaded.filter(r => !r.path.includes('admin') && !r.path.includes('owner-dashboard') && !r.path.includes('my-listings') && !r.path.includes('profile')),
      ...ROUTES.neighborhoods,
      ...ROUTES.other
    ];
    
    for (const route of allRoutes) {
      console.log(`Testing ${route.name} (${route.path})...`);
      const metrics = await measurePagePerformance(page, route.path, route.name, false);
      performanceResults.push(metrics);
      
      if (!metrics.passed) {
        console.log(`  ⚠️  SLOW: ${metrics.loadTime}ms (threshold: ${PERFORMANCE_THRESHOLD}ms)`);
      } else {
        console.log(`  ✅ FAST: ${metrics.loadTime}ms`);
      }
      
      if (metrics.errors.length > 0) {
        console.log(`  ❌ Errors: ${metrics.errors.join(', ')}`);
      }
    }
  });
  
  test('Measure performance for all pages (logged in)', async ({ page }) => {
    console.log('\n🚀 Starting performance tests for LOGGED IN state\n');
    
    // Login first
    await login(page);
    console.log('Logged in successfully\n');
    
    // Get a real property ID
    const propertyId = await getRealPropertyId(page);
    console.log(`Using property ID: ${propertyId}\n`);
    
    // Update property detail route with real ID
    ROUTES.critical[2].path = `/property/${propertyId}`;
    
    // Test all routes including auth-required ones
    const allRoutes = [
      ...ROUTES.critical,
      ...ROUTES.lazyLoaded,
      ...ROUTES.neighborhoods,
      ...ROUTES.other
    ];
    
    for (const route of allRoutes) {
      console.log(`Testing ${route.name} (${route.path})...`);
      const metrics = await measurePagePerformance(page, route.path, route.name, true);
      performanceResults.push(metrics);
      
      if (!metrics.passed) {
        console.log(`  ⚠️  SLOW: ${metrics.loadTime}ms (threshold: ${PERFORMANCE_THRESHOLD}ms)`);
      } else {
        console.log(`  ✅ FAST: ${metrics.loadTime}ms`);
      }
      
      if (metrics.errors.length > 0) {
        console.log(`  ❌ Errors: ${metrics.errors.join(', ')}`);
      }
    }
  });
  
  test.afterAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TEST RESULTS SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    // Separate results by login state
    const loggedOutResults = performanceResults.filter(r => !r.isLoggedIn);
    const loggedInResults = performanceResults.filter(r => r.isLoggedIn);
    
    // Print logged out results
    console.log('📊 LOGGED OUT PERFORMANCE:');
    console.log('-'.repeat(80));
    loggedOutResults.forEach(result => {
      const status = result.passed ? '✅' : '⚠️';
      const loadTimeStr = `${result.loadTime}ms`.padEnd(8);
      const fcpStr = `FCP: ${Math.round(result.firstContentfulPaint)}ms`.padEnd(12);
      const ttiStr = `TTI: ${Math.round(result.timeToInteractive)}ms`.padEnd(12);
      console.log(`${status} ${result.name.padEnd(25)} Load: ${loadTimeStr} ${fcpStr} ${ttiStr}`);
    });
    
    // Print logged in results
    console.log('\n📊 LOGGED IN PERFORMANCE:');
    console.log('-'.repeat(80));
    loggedInResults.forEach(result => {
      const status = result.passed ? '✅' : '⚠️';
      const loadTimeStr = `${result.loadTime}ms`.padEnd(8);
      const fcpStr = `FCP: ${Math.round(result.firstContentfulPaint)}ms`.padEnd(12);
      const ttiStr = `TTI: ${Math.round(result.timeToInteractive)}ms`.padEnd(12);
      console.log(`${status} ${result.name.padEnd(25)} Load: ${loadTimeStr} ${fcpStr} ${ttiStr}`);
    });
    
    // Find slow pages
    const slowPages = performanceResults.filter(r => !r.passed);
    
    if (slowPages.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log(`⚠️  PAGES EXCEEDING ${PERFORMANCE_THRESHOLD}ms THRESHOLD:`);
      console.log('='.repeat(80));
      
      slowPages.forEach(page => {
        console.log(`\n📍 ${page.name} (${page.isLoggedIn ? 'logged in' : 'logged out'})`);
        console.log(`   Path: ${page.route}`);
        console.log(`   Load Time: ${page.loadTime}ms`);
        console.log(`   First Contentful Paint: ${Math.round(page.firstContentfulPaint)}ms`);
        console.log(`   Time to Interactive: ${Math.round(page.timeToInteractive)}ms`);
        if (page.errors.length > 0) {
          console.log(`   Errors: ${page.errors.join(', ')}`);
        }
      });
      
      console.log('\n' + '='.repeat(80));
      console.log('RECOMMENDED OPTIMIZATIONS:');
      console.log('='.repeat(80));
      
      // Analyze patterns and suggest fixes
      const uniqueSlowPages = new Set(slowPages.map(p => p.name));
      
      uniqueSlowPages.forEach(pageName => {
        const pageResults = slowPages.filter(p => p.name === pageName);
        const avgLoadTime = Math.round(pageResults.reduce((sum, p) => sum + p.loadTime, 0) / pageResults.length);
        
        console.log(`\n🔧 ${pageName} (avg: ${avgLoadTime}ms):`);
        
        // Suggest specific optimizations based on the page
        if (pageName.includes('Dashboard') || pageName.includes('Admin')) {
          console.log('   - Implement pagination for data tables');
          console.log('   - Add data caching with 5-minute TTL');
          console.log('   - Use React Query for background data fetching');
          console.log('   - Lazy load charts and analytics components');
        } else if (pageName.includes('Search') || pageName.includes('Listings')) {
          console.log('   - Implement virtual scrolling for property lists');
          console.log('   - Add search result caching');
          console.log('   - Optimize database queries with proper indexes');
          console.log('   - Lazy load images with intersection observer');
        } else if (pageName.includes('Property')) {
          console.log('   - Defer non-critical data fetching');
          console.log('   - Optimize image gallery loading');
          console.log('   - Cache property data more aggressively');
          console.log('   - Use skeleton loaders for better perceived performance');
        } else if (pageName.includes('Blog')) {
          console.log('   - Implement static generation for blog posts');
          console.log('   - Add CDN caching for blog content');
          console.log('   - Lazy load comments and related posts');
        } else {
          console.log('   - Add page-level caching');
          console.log('   - Optimize bundle size with code splitting');
          console.log('   - Reduce initial JavaScript payload');
          console.log('   - Add prefetching for likely next pages');
        }
      });
    } else {
      console.log('\n' + '='.repeat(80));
      console.log('✅ ALL PAGES LOAD WITHIN PERFORMANCE THRESHOLD!');
      console.log('='.repeat(80));
    }
    
    // Overall statistics
    if (performanceResults.length > 0) {
      const avgLoadTime = Math.round(performanceResults.reduce((sum, r) => sum + r.loadTime, 0) / performanceResults.length);
      const fastestPage = performanceResults.reduce((min, r) => r.loadTime < min.loadTime ? r : min);
      const slowestPage = performanceResults.reduce((max, r) => r.loadTime > max.loadTime ? r : max);
      
      console.log('\n' + '='.repeat(80));
      console.log('OVERALL STATISTICS:');
      console.log('='.repeat(80));
      console.log(`Total pages tested: ${performanceResults.length}`);
      console.log(`Average load time: ${avgLoadTime}ms`);
      console.log(`Fastest page: ${fastestPage.name} (${fastestPage.loadTime}ms)`);
      console.log(`Slowest page: ${slowestPage.name} (${slowestPage.loadTime}ms)`);
      console.log(`Pages passing threshold: ${performanceResults.filter(r => r.passed).length}/${performanceResults.length}`);
      console.log('='.repeat(80) + '\n');
    } else {
      console.log('\n⚠️  No performance results collected. Check if the dev server is running.');
    }
  });
});