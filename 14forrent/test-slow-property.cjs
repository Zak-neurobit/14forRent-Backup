// Quick test to verify the slow property loads faster now
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const propertyId = 'e88a6d6c-5009-457e-8a30-57362f223327';
  const url = `http://localhost:8082/property/${propertyId}`;
  
  console.log('Testing property:', propertyId);
  console.log('URL:', url);
  console.log('-'.repeat(50));
  
  // Track network requests
  let apiCalls = 0;
  let imageCalls = 0;
  
  page.on('request', request => {
    const reqUrl = request.url();
    if (reqUrl.includes('/rest/')) apiCalls++;
    if (reqUrl.includes('/storage/')) imageCalls++;
  });
  
  const startTime = Date.now();
  
  try {
    // Navigate with shorter timeout since it should be faster
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    // Wait for main title
    await page.waitForSelector('h1', { timeout: 5000 });
    
    const domLoadTime = Date.now() - startTime;
    
    // Wait a bit more for initial images
    await page.waitForTimeout(1000);
    
    const totalTime = Date.now() - startTime;
    
    // Check how many images are visible
    const visibleImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).filter(img => 
        img.complete && img.naturalHeight > 0
      ).length;
    });
    
    console.log('✅ SUCCESS - Page loaded!');
    console.log(`   DOM ready: ${domLoadTime}ms`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   API calls: ${apiCalls}`);
    console.log(`   Image requests: ${imageCalls}`);
    console.log(`   Visible images: ${visibleImages}`);
    
    if (domLoadTime < 3000) {
      console.log('\n🎉 EXCELLENT! Load time under 3 seconds!');
    } else if (domLoadTime < 5000) {
      console.log('\n✅ GOOD! Load time under 5 seconds');
    } else {
      console.log('\n⚠️ Still slow, needs more optimization');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
  
  await browser.close();
})();