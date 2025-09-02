// Bot detection utility for client-side redirect
export const detectAndRedirectBots = (propertyId: string) => {
  const userAgent = navigator.userAgent || '';
  
  const botPatterns = [
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
    'Applebot',
    'Pinterestbot',
    'Embedly',
    'quora link preview',
    'outbrain',
    'pinterest',
    'Flipboard',
    'tumblr',
    'bitlybot',
  ];
  
  const isBot = botPatterns.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
  
  if (isBot && propertyId) {
    // Redirect to the SSR version
    window.location.replace(
      `https://hdigtojmeagwaqdknblj.supabase.co/functions/v1/property-ssr?id=${propertyId}`
    );
    return true;
  }
  
  return false;
};