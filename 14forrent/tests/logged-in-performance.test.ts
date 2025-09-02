import { test, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:8082';
const supabase = createClient(
  'https://hdigtojmeagwaqdknblj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWd0b2ptZWFnd2FxZGtuYmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDU3ODMsImV4cCI6MjA2MzEyMTc4M30.tKQ9KkrUwSI8sQRSjMljBBs3QMAX0LvI0CaxnGoOzJ0'
);

interface NetworkRequest {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  size?: string;
}

test('Comprehensive Logged-In Performance Test - zak.seid@gmail.com', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 LOGGED-IN PERFORMANCE ANALYSIS');
  console.log('='.repeat(80));
  console.log('Testing with: zak.seid@gmail.com\n');

  // Login first
  console.log('📝 Logging in...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'zak.seid@gmail.com');
  await page.fill('input[type="password"]', 'Neurobit@123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForTimeout(3000);
  
  // Verify login success
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    console.log('❌ Login failed - check credentials');
    return;
  }
  console.log('✅ Logged in successfully\n');

  // Fetch all properties
  const { data: properties } = await supabase
    .from('listings')
    .select('id, title, images')
    .neq('status', 'sold')
    .order('created_at', { ascending: false })
    .limit(10); // Test first 10 properties

  if (!properties || properties.length === 0) {
    console.log('No properties found');
    return;
  }

  console.log(`📊 Testing ${properties.length} properties (3 iterations each)\n`);

  // Track all results
  const allResults: any[] = [];
  const slowRequests: NetworkRequest[] = [];

  // Test each property 3 times
  for (let iteration = 1; iteration <= 3; iteration++) {
    console.log(`\n--- ITERATION ${iteration} ---\n`);
    
    for (const property of properties) {
      const networkRequests: NetworkRequest[] = [];
      
      // Set up network monitoring
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
        const request = networkRequests.find(r => r.url === response.url() && !r.endTime);
        if (request) {
          request.endTime = Date.now();
          request.duration = request.endTime - request.startTime;
          request.status = response.status();
          
          // Track slow requests (>1 second)
          if (request.duration > 1000) {
            slowRequests.push(request);
          }
        }
      });

      const startTime = Date.now();
      
      try {
        // Navigate to property page
        await page.goto(`${BASE_URL}/property/${property.id}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        // Wait for content to load
        await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});
        
        const loadTime = Date.now() - startTime;
        const imageCount = property.images?.length || 0;
        
        // Analyze network requests
        const apiCalls = networkRequests.filter(r => r.url.includes('/rest/'));
        const storageCalls = networkRequests.filter(r => r.url.includes('/storage/'));
        const rpcCalls = networkRequests.filter(r => r.url.includes('/rpc/'));
        
        const result = {
          iteration,
          propertyId: property.id,
          title: property.title.substring(0, 30),
          loadTime,
          imageCount,
          apiCalls: apiCalls.length,
          storageCalls: storageCalls.length,
          rpcCalls: rpcCalls.length,
          totalRequests: networkRequests.length
        };
        
        allResults.push(result);
        
        const status = loadTime < 3000 ? '✅' : loadTime < 6000 ? '⚠️' : '🔴';
        console.log(`${status} ${property.title.substring(0, 35).padEnd(35)} ${loadTime}ms [${apiCalls.length} API, ${storageCalls.length} IMG, ${rpcCalls.length} RPC]`);
        
        // Log slow API calls
        if (loadTime > 6000) {
          console.log(`  ⚠️ Slow requests detected:`);
          networkRequests
            .filter(r => r.duration && r.duration > 1000)
            .forEach(req => {
              const urlPart = req.url.split('.co/')[1]?.substring(0, 50) || req.url;
              console.log(`     - ${urlPart}: ${req.duration}ms`);
            });
        }
        
      } catch (error: any) {
        console.log(`❌ ${property.title.substring(0, 35).padEnd(35)} ERROR: ${error.message}`);
      }
      
      // Clear event listeners
      page.removeAllListeners('request');
      page.removeAllListeners('response');
      
      // Clear cache/cookies between properties to simulate real users
      if (iteration === 1) {
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }
    }
  }

  // Analysis
  console.log('\n' + '='.repeat(80));
  console.log('📈 PERFORMANCE ANALYSIS - LOGGED IN');
  console.log('='.repeat(80));

  // Group by property
  const propertyStats = new Map();
  allResults.forEach(result => {
    if (!propertyStats.has(result.propertyId)) {
      propertyStats.set(result.propertyId, []);
    }
    propertyStats.get(result.propertyId).push(result);
  });

  // Find consistently slow properties
  console.log('\n🐌 SLOW PROPERTIES (Average > 6s):');
  propertyStats.forEach((results, propertyId) => {
    const avgLoadTime = Math.round(results.reduce((sum: number, r: any) => sum + r.loadTime, 0) / results.length);
    if (avgLoadTime > 6000) {
      console.log(`\n📍 ${results[0].title}`);
      console.log(`   Average: ${avgLoadTime}ms`);
      console.log(`   Times: ${results.map((r: any) => r.loadTime + 'ms').join(', ')}`);
      console.log(`   API Calls: ${results[0].apiCalls}`);
      console.log(`   Image Count: ${results[0].imageCount}`);
    }
  });

  // Identify common slow requests
  console.log('\n🔴 SLOWEST REQUESTS (> 1 second):');
  const requestTypes = new Map();
  slowRequests.forEach(req => {
    const type = req.url.includes('/rest/') ? 'API' : 
                 req.url.includes('/storage/') ? 'Storage' : 
                 req.url.includes('/rpc/') ? 'RPC' : 'Other';
    
    if (!requestTypes.has(type)) {
      requestTypes.set(type, []);
    }
    requestTypes.get(type).push(req);
  });

  requestTypes.forEach((requests, type) => {
    console.log(`\n${type} Requests:`);
    const sorted = requests.sort((a: any, b: any) => b.duration - a.duration).slice(0, 5);
    sorted.forEach((req: any) => {
      const urlPart = req.url.split('.co/')[1]?.substring(0, 60) || req.url;
      console.log(`  - ${urlPart}: ${req.duration}ms`);
    });
  });

  // Overall statistics
  const avgLoadTime = Math.round(allResults.reduce((sum, r) => sum + r.loadTime, 0) / allResults.length);
  const maxLoadTime = Math.max(...allResults.map(r => r.loadTime));
  const minLoadTime = Math.min(...allResults.map(r => r.loadTime));

  console.log('\n' + '='.repeat(80));
  console.log('📊 OVERALL STATISTICS');
  console.log('='.repeat(80));
  console.log(`Average Load Time: ${avgLoadTime}ms`);
  console.log(`Min/Max: ${minLoadTime}ms / ${maxLoadTime}ms`);
  console.log(`Total Tests: ${allResults.length}`);
  
  const under3s = allResults.filter(r => r.loadTime < 3000).length;
  const under6s = allResults.filter(r => r.loadTime < 6000).length;
  const over10s = allResults.filter(r => r.loadTime > 10000).length;
  
  console.log(`\nPerformance Breakdown:`);
  console.log(`  ✅ Fast (<3s): ${under3s}/${allResults.length} (${Math.round(under3s/allResults.length*100)}%)`);
  console.log(`  ⚠️ Moderate (3-6s): ${under6s - under3s}/${allResults.length} (${Math.round((under6s - under3s)/allResults.length*100)}%)`);
  console.log(`  🔴 Slow (>10s): ${over10s}/${allResults.length} (${Math.round(over10s/allResults.length*100)}%)`);

  console.log('\n' + '='.repeat(80));
  console.log('🔍 POTENTIAL ISSUES IDENTIFIED');
  console.log('='.repeat(80));
  
  // Check for patterns
  const avgApiCalls = Math.round(allResults.reduce((sum, r) => sum + r.apiCalls, 0) / allResults.length);
  const avgRpcCalls = Math.round(allResults.reduce((sum, r) => sum + r.rpcCalls, 0) / allResults.length);
  
  if (avgApiCalls > 5) {
    console.log('\n⚠️ Too many API calls per page load');
    console.log(`   Average: ${avgApiCalls} calls`);
    console.log('   Solution: Combine queries into single RPC function');
  }
  
  if (avgRpcCalls === 0) {
    console.log('\n⚠️ RPC functions not being used');
    console.log('   Solution: Ensure get_property_optimized RPC is deployed and working');
  }
  
  if (avgLoadTime > 5000) {
    console.log('\n⚠️ Authentication may be adding overhead');
    console.log('   Solution: Check RLS policies and auth middleware performance');
  }

  // Check for specific slow endpoints
  const endpoints = new Map();
  slowRequests.forEach(req => {
    const endpoint = req.url.split('?')[0].split('.co/')[1] || req.url;
    if (!endpoints.has(endpoint)) {
      endpoints.set(endpoint, { count: 0, totalTime: 0 });
    }
    const data = endpoints.get(endpoint);
    data.count++;
    data.totalTime += req.duration || 0;
  });

  console.log('\n🔴 PROBLEMATIC ENDPOINTS:');
  endpoints.forEach((data, endpoint) => {
    const avgTime = Math.round(data.totalTime / data.count);
    if (avgTime > 2000) {
      console.log(`  - ${endpoint.substring(0, 50)}: ${avgTime}ms avg (${data.count} calls)`);
    }
  });

  console.log('\n' + '='.repeat(80) + '\n');
});