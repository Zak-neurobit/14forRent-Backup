import { test, expect, Page } from '@playwright/test';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 1000, // 1 second max
  apiCall: 500,   // 500ms max for API calls
  interaction: 200, // 200ms max for UI interactions
};

// Admin credentials - using actual admin emails from the system
const ADMIN_CREDENTIALS = {
  email: 'zak.seid@gmail.com',
  password: 'Neurobit@123'
};

// Helper to measure performance
async function measurePageLoad(page: Page, url: string, name: string) {
  const startTime = Date.now();
  
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics from the browser
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');
      
      // Get slowest resources
      const slowResources = resources
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .map(r => ({
          name: r.name.split('/').pop() || r.name,
          duration: Math.round(r.duration),
          size: (r as any).transferSize || 0
        }));
      
      return {
        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
        loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart),
        domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
        resourceCount: resources.length,
        totalResourceTime: Math.round(resources.reduce((sum, r) => sum + r.duration, 0)),
        slowestResources: slowResources
      };
    });
    
    return {
      name,
      loadTime,
      ...metrics,
      status: loadTime < PERFORMANCE_THRESHOLDS.pageLoad ? 'PASS' : 'FAIL'
    };
  } catch (error) {
    return {
      name,
      error: error.message,
      status: 'ERROR'
    };
  }
}

