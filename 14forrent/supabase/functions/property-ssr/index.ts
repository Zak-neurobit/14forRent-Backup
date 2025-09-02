import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of known bot/crawler user agents for social media platforms
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
  'Applebot',
  'Pinterestbot',
  'developers.google.com/+/web/snippet',
  'Embedly',
  'quora link preview',
  'outbrain',
  'pinterest/0.',
  'developers.google.com/+/web/snippet',
  'Flipboard',
  'tumblr',
  'bitlybot',
];

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  address?: string;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  type?: string;
  images: string[];
  amenities?: string[];
  featured?: boolean;
  youtube_url?: string;
  video_id?: string;
  is_short?: boolean;
}

// Check if the request is from a bot/crawler
const isBot = (userAgent: string): boolean => {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot.toLowerCase()));
};

// Process image URL to get full Supabase storage URL
const processImageUrl = (supabaseUrl: string, imagePath: string): string => {
  if (!imagePath || imagePath === '/placeholder.svg') {
    // Use the 14ForRent logo as fallback (it's a PNG)
    return 'https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png';
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Construct the storage URL
  const fullUrl = `${supabaseUrl}/storage/v1/object/public/property_images/${imagePath}`;
  
  // Check if it's a WebP image - WhatsApp doesn't support WebP for previews
  if (imagePath.toLowerCase().endsWith('.webp')) {
    // For now, use the logo as fallback for WebP images
    // In production, you should convert images to JPEG when uploading
    console.log('Warning: WebP image detected. WhatsApp may not display WebP thumbnails.');
    // Still return the WebP URL - some platforms support it
    return fullUrl;
  }
  
  return fullUrl;
};

const generatePropertyHTML = (property: Property, supabaseUrl: string): string => {
  // Process the first image to get a full URL
  let mainImage = property.images && property.images.length > 0 
    ? processImageUrl(supabaseUrl, property.images[0])
    : 'https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png';
  
  // If the first image is already a JPEG (from social_preview_image), use it directly
  if (property.images && property.images.length > 0 && 
      (property.images[0].includes('.jpg') || property.images[0].includes('.jpeg'))) {
    console.log('Using JPEG image for social preview');
  } else if (mainImage.includes('.webp')) {
    // For WebP images without JPEG alternative, use logo as fallback
    console.log('WebP detected without JPEG alternative, using logo');
    mainImage = 'https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png';
  }
  
  // Clean description and title for meta tags
  const cleanDescription = property.description
    ? property.description.replace(/"/g, '&quot;').substring(0, 155)
    : `${property.bedrooms} bed, ${property.bathrooms} bath property in ${property.location}`;
  
  const pageTitle = `${property.title} - ${property.location} | $${property.price.toLocaleString()}/month | 14ForRent`;
  const propertyUrl = `https://14forrent.com/property/${property.id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description,
    "url": propertyUrl,
    "datePosted": new Date().toISOString(),
    "priceCurrency": "USD",
    "price": property.price,
    "image": [mainImage],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.location,
      "streetAddress": property.address || property.location,
      "addressRegion": "CA",
      "addressCountry": "US"
    },
    "numberOfRooms": property.bedrooms,
    "numberOfBathroomsTotal": property.bathrooms,
    "floorSize": property.sqft ? {
      "@type": "QuantitativeValue",
      "value": property.sqft,
      "unitCode": "SQF"
    } : undefined,
    "provider": {
      "@type": "Organization",
      "name": "14ForRent",
      "logo": "https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png"
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${pageTitle}</title>
  <meta name="title" content="${pageTitle}">
  <meta name="description" content="${cleanDescription}">
  <meta name="keywords" content="${property.location} rental, ${property.bedrooms} bedroom, ${property.bathrooms} bathroom, apartment for rent, house for rent">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${propertyUrl}">
  <meta property="og:title" content="${property.title} - $${property.price.toLocaleString()}/month">
  <meta property="og:description" content="${cleanDescription}">
  <meta property="og:image" content="${mainImage}">
  <meta property="og:image:secure_url" content="${mainImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${property.title}">
  <meta property="og:site_name" content="14ForRent">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${propertyUrl}">
  <meta property="twitter:title" content="${property.title} - $${property.price.toLocaleString()}/month">
  <meta property="twitter:description" content="${cleanDescription}">
  <meta property="twitter:image" content="${mainImage}">
  <meta property="twitter:site" content="@14ForRent">
  
  <!-- WhatsApp specific (helps with preview) -->
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:updated_time" content="${new Date().toISOString()}">
  
  <!-- Structured Data for SEO -->
  <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <!-- Redirect to actual app after meta tags are read -->
  <meta http-equiv="refresh" content="0; url=${propertyUrl}">
  <script>
    // Immediate redirect for regular browsers
    if (!navigator.userAgent.match(/bot|crawl|spider|scraper|facebookexternalhit|WhatsApp|LinkedInBot|Twitterbot/i)) {
      window.location.replace("${propertyUrl}");
    }
  </script>
  
  <!-- Basic styling for bot preview -->
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f9fafb;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .image {
      width: 100%;
      height: 400px;
      object-fit: cover;
    }
    .content {
      padding: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 10px;
    }
    .price {
      font-size: 28px;
      color: #f97316;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .details {
      color: #6b7280;
      margin-bottom: 10px;
    }
    .description {
      color: #374151;
      line-height: 1.5;
    }
    .redirect-notice {
      text-align: center;
      color: #6b7280;
      margin-top: 20px;
      padding: 20px;
      background: #f3f4f6;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${mainImage}" alt="${property.title}" class="image">
    <div class="content">
      <h1 class="title">${property.title}</h1>
      <div class="price">$${property.price.toLocaleString()}/month</div>
      <div class="details">
        ${property.bedrooms} beds • ${property.bathrooms} baths${property.sqft ? ` • ${property.sqft.toLocaleString()} sqft` : ''}
      </div>
      <div class="details">📍 ${property.address || property.location}</div>
      <p class="description">${property.description || 'Beautiful property available for rent.'}</p>
    </div>
  </div>
  <div class="redirect-notice">
    <p>Redirecting to 14ForRent...</p>
    <p>If you are not redirected, <a href="${propertyUrl}">click here</a>.</p>
  </div>
</body>
</html>`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    
    console.log(`Request URL: ${url.pathname}, User-Agent: ${userAgent}`);
    
    // Check if this is a bot request - if not, redirect immediately
    if (!isBot(userAgent)) {
      // For non-bots, just return a redirect
      const propertyMatch = url.pathname.match(/\/property\/([^\/]+)/);
      if (propertyMatch) {
        const redirectUrl = `https://14forrent.com/property/${propertyMatch[1]}`;
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': redirectUrl,
            'Cache-Control': 'no-cache',
          },
        });
      }
    }
    
    // Extract property ID from URL
    let propertyId: string | null = null;
    
    // Try different URL patterns
    // Pattern 1: /property/{id}
    const propertyMatch = url.pathname.match(/\/property\/([^\/]+)/);
    if (propertyMatch) {
      propertyId = propertyMatch[1];
    }
    
    // Pattern 2: /property-ssr/{id}
    if (!propertyId) {
      const ssrMatch = url.pathname.match(/\/property-ssr\/([^\/]+)/);
      if (ssrMatch) {
        propertyId = ssrMatch[1];
      }
    }
    
    // Pattern 3: Query parameter
    if (!propertyId) {
      propertyId = url.searchParams.get('id');
    }

    if (!propertyId) {
      console.log('No property ID found in request');
      return new Response('Property ID is required', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    console.log(`Generating SSR for property ID: ${propertyId}, Bot: ${isBot(userAgent)}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch property data from Supabase
    const { data: property, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error || !property) {
      console.error('Error fetching property:', error);
      return new Response('Property not found', { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    // Process property data
    const processedProperty: Property = {
      id: property.id,
      title: property.title || 'Property Listing',
      description: property.description || '',
      price: property.price || 0,
      location: property.location || 'Los Angeles',
      address: property.address,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      sqft: property.sqft,
      type: property.type,
      images: property.images || [],
      amenities: property.amenities || [],
      featured: property.featured || false,
      youtube_url: property.youtube_url,
      video_id: property.video_id,
      is_short: property.is_short
    };
    
    // Override with JPEG image if available for social preview
    if (property.social_preview_image) {
      console.log('Using JPEG social preview image:', property.social_preview_image);
      // Set the JPEG as the main image for meta tags
      processedProperty.images = [property.social_preview_image, ...processedProperty.images];
    }

    // Generate HTML with proper meta tags
    const html = generatePropertyHTML(processedProperty, supabaseUrl);

    console.log(`Generated SSR HTML for property: ${property.title}`);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Cache for 1 hour on CDN, 1 day on CDN edge
      },
    });

  } catch (error) {
    console.error('SSR Error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});