import { test, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:8082';
const PROPERTY_ID = 'e88a6d6c-5009-457e-8a30-57362f223327';

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
}

test('Diagnose slow property loading', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DIAGNOSING SLOW PROPERTY: ' + PROPERTY_ID);
  console.log('='.repeat(80) + '\n');

  // First, check the property data
  console.log('📊 Checking property data...');
  const { data: property, error } = await supabase
    .from('listings')
    .select('id, title, images, user_id, created_at')
    .eq('id', PROPERTY_ID)
    .single();

  if (error || !property) {
    console.log('❌ Property not found in database!');
    return;
  }

  console.log(`✅ Property found: ${property.title}`);
  console.log(`   Image count: ${property.images?.length || 0}`);
  console.log(`   Created: ${property.created_at}\n`);

  // Test loading as logged out user
  console.log('🚀 Test 1: Loading as LOGGED OUT user...');
  await testPropertyLoad(page, false);

  // Test loading as logged in user
  console.log('\n🚀 Test 2: Loading as LOGGED IN user...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'zak.seid@gmail.com');
  await page.fill('input[type="password"]', 'Neurobit@123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  await testPropertyLoad(page, true);

  // Check image sizes
  console.log('\n📷 Analyzing images...');
  if (property.images && property.images.length > 0) {
    console.log(`Total images: ${property.images.length}`);
    
    // Check first 5 images
    for (let i = 0; i < Math.min(5, property.images.length); i++) {
      const imgPath = property.images[i];
      console.log(`  Image ${i + 1}: ${imgPath}`);
    }
  }
});

async function testPropertyLoad(page: Page, loggedIn: boolean) {
  const networkRequests: NetworkRequest[] = [];
  const resourceTimings: any[] = [];

  // Set up network monitoring
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      startTime: Date.now()
    });
  });

  page.on('response', response => {
    const request = networkRequests.find(r => r.url === response.url() && !r.endTime);
    if (request) {
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      request.status = response.status();
    }
  });

  const startTime = Date.now();

  try {
    // Navigate with extended timeout
    await page.goto(`${BASE_URL}/property/${PROPERTY_ID}`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for main content
    await page.waitForSelector('h1', { timeout: 30000 });

    const loadTime = Date.now() - startTime;

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perf = window.performance;
      const navTiming = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
        loadComplete: navTiming.loadEventEnd - navTiming.loadEventStart,
        domInteractive: navTiming.domInteractive - navTiming.fetchStart,
        resources: perf.getEntriesByType('resource').length
      };
    });

    // Analyze network requests
    const apiCalls = networkRequests.filter(r => r.url.includes('/rest/'));
    const storageCalls = networkRequests.filter(r => r.url.includes('/storage/'));
    const rpcCalls = networkRequests.filter(r => r.url.includes('/rpc/'));
    const slowRequests = networkRequests.filter(r => r.duration && r.duration > 1000);

    console.log(`   Status: ${loggedIn ? 'LOGGED IN' : 'LOGGED OUT'}`);
    console.log(`   Total load time: ${loadTime}ms`);
    console.log(`   DOM Interactive: ${metrics.domInteractive}ms`);
    console.log(`   API calls: ${apiCalls.length}`);
    console.log(`   Storage calls: ${storageCalls.length}`);
    console.log(`   RPC calls: ${rpcCalls.length}`);
    console.log(`   Total resources: ${metrics.resources}`);

    if (slowRequests.length > 0) {
      console.log('\n   ⚠️ SLOW REQUESTS (>1s):');
      slowRequests
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5)
        .forEach(req => {
          const urlPart = req.url.split('.co/')[1]?.substring(0, 60) || req.url.substring(0, 60);
          console.log(`      ${urlPart}: ${req.duration}ms`);
        });
    }

    // Check for specific bottlenecks
    const authCalls = networkRequests.filter(r => r.url.includes('/auth/'));
    if (authCalls.length > 0) {
      console.log(`\n   🔐 Auth calls: ${authCalls.length}`);
      const totalAuthTime = authCalls.reduce((sum, r) => sum + (r.duration || 0), 0);
      console.log(`      Total auth time: ${totalAuthTime}ms`);
    }

    // Check console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    if (consoleErrors.length > 0) {
      console.log('\n   ❌ CONSOLE ERRORS:');
      consoleErrors.forEach(err => console.log(`      ${err}`));
    }

  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}