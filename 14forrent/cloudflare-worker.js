// Cloudflare Worker Script for 14ForRent
// This worker detects social media bots and redirects them to the Supabase Edge Function

// NOTE: Applebot is excluded to allow iMessage to read regular meta tags
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'facebookcatalog',
  'Facebot',
  'WhatsApp',
  'LinkedInBot',
  'Twitterbot',
  'Slackbot',
  'Discordbot',
  'TelegramBot',
  'Googlebot',
  'bingbot',
  'Slurp',
  'DuckDuckBot',
  'baiduspider',
  'yandex',
  'vkShare',
  'W3C_Validator',
  'redditbot',
  // 'Applebot', // Removed - let iMessage use regular meta tags
  'Pinterestbot',
  'Embedly',
  'quora link preview',
  'outbrain',
  'pinterest',
  'Flipboard',
  'tumblr',
  'bitlybot',
];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Check if this is a property page
  const propertyMatch = url.pathname.match(/\/property\/([a-f0-9-]+)/);
  
  if (propertyMatch) {
    const propertyId = propertyMatch[1];
    
    // Check if this is iMessage (has facebookexternalhit but also Safari/601)
    const isiMessage = userAgent.includes('facebookexternalhit') && 
                       userAgent.includes('Safari/601') && 
                       userAgent.includes('KHTML');
    
    // If it's iMessage, DON'T send to SSR - let it read normal meta tags
    if (isiMessage) {
      return fetch(request);
    }
    
    // Check if the request is from other bots
    const isBot = BOT_USER_AGENTS.some(bot => 
      userAgent.toLowerCase().includes(bot.toLowerCase())
    );
    
    if (isBot) {
      // Redirect bots to the Supabase Edge Function
      const ssrUrl = `https://hdigtojmeagwaqdknblj.supabase.co/functions/v1/property-ssr?id=${propertyId}`;
      
      // Fetch the SSR content
      const ssrResponse = await fetch(ssrUrl, {
        headers: {
          'User-Agent': userAgent,
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWd0b2ptZWFnd2FxZGtuYmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NDU3ODMsImV4cCI6MjA2MzEyMTc4M30.tKQ9KkrUwSI8sQRSjMljBBs3QMAX0LvI0CaxnGoOzJ0'
        }
      });
      
      // Return the SSR HTML to the bot
      return new Response(await ssrResponse.text(), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        }
      });
    }
  }
  
  // For non-bots and non-property pages, pass through to your GoDaddy hosting
  return fetch(request);
}