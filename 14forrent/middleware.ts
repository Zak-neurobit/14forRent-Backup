import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define valid routes for your application
const validRoutes = [
  '/',
  '/search',
  '/property/',
  '/login',
  '/signup',
  '/contact',
  '/list',
  '/my-listings',
  '/favorites',
  '/available-units',
  '/available',
  '/get-preapproved',
  '/welcome-back',
  '/admin',
  '/owner-dashboard',
  '/blog',
  '/terms',
  '/fair-housing',
  '/profile'
];

// Static assets that should not be processed
const staticAssets = [
  '/favicon.ico',
  '/favicon.jpg',
  '/robots.txt',
  '/sitemap.xml',
  '/site.webmanifest',
  '/_next/',
  '/api/',
  '/static/',
  '/images/',
  '/lovable-uploads/',
  '/fonts/',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.css',
  '.js',
  '.map'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets
  if (staticAssets.some(asset => pathname.includes(asset))) {
    return NextResponse.next();
  }
  
  // Check if the route is valid
  const isValidRoute = validRoutes.some(route => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
  
  // If route is not valid, return 404 response
  if (!isValidRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/404';
    
    // Set proper headers for 404 response
    const response = NextResponse.rewrite(url);
    response.headers.set('x-robots-tag', 'noindex, nofollow');
    response.headers.set('cache-control', 'no-cache, no-store, must-revalidate');
    
    return response;
  }
  
  // For valid routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};