test.describe('Admin Section Performance Analysis', () => {
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    // Create a persistent context for all tests
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text());
      }
    });
    
    // Login once for all tests
    console.log('Logging in as admin...');
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);
    
    // Verify we're logged in and on admin page
    await page.waitForURL('**/admin/**', { timeout: 10000 }).catch(() => {
      console.log('Note: May not have redirected to admin page automatically');
    });
  });
  
  test('Complete Admin Section Performance Analysis', async () => {
    console.log('\n🔍 STARTING COMPREHENSIVE PERFORMANCE ANALYSIS\n');
    
    const results = [];
    
    // Test main admin sections
    const sections = [
      { name: 'Dashboard', url: 'http://localhost:8080/admin' },
      { name: 'Properties List', url: 'http://localhost:8080/admin/listings' },
      { name: 'Reach-outs', url: 'http://localhost:8080/admin/reachouts' },
      { name: 'AI Settings', url: 'http://localhost:8080/admin/ai-settings' },
      { name: 'Users', url: 'http://localhost:8080/admin/users' },
      { name: 'Analytics', url: 'http://localhost:8080/admin/analytics' },
      { name: 'Settings', url: 'http://localhost:8080/admin/settings' }
    ];
    
    // Test each section
    for (const section of sections) {
      console.log(`Testing ${section.name}...`);
      const result = await measurePageLoad(page, section.url, section.name);
      results.push(result);
      
      // If page loaded successfully, test sub-components
      if (result.status !== 'ERROR') {
        // Test tabs within the page
        const tabs = await page.$$('[role="tab"], .tab-button, button[data-state="inactive"]');
        console.log(`  Found ${tabs.length} tabs in ${section.name}`);
        
        for (let i = 0; i < Math.min(tabs.length, 3); i++) { // Test first 3 tabs
          const tabText = await tabs[i].textContent();
          const tabStartTime = Date.now();
          await tabs[i].click();
          await page.waitForTimeout(200); // Wait for content
          const tabLoadTime = Date.now() - tabStartTime;
          
          console.log(`    Tab "${tabText?.trim()}": ${tabLoadTime}ms`);
        }
      }
      
      // Small delay between sections
      await page.waitForTimeout(500);
    }
    
    // Print detailed results
    console.log('\n📊 PERFORMANCE TEST RESULTS\n');
    console.log('═══════════════════════════════════════════════════════════════');
    
    for (const result of results) {
      console.log(`\n📄 ${result.name}`);
      console.log('─'.repeat(60));
      
      if (result.status === 'ERROR') {
        console.log(`  ❌ ERROR: ${result.error}`);
      } else {
        console.log(`  Status: ${result.status === 'PASS' ? '✅ PASS' : '⚠️ FAIL'}`);
        console.log(`  Total Load Time: ${result.loadTime}ms`);
        console.log(`  DOM Content Loaded: ${result.domContentLoaded}ms`);
        console.log(`  DOM Interactive: ${result.domInteractive}ms`);
        console.log(`  Resources: ${result.resourceCount} files`);
        console.log(`  Total Resource Time: ${result.totalResourceTime}ms`);
        
        if (result.slowestResources?.length > 0) {
          console.log(`  \n  Slowest Resources:`);
          result.slowestResources.forEach(r => {
            console.log(`    - ${r.name}: ${r.duration}ms (${r.size} bytes)`);
          });
        }
      }
    }
    
    // Summary statistics
    const validResults = results.filter(r => r.loadTime);
    const avgLoadTime = validResults.reduce((sum, r) => sum + r.loadTime, 0) / validResults.length;
    const slowPages = results.filter(r => r.status === 'FAIL');
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📈 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Average Load Time: ${Math.round(avgLoadTime)}ms`);
    console.log(`  Pages Meeting Target: ${validResults.filter(r => r.status === 'PASS').length}/${validResults.length}`);
    console.log(`  Pages Exceeding 1s: ${slowPages.length}`);
    
    if (slowPages.length > 0) {
      console.log('\n⚠️ SLOW PAGES REQUIRING OPTIMIZATION:');
      slowPages.forEach(p => {
        console.log(`  - ${p.name}: ${p.loadTime}ms (${Math.round(p.loadTime / 1000 * 10) / 10}s)`);
      });
    }
    
    // Performance recommendations
    console.log('\n💡 PERFORMANCE OPTIMIZATION RECOMMENDATIONS:');
    
    const avgResources = validResults.reduce((sum, r) => sum + (r.resourceCount || 0), 0) / validResults.length;
    if (avgResources > 50) {
      console.log(`  - High resource count (avg: ${Math.round(avgResources)}). Consider:`);
      console.log('    • Bundling/code splitting');
      console.log('    • Lazy loading components');
      console.log('    • Optimizing images');
    }
    
    const avgResourceTime = validResults.reduce((sum, r) => sum + (r.totalResourceTime || 0), 0) / validResults.length;
    if (avgResourceTime > 2000) {
      console.log(`  - High total resource time (avg: ${Math.round(avgResourceTime)}ms). Consider:`);
      console.log('    • Implementing CDN');
      console.log('    • Enabling compression');
      console.log('    • Caching strategies');
    }
    
    if (avgLoadTime > 800) {
      console.log(`  - Pages loading slowly (avg: ${Math.round(avgLoadTime)}ms). Consider:`);
      console.log('    • Server-side rendering (SSR)');
      console.log('    • Progressive enhancement');
      console.log('    • Optimizing database queries');
    }
    
    // Fail test if any page exceeds threshold
    expect(slowPages.length).toBe(0);
  });
  
  test('Test Individual Property Page Performance', async () => {
    console.log('\n🏠 Testing Individual Property Page Performance\n');
    
    // Navigate to properties list first
    await page.goto('http://localhost:8080/admin/listings', { waitUntil: 'networkidle' });
    
    // Find property links
    const propertyLinks = await page.$$('a[href*="/property/"], a[href*="/admin/listings/"]');
    
    if (propertyLinks.length > 0) {
      // Test first 3 properties
      const testCount = Math.min(3, propertyLinks.length);
      console.log(`Testing ${testCount} property pages...`);
      
      for (let i = 0; i < testCount; i++) {
        const href = await propertyLinks[i].getAttribute('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `http://localhost:8080${href}`;
          const result = await measurePageLoad(page, fullUrl, `Property ${i + 1}`);
          
          console.log(`Property ${i + 1}: ${result.loadTime}ms - ${result.status}`);
          
          if (result.slowestResources?.length > 0) {
            console.log('  Slow resources:');
            result.slowestResources.slice(0, 3).forEach(r => {
              console.log(`    - ${r.name}: ${r.duration}ms`);
            });
          }
        }
      }
    } else {
      console.log('No property links found to test');
    }
  });
  
  test('Test Search and Filter Performance', async () => {
    console.log('\n🔍 Testing Search and Filter Performance\n');
    
    // Go to users page (has search)
    await page.goto('http://localhost:8080/admin/users', { waitUntil: 'networkidle' });
    
    const searchInput = await page.$('input[type="search"], input[placeholder*="Search"]');
    if (searchInput) {
      console.log('Testing search functionality...');
      
      const searchStartTime = Date.now();
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Wait for debounce
      const searchTime = Date.now() - searchStartTime;
      
      console.log(`Search response time: ${searchTime}ms`);
      expect(searchTime).toBeLessThan(1000);
    }
    
    // Test filters on properties page
    await page.goto('http://localhost:8080/admin/listings', { waitUntil: 'networkidle' });
    
    const filterButtons = await page.$$('button[aria-label*="filter"], .filter-button');
    if (filterButtons.length > 0) {
      console.log(`Testing ${filterButtons.length} filters...`);
      
      for (let i = 0; i < Math.min(2, filterButtons.length); i++) {
        const filterStartTime = Date.now();
        await filterButtons[i].click();
        await page.waitForTimeout(300);
        const filterTime = Date.now() - filterStartTime;
        
        console.log(`Filter ${i + 1} response time: ${filterTime}ms`);
      }
    }
  });
});