import { test, expect } from '@playwright/test';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 1000, // 1 second max
  apiCall: 500,   // 500ms max for API calls
  interaction: 200, // 200ms max for UI interactions
};

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@14forrent.com',
  password: 'Admin123!'
};

test.describe('Admin Section Comprehensive Performance Test', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.coverage.startJSCoverage();
    
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console Error:', msg.text());
      }
    });

    // Monitor network requests
    page.on('request', request => {
      console.log(`Request: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      const timing = response.timing();
      
      if (timing) {
        console.log(`Response: ${status} ${url} - ${timing.responseEnd}ms`);
      }
      
      if (status >= 400) {
        console.error(`Error Response: ${status} ${url}`);
      }
    });
  });

  test('Login Performance', async ({ page }) => {
    console.log('\n=== Testing Login Performance ===');
    
    const startTime = Date.now();
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
    const loginPageLoadTime = Date.now() - startTime;
    
    console.log(`Login page load time: ${loginPageLoadTime}ms`);
    expect(loginPageLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

    // Fill login form
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    
    // Measure login submission time
    const loginStartTime = Date.now();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);
    const loginTime = Date.now() - loginStartTime;
    
    console.log(`Login submission time: ${loginTime}ms`);
    expect(loginTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad * 2);

    // Wait for admin dashboard
    await page.waitForURL('**/admin/**', { timeout: 5000 });
  });

  test('Dashboard Performance - All Tabs', async ({ page }) => {
    console.log('\n=== Testing Dashboard Performance ===');
    
    // Login first
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Test main dashboard
    const dashboardStartTime = Date.now();
    await page.goto('http://localhost:8080/admin', { waitUntil: 'networkidle' });
    const dashboardLoadTime = Date.now() - dashboardStartTime;
    
    console.log(`Dashboard load time: ${dashboardLoadTime}ms`);
    expect(dashboardLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

    // Test dashboard tabs if they exist
    const tabs = await page.$$('[role="tab"], .tab-button, [data-tab]');
    console.log(`Found ${tabs.length} dashboard tabs`);
    
    for (let i = 0; i < tabs.length; i++) {
      const tabText = await tabs[i].textContent();
      const tabStartTime = Date.now();
      await tabs[i].click();
      await page.waitForTimeout(100); // Wait for content to render
      const tabLoadTime = Date.now() - tabStartTime;
      
      console.log(`Tab "${tabText}" load time: ${tabLoadTime}ms`);
      expect(tabLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction);
    }

    // Check for stat cards loading
    const statCards = await page.$$('.stat-card, [data-testid="stat-card"]');
    console.log(`Found ${statCards.length} stat cards`);
  });

  test('Properties Section Performance', async ({ page }) => {
    console.log('\n=== Testing Properties Section Performance ===');
    
    // Login first
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Navigate to properties
    const propertiesStartTime = Date.now();
    await page.goto('http://localhost:8080/admin/listings', { waitUntil: 'networkidle' });
    const propertiesLoadTime = Date.now() - propertiesStartTime;
    
    console.log(`Properties list load time: ${propertiesLoadTime}ms`);
    expect(propertiesLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

    // Test pagination if available
    const paginationButtons = await page.$$('.pagination button, [aria-label*="page"]');
    if (paginationButtons.length > 0) {
      console.log(`Testing pagination with ${paginationButtons.length} buttons`);
      
      const nextButton = await page.$('[aria-label*="next"], .pagination button:has-text("Next")');
      if (nextButton) {
        const paginationStartTime = Date.now();
        await nextButton.click();
        await page.waitForTimeout(200);
        const paginationTime = Date.now() - paginationStartTime;
        
        console.log(`Pagination load time: ${paginationTime}ms`);
        expect(paginationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiCall);
      }
    }

    // Test property detail view
    const propertyLinks = await page.$$('a[href*="/admin/listings/"], .property-link');
    if (propertyLinks.length > 0) {
      const detailStartTime = Date.now();
      await propertyLinks[0].click();
      await page.waitForLoadState('networkidle');
      const detailLoadTime = Date.now() - detailStartTime;
      
      console.log(`Property detail load time: ${detailLoadTime}ms`);
      expect(detailLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    }
  });

  test('Reach-outs Section Performance', async ({ page }) => {
    console.log('\n=== Testing Reach-outs Section Performance ===');
    
    // Login first
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Navigate to reach-outs
    const reachoutsStartTime = Date.now();
    await page.goto('http://localhost:8080/admin/reachouts', { waitUntil: 'networkidle' });
    const reachoutsLoadTime = Date.now() - reachoutsStartTime;
    
    console.log(`Reach-outs load time: ${reachoutsLoadTime}ms`);
    expect(reachoutsLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

    // Test tabs within reach-outs
    const reachoutTabs = await page.$$('[role="tab"], .reachout-tab');
    console.log(`Found ${reachoutTabs.length} reach-out tabs`);
    
    for (const tab of reachoutTabs) {
      const tabText = await tab.textContent();
      const tabStartTime = Date.now();
      await tab.click();
      await page.waitForTimeout(100);
      const tabTime = Date.now() - tabStartTime;
      
      console.log(`Reach-out tab "${tabText}" load time: ${tabTime}ms`);
      expect(tabTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction);
    }
  });

  test('AI Settings Performance', async ({ page }) => {
    console.log('\n=== Testing AI Settings Performance ===');
    
    // Login first
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Navigate to AI settings
    const aiSettingsStartTime = Date.now();
    await page.goto('http://localhost:8080/admin/ai-settings', { waitUntil: 'networkidle' });
    const aiSettingsLoadTime = Date.now() - aiSettingsStartTime;
    
    console.log(`AI Settings load time: ${aiSettingsLoadTime}ms`);
    expect(aiSettingsLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

    // Test AI settings tabs
    const aiTabs = await page.$$('[role="tab"], .ai-settings-tab');
    console.log(`Found ${aiTabs.length} AI settings tabs`);
    
    for (const tab of aiTabs) {
      const tabText = await tab.textContent();
      const tabStartTime = Date.now();
      await tab.click();
      await page.waitForTimeout(100);
      const tabTime = Date.now() - tabStartTime;
      
      console.log(`AI settings tab "${tabText}" load time: ${tabTime}ms`);
      expect(tabTime).toBeLessThan(PERFORMANCE_THRESHOLDS.interaction);
    }
  });

  test('Users Management Performance', async ({ page }) => {
    console.log('\n=== Testing Users Management Performance ===');
    
    // Login first
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Navigate to users
    const usersStartTime = Date.now();
    await page.goto('http://localhost:8080/admin/users', { waitUntil: 'networkidle' });
    const usersLoadTime = Date.now() - usersStartTime;
    
    console.log(`Users list load time: ${usersLoadTime}ms`);
    expect(usersLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);

    // Test user search/filter
    const searchInput = await page.$('input[placeholder*="Search"], input[type="search"]');
    if (searchInput) {
      const searchStartTime = Date.now();
      await searchInput.fill('test');
      await page.waitForTimeout(300); // Debounce time
      const searchTime = Date.now() - searchStartTime;
      
      console.log(`User search time: ${searchTime}ms`);
      expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiCall);
    }
  });

  test('Performance Metrics Summary', async ({ page }) => {
    console.log('\n=== Performance Metrics Summary ===');
    
    // Login
    await page.goto('http://localhost:8080/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Collect performance metrics for all admin pages
    const pages = [
      { name: 'Dashboard', url: '/admin' },
      { name: 'Properties', url: '/admin/listings' },
      { name: 'Reach-outs', url: '/admin/reachouts' },
      { name: 'AI Settings', url: '/admin/ai-settings' },
      { name: 'Users', url: '/admin/users' },
      { name: 'Analytics', url: '/admin/analytics' },
      { name: 'Settings', url: '/admin/settings' }
    ];

    const results = [];
    
    for (const pageInfo of pages) {
      try {
        const startTime = Date.now();
        await page.goto(`http://localhost:8080${pageInfo.url}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        const loadTime = Date.now() - startTime;
        
        // Get performance metrics
        const metrics = await page.evaluate(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          return {
            domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
            loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
            domInteractive: Math.round(perfData.domInteractive),
            resourceCount: performance.getEntriesByType('resource').length
          };
        });
        
        results.push({
          page: pageInfo.name,
          loadTime,
          ...metrics,
          status: loadTime < PERFORMANCE_THRESHOLDS.pageLoad ? 'PASS' : 'FAIL'
        });
        
      } catch (error) {
        results.push({
          page: pageInfo.name,
          error: error.message,
          status: 'ERROR'
        });
      }
    }

    // Print summary table
    console.log('\n=== PERFORMANCE TEST RESULTS ===\n');
    console.table(results);
    
    // Check for failures
    const failures = results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('\n⚠️ PERFORMANCE ISSUES DETECTED:');
      failures.forEach(f => {
        console.log(`  - ${f.page}: ${f.loadTime}ms (exceeds ${PERFORMANCE_THRESHOLDS.pageLoad}ms threshold)`);
      });
    }
    
    // Calculate average load time
    const validResults = results.filter(r => r.loadTime);
    const avgLoadTime = validResults.reduce((sum, r) => sum + r.loadTime, 0) / validResults.length;
    console.log(`\n📊 Average load time: ${Math.round(avgLoadTime)}ms`);
    
    expect(failures.length).toBe(0);
  });
});