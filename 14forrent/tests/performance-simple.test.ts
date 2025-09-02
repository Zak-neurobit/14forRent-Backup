import { test, Page } from '@playwright/test';

// Test configuration  
const BASE_URL = 'http://localhost:8085';
const PERFORMANCE_THRESHOLD = 2000; // 2 seconds in milliseconds

// All routes to test (without auth-required pages first)
const PUBLIC_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/search', name: 'Search' },
  { path: '/contact', name: 'Contact' },
  { path: '/available-units', name: 'Available Units' },
  { path: '/blog', name: 'Blog' },
  { path: '/get-preapproved', name: 'Get Preapproved' },
  { path: '/terms', name: 'Terms and Conditions' },
  { path: '/fair-housing', name: 'Fair Housing' },
  { path: '/neighborhoods/beverly-hills', name: 'Beverly Hills' },
  { path: '/neighborhoods/santa-monica', name: 'Santa Monica' },
  { path: '/neighborhoods/downtown-la', name: 'Downtown LA' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Signup' }
];

const AUTH_ROUTES = [
  { path: '/favorites', name: 'Favorites' },
  { path: '/list', name: 'List Property' },
  { path: '/my-listings', name: 'My Listings' },
  { path: '/profile', name: 'Profile' },
  { path: '/admin', name: 'Admin Dashboard' },
  { path: '/owner-dashboard', name: 'Owner Dashboard' }
];

interface PerformanceResult {
  name: string;
  path: string;
  loadTime: number;
  status: 'PASS' | 'SLOW' | 'ERROR';
  error?: string;
}

