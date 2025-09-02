import { test, Page, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const BASE_URL = 'http://localhost:8081';
const PERFORMANCE_THRESHOLD = 3000; // 3 seconds for property pages
const TEST_ITERATIONS = 3; // Test each property 3 times

// Supabase client for fetching property IDs
const supabaseUrl = 'https://hdigtojmeagwaqdknblj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWd0b2ptZWFnd2FxZGtuYmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDU3ODMsImV4cCI6MjA2MzEyMTc4M30.tKQ9KkrUwSI8sQRSjMljBBs3QMAX0LvI0CaxnGoOzJ0';
const supabase = createClient(supabaseUrl, supabaseKey);

interface PropertyTestResult {
  id: string;
  title: string;
  iteration: number;
  loadTime: number;
  status: 'PASS' | 'SLOW' | 'VERY_SLOW' | 'ERROR';
  error?: string;
  loggedIn: boolean;
  dataLoaded: boolean;
  imagesLoaded: number;
}

interface PropertyInfo {
  id: string;
  title: string;
  images?: string[];
}

// Fetch all property IDs from database
async function fetchAllProperties(): Promise<PropertyInfo[]> {
  console.log('Fetching all properties from database...');
  
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, images')
    .neq('status', 'sold')
    .order('created_at', { ascending: false })
    .limit(20); // Test first 20 properties to keep test reasonable
  
  if (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
  
  return data || [];
}

// Measure property page load with detailed metrics
async function measurePropertyLoad(
  page: Page, 
  property: PropertyInfo, 
  iteration: number,
  loggedIn: boolean
): Promise<PropertyTestResult> {
  const startTime = Date.now();
  const result: PropertyTestResult = {
    id: property.id,
    title: property.title,
    iteration,
    loadTime: 0,
    status: 'PASS',
    loggedIn,
    dataLoaded: false,
    imagesLoaded: 0
  };
  
  try {
    // Navigate to property page
    const response = await page.goto(`${BASE_URL}/property/${property.id}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Check if page loaded successfully
    if (!response || response.status() >= 400) {
      result.status = 'ERROR';
      result.error = `HTTP ${response?.status()}`;
      result.loadTime = Date.now() - startTime;
      return result;
    }
    
    // Wait for property title to appear (indicates basic data loaded)
    try {
      await page.waitForSelector('h1', { timeout: 10000 });
      result.dataLoaded = true;
    } catch {
      console.log(`Property ${property.id}: Title not found within 10s`);
    }
    
    // Count loaded images
    const images = await page.$$('img[src*="supabase"]');
    result.imagesLoaded = images.length;
    
    // Check for contact info (indicates full load)
    const hasContactInfo = await page.$('.contact-info, [data-testid="contact-info"]') !== null;
    
    // Calculate final load time
    result.loadTime = Date.now() - startTime;
    
    // Determine status based on load time
    if (result.loadTime < PERFORMANCE_THRESHOLD) {
      result.status = 'PASS';
    } else if (result.loadTime < PERFORMANCE_THRESHOLD * 2) {
      result.status = 'SLOW';
    } else {
      result.status = 'VERY_SLOW';
    }
    
    // Additional performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
        loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
        domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Log detailed metrics for slow pages
    if (result.status !== 'PASS') {
      console.log(`\n  Performance Details for ${property.id}:`);
      console.log(`    DOM Interactive: ${performanceMetrics.domInteractive}ms`);
      console.log(`    DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
      console.log(`    First Contentful Paint: ${Math.round(performanceMetrics.firstContentfulPaint)}ms`);
      console.log(`    Images Loaded: ${result.imagesLoaded}`);
      console.log(`    Has Contact Info: ${hasContactInfo}`);
    }
    
  } catch (error: any) {
    result.status = 'ERROR';
    result.error = error.message;
    result.loadTime = Date.now() - startTime;
  }
  
  return result;
}

// Login helper
async function login(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check if login successful
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

test.describe('Comprehensive Property Performance Test', () => {
  test('Test all properties multiple times - logged out', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('PROPERTY PERFORMANCE TEST - LOGGED OUT');
    console.log('='.repeat(80));
    console.log(`Threshold: ${PERFORMANCE_THRESHOLD}ms`);
    console.log(`Iterations per property: ${TEST_ITERATIONS}\n`);
    
    // Fetch all properties
    const properties = await fetchAllProperties();
    console.log(`Found ${properties.length} properties to test\n`);
    
    if (properties.length === 0) {
      console.log('No properties found in database!');
      return;
    }
    
    const results: PropertyTestResult[] = [];
    
    // Test each property multiple times
    for (let iteration = 1; iteration <= TEST_ITERATIONS; iteration++) {
      console.log(`\n--- Iteration ${iteration} of ${TEST_ITERATIONS} ---\n`);
      
      for (const property of properties) {
        const result = await measurePropertyLoad(page, property, iteration, false);
        results.push(result);
        
        const icon = result.status === 'PASS' ? '✅' : 
                    result.status === 'SLOW' ? '⚠️' : 
                    result.status === 'VERY_SLOW' ? '🔴' : '❌';
        const timeStr = `${result.loadTime}ms`.padEnd(8);
        console.log(`${icon} ${property.title.substring(0, 30).padEnd(30)} ${timeStr} [${result.imagesLoaded} imgs]`);
        
        // Clear cache between properties to simulate real user behavior
        if (iteration === 1) {
          await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });
        }
      }
    }
    
    // Analyze results
    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS - LOGGED OUT');
    console.log('='.repeat(80));
    
    // Group results by property
    const propertyAnalysis = new Map<string, PropertyTestResult[]>();
    results.forEach(result => {
      if (!propertyAnalysis.has(result.id)) {
        propertyAnalysis.set(result.id, []);
      }
      propertyAnalysis.get(result.id)!.push(result);
    });
    
    // Find consistently slow properties
    const slowProperties: string[] = [];
    const verySlowProperties: string[] = [];
    
    propertyAnalysis.forEach((results, propertyId) => {
      const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
      const maxLoadTime = Math.max(...results.map(r => r.loadTime));
      const minLoadTime = Math.min(...results.map(r => r.loadTime));
      
      console.log(`\nProperty: ${results[0].title}`);
      console.log(`  Avg Load Time: ${Math.round(avgLoadTime)}ms`);
      console.log(`  Min/Max: ${minLoadTime}ms / ${maxLoadTime}ms`);
      console.log(`  Variance: ${maxLoadTime - minLoadTime}ms`);
      
      if (avgLoadTime > PERFORMANCE_THRESHOLD * 2) {
        verySlowProperties.push(propertyId);
      } else if (avgLoadTime > PERFORMANCE_THRESHOLD) {
        slowProperties.push(propertyId);
      }
    });
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY - LOGGED OUT');
    console.log('='.repeat(80));
    console.log(`Total tests: ${results.length}`);
    console.log(`Properties tested: ${properties.length}`);
    console.log(`Iterations per property: ${TEST_ITERATIONS}`);
    console.log(`\nPerformance breakdown:`);
    console.log(`  ✅ Fast (<${PERFORMANCE_THRESHOLD}ms): ${results.filter(r => r.status === 'PASS').length}`);
    console.log(`  ⚠️ Slow (${PERFORMANCE_THRESHOLD}-${PERFORMANCE_THRESHOLD*2}ms): ${results.filter(r => r.status === 'SLOW').length}`);
    console.log(`  🔴 Very Slow (>${PERFORMANCE_THRESHOLD*2}ms): ${results.filter(r => r.status === 'VERY_SLOW').length}`);
    console.log(`  ❌ Errors: ${results.filter(r => r.status === 'ERROR').length}`);
    
    if (verySlowProperties.length > 0) {
      console.log(`\n🔴 Consistently VERY SLOW properties (>${PERFORMANCE_THRESHOLD*2}ms avg):`);
      verySlowProperties.forEach(id => {
        const prop = properties.find(p => p.id === id);
        console.log(`  - ${prop?.title} (${id})`);
      });
    }
    
    if (slowProperties.length > 0) {
      console.log(`\n⚠️ Consistently SLOW properties (>${PERFORMANCE_THRESHOLD}ms avg):`);
      slowProperties.forEach(id => {
        const prop = properties.find(p => p.id === id);
        console.log(`  - ${prop?.title} (${id})`);
      });
    }
  });
  
  test('Test all properties multiple times - logged in', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('PROPERTY PERFORMANCE TEST - LOGGED IN');
    console.log('='.repeat(80));
    
    // Login first
    const loginSuccess = await login(page, 'test@example.com', 'password123');
    if (!loginSuccess) {
      console.log('⚠️ Could not login. Using jason@14forrent.com');
      const adminLogin = await login(page, 'jason@14forrent.com', 'admin123');
      if (!adminLogin) {
        console.log('❌ Login failed. Skipping logged-in tests.');
        return;
      }
    }
    console.log('✅ Logged in successfully\n');
    
    // Fetch all properties
    const properties = await fetchAllProperties();
    console.log(`Testing ${properties.length} properties while logged in\n`);
    
    const results: PropertyTestResult[] = [];
    
    // Test each property multiple times
    for (let iteration = 1; iteration <= TEST_ITERATIONS; iteration++) {
      console.log(`\n--- Iteration ${iteration} of ${TEST_ITERATIONS} ---\n`);
      
      for (const property of properties) {
        const result = await measurePropertyLoad(page, property, iteration, true);
        results.push(result);
        
        const icon = result.status === 'PASS' ? '✅' : 
                    result.status === 'SLOW' ? '⚠️' : 
                    result.status === 'VERY_SLOW' ? '🔴' : '❌';
        const timeStr = `${result.loadTime}ms`.padEnd(8);
        console.log(`${icon} ${property.title.substring(0, 30).padEnd(30)} ${timeStr} [${result.imagesLoaded} imgs]`);
      }
    }
    
    // Compare logged in vs logged out performance
    console.log('\n' + '='.repeat(80));
    console.log('LOGGED IN PERFORMANCE ANALYSIS');
    console.log('='.repeat(80));
    
    const avgLoggedInTime = Math.round(results.reduce((sum, r) => sum + r.loadTime, 0) / results.length);
    console.log(`Average load time (logged in): ${avgLoggedInTime}ms`);
    
    // Identify authentication-related slowdowns
    const authSlowProperties = results.filter(r => r.status === 'VERY_SLOW' || r.status === 'SLOW');
    if (authSlowProperties.length > 0) {
      console.log('\n⚠️ Properties slower when logged in:');
      authSlowProperties.forEach(r => {
        console.log(`  - ${r.title}: ${r.loadTime}ms`);
      });
    }
  });
  
  test('Identify specific bottlenecks', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('BOTTLENECK ANALYSIS');
    console.log('='.repeat(80));
    
    // Test a slow property with detailed analysis
    const properties = await fetchAllProperties();
    if (properties.length === 0) return;
    
    // Find property with most images (likely slowest)
    const propertyWithMostImages = properties.reduce((max, p) => 
      (p.images?.length || 0) > (max.images?.length || 0) ? p : max
    );
    
    console.log(`\nAnalyzing property with most images: ${propertyWithMostImages.title}`);
    console.log(`Number of images: ${propertyWithMostImages.images?.length || 0}\n`);
    
    // Enable request interception to track network calls
    await page.route('**/*', route => route.continue());
    
    const networkRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          startTime: Date.now()
        });
      }
    });
    
    page.on('response', response => {
      const request = networkRequests.find(r => r.url === response.url());
      if (request) {
        request.endTime = Date.now();
        request.duration = request.endTime - request.startTime;
        request.status = response.status();
        request.size = response.headers()['content-length'] || 0;
      }
    });
    
    // Load the property
    await page.goto(`${BASE_URL}/property/${propertyWithMostImages.id}`, {
      waitUntil: 'networkidle'
    });
    
    // Analyze network requests
    console.log('Network Analysis:');
    console.log('-'.repeat(80));
    
    // Group requests by type
    const apiCalls = networkRequests.filter(r => r.url.includes('/rest/'));
    const imageCalls = networkRequests.filter(r => r.url.includes('/storage/'));
    
    console.log(`\nAPI Calls: ${apiCalls.length}`);
    apiCalls.forEach(call => {
      const urlPart = call.url.split('/rest/v1/')[1]?.split('?')[0] || call.url;
      console.log(`  - ${urlPart}: ${call.duration}ms`);
    });
    
    console.log(`\nImage Loads: ${imageCalls.length}`);
    const totalImageTime = imageCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    console.log(`  Total image loading time: ${totalImageTime}ms`);
    
    // Find slowest requests
    const slowestRequests = networkRequests
      .filter(r => r.duration)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    console.log('\nSlowest Requests:');
    slowestRequests.forEach(req => {
      const urlPart = req.url.split('.co/')[1]?.substring(0, 50) || req.url;
      console.log(`  - ${urlPart}: ${req.duration}ms`);
    });
    
    // Recommendations based on analysis
    console.log('\n' + '='.repeat(80));
    console.log('SPECIFIC RECOMMENDATIONS');
    console.log('='.repeat(80));
    
    if (apiCalls.length > 3) {
      console.log('\n🔧 Too many API calls detected');
      console.log('   - Combine multiple queries into single RPC function');
      console.log('   - Use database views for complex joins');
    }
    
    if (imageCalls.length > 10) {
      console.log('\n🔧 Too many image requests');
      console.log('   - Implement progressive image loading');
      console.log('   - Use image sprites or lazy loading');
      console.log('   - Consider image CDN with optimization');
    }
    
    if (totalImageTime > 5000) {
      console.log('\n🔧 Slow image loading');
      console.log('   - Optimize image sizes (use WebP)');
      console.log('   - Implement responsive images');
      console.log('   - Add CDN with geographic distribution');
    }
    
    const avgApiTime = apiCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / apiCalls.length;
    if (avgApiTime > 1000) {
      console.log('\n🔧 Slow API responses');
      console.log('   - Add database indexes');
      console.log('   - Optimize RLS policies');
      console.log('   - Implement connection pooling');
      console.log('   - Consider database read replicas');
    }
  });
});