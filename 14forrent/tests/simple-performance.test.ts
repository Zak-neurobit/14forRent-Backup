import { test, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';
const MAX_LOAD_TIME = 1000; // 1 second
const LOGIN_EMAIL = 'zak.seid@gmail.com';
const LOGIN_PASSWORD = 'Neurobit@123';

// All pages to test
const PAGES_TO_TEST = [
  // Public pages
  { name: 'Homepage', path: '/' },
  { name: 'Search', path: '/search' },
  { name: 'Contact', path: '/contact' },
  { name: 'Blog', path: '/blog' },
  { name: 'Available Units', path: '/available-units' },
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
  { name: 'Terms', path: '/terms' },
  { name: 'Fair Housing', path: '/fair-housing' },
  { name: 'Get Preapproved', path: '/get-preapproved' },
  
  // Neighborhood pages
  { name: 'Beverly Hills', path: '/neighborhoods/beverly-hills' },
  { name: 'Santa Monica', path: '/neighborhoods/santa-monica' },
  { name: 'Downtown LA', path: '/neighborhoods/downtown-la' },
  
  // Protected pages (will test after login)
  { name: 'Profile', path: '/profile', requiresAuth: true },
  { name: 'Favorites', path: '/favorites', requiresAuth: true },
  { name: 'My Listings', path: '/my-listings', requiresAuth: true },
  { name: 'List Property', path: '/list', requiresAuth: true },
  { name: 'Owner Dashboard', path: '/owner-dashboard', requiresAuth: true },
  { name: 'Admin Dashboard', path: '/admin', requiresAuth: true },
];

const results: any[] = [];

async function measurePage(page: Page, name: string, path: string) {
  console.log(`Testing ${name}...`);
  const startTime = Date.now();
  
  try {
    await page.goto(`${BASE_URL}${path}`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    const status = loadTime <= MAX_LOAD_TIME ? '✅ PASS' : '❌ FAIL';
    
    console.log(`  ${name}: ${loadTime}ms ${status}`);
    
    results.push({
      name,
      path,
      loadTime,
      passed: loadTime <= MAX_LOAD_TIME
    });
    
    return { name, loadTime, passed: loadTime <= MAX_LOAD_TIME };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    console.log(`  ${name}: ERROR - ${error.message}`);
    results.push({
      name,
      path,
      loadTime,
      passed: false,
      error: error.message
    });
    return { name, loadTime, passed: false, error: error.message };
  }
}

test.describe('Performance Testing - All Pages', () => {
  test('Test all pages performance', async ({ page }) => {
    console.log('\n==== TESTING PUBLIC PAGES ====\n');
    
    // Test public pages
    for (const pageInfo of PAGES_TO_TEST.filter(p => !p.requiresAuth)) {
      await measurePage(page, pageInfo.name, pageInfo.path);
    }
    
    console.log('\n==== LOGGING IN ====\n');
    
    // Login
    try {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', LOGIN_EMAIL);
      await page.fill('input[type="password"]', LOGIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000); // Wait for login to complete
      console.log('✅ Logged in successfully\n');
    } catch (error) {
      console.log('❌ Login failed:', error.message);
    }
    
    console.log('==== TESTING PROTECTED PAGES ====\n');
    
    // Test protected pages
    for (const pageInfo of PAGES_TO_TEST.filter(p => p.requiresAuth)) {
      await measurePage(page, pageInfo.name, pageInfo.path);
    }
    
    // Test admin tabs
    console.log('\n==== TESTING ADMIN TABS ====\n');
    
    const adminTabs = [
      'Properties', 'Users', 'Showings', 'AI Settings', 
      'System Prompt', 'Knowledge Base', 'Blog', 'Watermark', 'Cleanup'
    ];
    
    for (const tabName of adminTabs) {
      try {
        const startTime = Date.now();
        await page.click(`button:has-text("${tabName}")`);
        await page.waitForTimeout(500);
        const loadTime = Date.now() - startTime;
        const status = loadTime <= MAX_LOAD_TIME ? '✅ PASS' : '❌ FAIL';
        console.log(`  Admin - ${tabName}: ${loadTime}ms ${status}`);
        results.push({
          name: `Admin - ${tabName}`,
          path: `/admin#${tabName}`,
          loadTime,
          passed: loadTime <= MAX_LOAD_TIME
        });
      } catch (error) {
        console.log(`  Admin - ${tabName}: Could not test`);
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60) + '\n');
    
    const failedPages = results.filter(r => !r.passed);
    const passedPages = results.filter(r => r.passed);
    
    console.log(`✅ Pages passing (< ${MAX_LOAD_TIME}ms): ${passedPages.length}`);
    console.log(`❌ Pages failing (> ${MAX_LOAD_TIME}ms): ${failedPages.length}`);
    console.log(`📊 Total pages tested: ${results.length}`);
    
    if (failedPages.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('PAGES NEEDING OPTIMIZATION');
      console.log('='.repeat(60) + '\n');
      
      failedPages.forEach(page => {
        console.log(`❌ ${page.name}`);
        console.log(`   Path: ${page.path}`);
        console.log(`   Load time: ${page.loadTime}ms (${page.loadTime - MAX_LOAD_TIME}ms over limit)`);
        if (page.error) {
          console.log(`   Error: ${page.error}`);
        }
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('PERFORMANCE IMPROVEMENT PLAN');
      console.log('='.repeat(60) + '\n');
      
      console.log('1. IMMEDIATE OPTIMIZATIONS:');
      console.log('   - Enable production build mode');
      console.log('   - Implement code splitting for large components');
      console.log('   - Add lazy loading for images');
      console.log('   - Enable browser caching headers\n');
      
      console.log('2. DATABASE OPTIMIZATIONS:');
      console.log('   - Add indexes to frequently queried columns');
      console.log('   - Implement query result caching');
      console.log('   - Use database connection pooling');
      console.log('   - Optimize N+1 query problems\n');
      
      console.log('3. FRONTEND OPTIMIZATIONS:');
      console.log('   - Implement virtual scrolling for lists');
      console.log('   - Use React.memo for expensive components');
      console.log('   - Debounce search inputs');
      console.log('   - Prefetch data for likely next pages\n');
      
      console.log('4. ASSET OPTIMIZATIONS:');
      console.log('   - Compress and optimize images');
      console.log('   - Use WebP format for images');
      console.log('   - Implement CDN for static assets');
      console.log('   - Minify CSS and JavaScript\n');
      
      console.log('5. SERVER OPTIMIZATIONS:');
      console.log('   - Enable gzip compression');
      console.log('   - Implement server-side caching');
      console.log('   - Use HTTP/2 for parallel loading');
      console.log('   - Add service worker for offline caching');
    } else {
      console.log('\n✅ EXCELLENT! All pages load within the 1-second threshold!');
    }
    
    // Calculate statistics
    if (results.length > 0) {
      const avgLoadTime = Math.round(results.reduce((sum, r) => sum + r.loadTime, 0) / results.length);
      const fastest = results.reduce((min, r) => r.loadTime < min.loadTime ? r : min);
      const slowest = results.reduce((max, r) => r.loadTime > max.loadTime ? r : max);
      
      console.log('\n' + '='.repeat(60));
      console.log('STATISTICS');
      console.log('='.repeat(60) + '\n');
      console.log(`Average load time: ${avgLoadTime}ms`);
      console.log(`Fastest page: ${fastest.name} (${fastest.loadTime}ms)`);
      console.log(`Slowest page: ${slowest.name} (${slowest.loadTime}ms)`);
    }
  });
});