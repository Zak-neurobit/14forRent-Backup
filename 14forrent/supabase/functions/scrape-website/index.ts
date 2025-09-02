
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const requestData = await req.json();
    const { url, urls, action = 'scrape-single' } = requestData;
    
    // Handle different actions
    switch (action) {
      case 'fetch-sitemap': 
        return await fetchSitemap(url, corsHeaders);
      case 'scrape-single': 
        return await scrapeSingleWebsite(url, corsHeaders);
      case 'scrape-multiple': 
        return await scrapeMultipleWebsites(urls, corsHeaders);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action specified', success: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in scrape-website function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to scrape website',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to fetch sitemap from a website
async function fetchSitemap(url: string, corsHeaders: HeadersInit): Promise<Response> {
  if (!url) {
    return new Response(
      JSON.stringify({ error: 'No URL provided', success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`Attempting to fetch sitemap from: ${url}`);

  try {
    // Normalize URL
    const baseUrl = new URL(url).origin;
    
    // Common sitemap locations
    const commonSitemapPaths = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/sitemap/sitemap.xml',
      '/sitemap/index.xml',
      '/sitemap/',
      '/sitemap.php',
      '/sitemap.txt'
    ];

    // Try fetching sitemap from common locations
    let sitemapXml = null;
    let sitemapUrl = '';
    
    for (const path of commonSitemapPaths) {
      try {
        const fullUrl = baseUrl + path;
        const response = await fetch(fullUrl);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('xml') || contentType.includes('text')) {
            sitemapXml = await response.text();
            sitemapUrl = fullUrl;
            break;
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch sitemap from ${path}:`, e);
      }
    }
    
    // If no sitemap found in common locations, try fetching the robots.txt to see if sitemap is mentioned there
    if (!sitemapXml) {
      try {
        const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
        
        if (robotsResponse.ok) {
          const robotsText = await robotsResponse.text();
          const sitemapMatch = robotsText.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
          
          if (sitemapMatch && sitemapMatch[1]) {
            const robotsSitemapUrl = sitemapMatch[1];
            const sitemapResponse = await fetch(robotsSitemapUrl);
            
            if (sitemapResponse.ok) {
              sitemapXml = await sitemapResponse.text();
              sitemapUrl = robotsSitemapUrl;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to extract sitemap from robots.txt:', e);
      }
    }

    // If still no sitemap, fallback to scraping the homepage for links
    if (!sitemapXml) {
      try {
        const homepageResponse = await fetch(baseUrl);
        
        if (homepageResponse.ok) {
          const homepageHtml = await homepageResponse.text();
          
          // Extract links from homepage HTML
          const links = extractLinksFromHtml(homepageHtml, baseUrl);
          
          return new Response(
            JSON.stringify({ links, source: 'homepage', success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.warn('Failed to extract links from homepage:', e);
      }
    }
    
    if (!sitemapXml) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not find sitemap for the given URL',
          success: false 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse XML to extract URLs
    const urls = extractUrlsFromSitemap(sitemapXml, baseUrl);
    
    return new Response(
      JSON.stringify({ 
        links: urls,
        source: 'sitemap',
        sitemapUrl,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch sitemap',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to scrape a single website
async function scrapeSingleWebsite(url: string, corsHeaders: HeadersInit): Promise<Response> {
  if (!url) {
    return new Response(
      JSON.stringify({ error: 'No URL provided', success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`Attempting to scrape: ${url}`);
  
  try {
    // Fetch the URL content
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    // Get the text content of the page
    const html = await response.text();
    
    // Basic text extraction
    const textContent = extractTextFromHTML(html);
    
    return new Response(
      JSON.stringify({ 
        content: textContent,
        url: url,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping website:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to scrape website',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to scrape multiple websites
async function scrapeMultipleWebsites(urls: string[], corsHeaders: HeadersInit): Promise<Response> {
  if (!Array.isArray(urls) || urls.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No URLs provided', success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (urls.length > 300) {
    return new Response(
      JSON.stringify({ error: 'Too many URLs provided (maximum 300)', success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`Attempting to scrape ${urls.length} websites`);
  
  try {
    // Limit concurrency to not overwhelm the function
    const batchSize = 5;
    let completedCount = 0;
    let combinedContent = '';
    let failedUrls: string[] = [];
    
    // Process URLs in batches
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(async (url) => {
        try {
          const response = await fetch(url);
          
          if (!response.ok) {
            failedUrls.push(url);
            return '';
          }
          
          const html = await response.text();
          const textContent = extractTextFromHTML(html);
          return `--- Content from ${url} ---\n${textContent}\n`;
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
          failedUrls.push(url);
          return '';
        }
      });
      
      const results = await Promise.all(batchPromises);
      combinedContent += results.join('\n');
      completedCount += results.filter(r => r !== '').length;
      
      // Add a short delay between batches to prevent rate limiting
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return new Response(
      JSON.stringify({ 
        combinedContent,
        scrapedCount: completedCount,
        failedCount: failedUrls.length,
        failedUrls,
        totalRequested: urls.length,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in batch scraping:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to scrape websites',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to extract URLs from sitemap XML
function extractUrlsFromSitemap(sitemapXml: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  
  // Find URLs in <loc> tags
  const locMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g);
  
  if (locMatches) {
    for (const match of locMatches) {
      const url = match.replace(/<loc>|<\/loc>/g, '').trim();
      if (url && isValidUrl(url)) {
        urls.add(url);
      }
    }
  }
  
  // Handle sitemap index files by looking for <sitemap> tags
  const sitemapMatches = sitemapXml.match(/<sitemap>(.*?)<\/sitemap>/gs);
  
  if (sitemapMatches) {
    for (const sitemapBlock of sitemapMatches) {
      const locMatch = sitemapBlock.match(/<loc>(.*?)<\/loc>/);
      if (locMatch && locMatch[1]) {
        try {
          // Recursively process sub-sitemaps
          const sitemapUrl = locMatch[1].trim();
          if (isValidUrl(sitemapUrl)) {
            try {
              const response = fetch(sitemapUrl);
              // We need to use await here but edge functions may timeout for large sites,
              // so we'll just include the sitemap URL for now
              urls.add(sitemapUrl);
            } catch (e) {
              console.warn(`Failed to fetch sub-sitemap ${sitemapUrl}:`, e);
            }
          }
        } catch (e) {
          console.warn('Error processing sitemap reference:', e);
        }
      }
    }
  }
  
  return Array.from(urls);
}

// Helper function to extract links from HTML
function extractLinksFromHtml(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  
  // Match all href attributes in <a> tags
  const hrefMatches = html.match(/href=["'](.*?)["']/g);
  
  if (hrefMatches) {
    for (const match of hrefMatches) {
      try {
        // Extract URL from href="url" or href='url'
        let url = match.replace(/href=["'](.*?)["']/, '$1').trim();
        
        // Skip non-HTTP links, fragments, and empty links
        if (!url || url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:')) {
          continue;
        }
        
        // Handle relative URLs
        if (url.startsWith('/')) {
          url = baseUrl + url;
        } else if (!url.startsWith('http')) {
          url = baseUrl + '/' + url;
        }
        
        // Only include URLs from the same domain
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(baseUrl);
          
          if (urlObj.hostname === baseUrlObj.hostname && isValidUrl(url)) {
            urls.add(url);
          }
        } catch (e) {
          // Invalid URL, skip it
        }
      } catch (e) {
        console.warn('Error processing URL from HTML:', e);
      }
    }
  }
  
  return Array.from(urls);
}

// Simple function to extract text from HTML
function extractTextFromHTML(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  
  // Remove HTML tags
  text = text.replace(/<\/?[^>]+(>|$)/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Replace multiple spaces with a single space
  text = text.replace(/\s+/g, ' ');
  
  // Trim leading and trailing spaces
  text = text.trim();
  
  return text;
}

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