async function measurePageLoad(page: Page, route: { path: string; name: string }): Promise<PerformanceResult> {
  const startTime = Date.now();
  
  try {
    // Navigate and wait for basic page load
    const response = await page.goto(`${BASE_URL}${route.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait a bit for JavaScript to execute
    await page.waitForTimeout(500);
    
    const loadTime = Date.now() - startTime;
    
    // Check if page loaded successfully
    if (!response || response.status() >= 400) {
      return {
        name: route.name,
        path: route.path,
        loadTime,
        status: 'ERROR',
        error: `HTTP ${response?.status()}`
      };
    }
    
    return {
      name: route.name,
      path: route.path,
      loadTime,
      status: loadTime < PERFORMANCE_THRESHOLD ? 'PASS' : 'SLOW'
    };
  } catch (error) {
    return {
      name: route.name,
      path: route.path,
      loadTime: Date.now() - startTime,
      status: 'ERROR',
      error: error.message
    };
  }
}

test.describe('Simple Performance Test', () => {
  test('Test all public pages', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TEST - PUBLIC PAGES');
    console.log('='.repeat(80));
    console.log(`Threshold: ${PERFORMANCE_THRESHOLD}ms\n`);
    
    const results: PerformanceResult[] = [];
    
    for (const route of PUBLIC_ROUTES) {
      const result = await measurePageLoad(page, route);
      results.push(result);
      
      const icon = result.status === 'PASS' ? '✅' : result.status === 'SLOW' ? '⚠️' : '❌';
      const timeStr = `${result.loadTime}ms`.padEnd(8);
      console.log(`${icon} ${result.name.padEnd(25)} ${timeStr} ${result.error || ''}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    const slowCount = results.filter(r => r.status === 'SLOW').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    
    console.log(`✅ Passed: ${passCount}/${results.length}`);
    console.log(`⚠️  Slow: ${slowCount}/${results.length}`);
    console.log(`❌ Errors: ${errorCount}/${results.length}`);
    
    if (slowCount > 0) {
      console.log('\n' + '='.repeat(80));
      console.log(`SLOW PAGES (>${PERFORMANCE_THRESHOLD}ms)`);
      console.log('='.repeat(80));
      
      results.filter(r => r.status === 'SLOW').forEach(result => {
        console.log(`\n📍 ${result.name}`);
        console.log(`   Path: ${result.path}`);
        console.log(`   Load Time: ${result.loadTime}ms`);
        console.log(`   Over threshold by: ${result.loadTime - PERFORMANCE_THRESHOLD}ms`);
      });
    }
    
    // Calculate averages
    const validResults = results.filter(r => r.status !== 'ERROR');
    if (validResults.length > 0) {
      const avgLoadTime = Math.round(validResults.reduce((sum, r) => sum + r.loadTime, 0) / validResults.length);
      const fastestPage = validResults.reduce((min, r) => r.loadTime < min.loadTime ? r : min);
      const slowestPage = validResults.reduce((max, r) => r.loadTime > max.loadTime ? r : max);
      
      console.log('\n' + '='.repeat(80));
      console.log('STATISTICS');
      console.log('='.repeat(80));
      console.log(`Average load time: ${avgLoadTime}ms`);
      console.log(`Fastest page: ${fastestPage.name} (${fastestPage.loadTime}ms)`);
      console.log(`Slowest page: ${slowestPage.name} (${slowestPage.loadTime}ms)`);
    }
    
    // Performance recommendations
    if (slowCount > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('RECOMMENDATIONS');
      console.log('='.repeat(80));
      
      results.filter(r => r.status === 'SLOW').forEach(result => {
        console.log(`\n🔧 ${result.name}:`);
        
        if (result.name.includes('Search') || result.name.includes('Available')) {
          console.log('   - Add pagination to limit initial data load');
          console.log('   - Implement virtual scrolling for property lists');
          console.log('   - Cache search results');
        } else if (result.name.includes('Blog')) {
          console.log('   - Lazy load blog post content');
          console.log('   - Implement infinite scroll');
          console.log('   - Optimize images with CDN');
        } else if (result.name.includes('neighborhood')) {
          console.log('   - Cache neighborhood data');
          console.log('   - Lazy load map components');
          console.log('   - Optimize property images');
        } else if (result.name === 'Home') {
          console.log('   - Reduce initial bundle size');
          console.log('   - Lazy load below-the-fold content');
          console.log('   - Optimize hero images');
          console.log('   - Implement critical CSS');
        } else {
          console.log('   - Implement code splitting');
          console.log('   - Add page-level caching');
          console.log('   - Optimize component rendering');
        }
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  });
  
  test('Test authenticated pages with admin user', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TEST - AUTHENTICATED PAGES');
    console.log('='.repeat(80));
    
    // Try to login with admin credentials from env
    await page.goto(`${BASE_URL}/login`);
    
    // Use the admin email from .env
    await page.fill('input[type="email"]', 'zak.seid@gmail.com');
    await page.fill('input[type="password"]', 'password123'); // You'll need to provide the real password
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait briefly to see if login succeeds
    await page.waitForTimeout(2000);
    
    // Check if we're still on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('⚠️  Could not authenticate. Skipping auth-required pages.');
      console.log('   To test auth pages, update the test with valid credentials.');
      return;
    }
    
    console.log('✅ Authenticated successfully\n');
    
    const results: PerformanceResult[] = [];
    
    for (const route of AUTH_ROUTES) {
      const result = await measurePageLoad(page, route);
      results.push(result);
      
      const icon = result.status === 'PASS' ? '✅' : result.status === 'SLOW' ? '⚠️' : '❌';
      const timeStr = `${result.loadTime}ms`.padEnd(8);
      console.log(`${icon} ${result.name.padEnd(25)} ${timeStr} ${result.error || ''}`);
    }
    
    // Summary for auth pages
    console.log('\n' + '='.repeat(80));
    console.log('AUTH PAGES SUMMARY');
    console.log('='.repeat(80));
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    const slowCount = results.filter(r => r.status === 'SLOW').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    
    console.log(`✅ Passed: ${passCount}/${results.length}`);
    console.log(`⚠️  Slow: ${slowCount}/${results.length}`);
    console.log(`❌ Errors: ${errorCount}/${results.length}`);
    
    if (slowCount > 0) {
      console.log('\n' + '='.repeat(80));
      console.log(`SLOW AUTH PAGES (>${PERFORMANCE_THRESHOLD}ms)`);
      console.log('='.repeat(80));
      
      results.filter(r => r.status === 'SLOW').forEach(result => {
        console.log(`\n📍 ${result.name}`);
        console.log(`   Path: ${result.path}`);
        console.log(`   Load Time: ${result.loadTime}ms`);
        console.log(`   Over threshold by: ${result.loadTime - PERFORMANCE_THRESHOLD}ms`);
        
        // Specific recommendations for auth pages
        console.log('\n   Recommendations:');
        if (result.name.includes('Admin') || result.name.includes('Dashboard')) {
          console.log('   - Implement role-based lazy loading');
          console.log('   - Cache admin data with appropriate TTL');
          console.log('   - Use server-side pagination for user lists');
          console.log('   - Defer analytics calculations');
        } else if (result.name.includes('Listings')) {
          console.log('   - Paginate user listings');
          console.log('   - Lazy load listing management tools');
          console.log('   - Cache listing data locally');
        } else if (result.name.includes('Favorites')) {
          console.log('   - Implement virtual scrolling');
          console.log('   - Cache favorite status');
          console.log('   - Batch favorite operations');
        }
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  });
});