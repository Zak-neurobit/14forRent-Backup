import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';
const MAX_LOAD_TIME = 1000; // 1 second threshold

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'zak.seid@gmail.com',
  password: 'Neurobit@123'
};

// All pages to test
const PAGES_TO_TEST = [
  // Public pages
  { path: '/', name: 'Home', requiresAuth: false },
  { path: '/search', name: 'Search', requiresAuth: false },
  { path: '/available-units', name: 'Available Units', requiresAuth: false },
  { path: '/login', name: 'Login', requiresAuth: false },
  { path: '/signup', name: 'Signup', requiresAuth: false },
  { path: '/contact', name: 'Contact', requiresAuth: false },
  { path: '/blog', name: 'Blog', requiresAuth: false },
  { path: '/get-preapproved', name: 'Get Preapproved', requiresAuth: false },
  { path: '/terms', name: 'Terms', requiresAuth: false },
  { path: '/fair-housing', name: 'Fair Housing', requiresAuth: false },
  
  // Neighborhood pages
  { path: '/neighborhoods/beverly-hills', name: 'Beverly Hills', requiresAuth: false },
  { path: '/neighborhoods/santa-monica', name: 'Santa Monica', requiresAuth: false },
  { path: '/neighborhoods/downtown-la', name: 'Downtown LA', requiresAuth: false },
  
  // Authenticated pages
  { path: '/favorites', name: 'Favorites', requiresAuth: true },
  { path: '/profile', name: 'Profile', requiresAuth: true },
  { path: '/my-listings', name: 'My Listings', requiresAuth: true },
  { path: '/list', name: 'List Property', requiresAuth: true },
  { path: '/owner-dashboard', name: 'Owner Dashboard', requiresAuth: true },
  { path: '/admin', name: 'Admin Dashboard', requiresAuth: true },
];

test.describe('Page Load Performance Test - All Pages Under 1 Second', () => {
  test('All pages should load in under 1 second', async ({ page }) => {
    const results: Array<{
      name: string;
      path: string;
      loadTime: number;
      passed: boolean;
      error?: string;
    }> = [];

    // First, login for authenticated pages
    console.log('🔐 Logging in as admin...\n');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 5000 });
    console.log('✅ Logged in successfully\n');

    console.log('📊 Testing page load times (Threshold: 1 second)\n');
    console.log('='.repeat(60));

    for (const pageInfo of PAGES_TO_TEST) {
      try {
        const startTime = performance.now();
        
        await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 5000
        });
        
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);
        const passed = loadTime < MAX_LOAD_TIME;
        
        results.push({
          name: pageInfo.name,
          path: pageInfo.path,
          loadTime,
          passed
        });
        
        const status = passed ? '✅' : '❌';
        const timeColor = passed ? '' : '⚠️ ';
        console.log(
          `${status} ${pageInfo.name.padEnd(25)} ${timeColor}${loadTime}ms${
            passed ? '' : ` (EXCEEDS 1s THRESHOLD)`
          }`
        );
        
      } catch (error) {
        results.push({
          name: pageInfo.name,
          path: pageInfo.path,
          loadTime: 0,
          passed: false,
          error: error.message
        });
        console.log(`❌ ${pageInfo.name.padEnd(25)} ERROR: ${error.message}`);
      }
    }

    console.log('='.repeat(60));
    console.log('\n📈 PERFORMANCE SUMMARY:\n');
    
    const passedPages = results.filter(r => r.passed);
    const failedPages = results.filter(r => !r.passed);
    
    console.log(`✅ Passed: ${passedPages.length}/${results.length} pages`);
    console.log(`❌ Failed: ${failedPages.length}/${results.length} pages`);
    
    if (failedPages.length > 0) {
      console.log('\n⚠️  SLOW PAGES (Over 1 second):');
      failedPages.forEach(page => {
        if (!page.error) {
          console.log(`  - ${page.name}: ${page.loadTime}ms`);
        }
      });
      
      const errorPages = failedPages.filter(p => p.error);
      if (errorPages.length > 0) {
        console.log('\n❌ PAGES WITH ERRORS:');
        errorPages.forEach(page => {
          console.log(`  - ${page.name}: ${page.error}`);
        });
      }
    }
    
    // Calculate statistics
    const validResults = results.filter(r => r.loadTime > 0);
    if (validResults.length > 0) {
      const avgLoadTime = Math.round(
        validResults.reduce((sum, r) => sum + r.loadTime, 0) / validResults.length
      );
      const maxLoadTime = Math.max(...validResults.map(r => r.loadTime));
      const minLoadTime = Math.min(...validResults.map(r => r.loadTime));
      
      console.log('\n📊 STATISTICS:');
      console.log(`  Average Load Time: ${avgLoadTime}ms`);
      console.log(`  Fastest Page: ${minLoadTime}ms`);
      console.log(`  Slowest Page: ${maxLoadTime}ms`);
    }

    // Fail the test if any page exceeds the threshold
    expect(failedPages.length).toBe(0);
  });
});