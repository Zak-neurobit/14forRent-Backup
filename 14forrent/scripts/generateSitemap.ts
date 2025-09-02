#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const generateSitemap = async () => {
  console.log('🗺️ Generating sitemap...');
  
  const baseUrl = 'https://14forrent.com';
  const urls: SitemapUrl[] = [];
  
  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'weekly' as const, priority: 1.0 },
    { path: '/search', changefreq: 'daily' as const, priority: 0.9 },
    { path: '/available-units', changefreq: 'daily' as const, priority: 0.9 },
    { path: '/blog', changefreq: 'weekly' as const, priority: 0.8 },
    { path: '/contact', changefreq: 'monthly' as const, priority: 0.7 },
    { path: '/terms', changefreq: 'monthly' as const, priority: 0.5 },
    { path: '/fair-housing', changefreq: 'monthly' as const, priority: 0.5 },
  ];
  
  const today = new Date().toISOString().split('T')[0];
  
  // Add static pages
  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });
  
  try {
    // Fetch active property listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });
    
    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
    } else if (listings) {
      console.log(`Found ${listings.length} active listings`);
      
      listings.forEach(listing => {
        const lastmod = listing.updated_at 
          ? new Date(listing.updated_at).toISOString().split('T')[0]
          : today;
        
        urls.push({
          loc: `${baseUrl}/property/${listing.id}`,
          lastmod,
          changefreq: 'weekly',
          priority: 0.8
        });
      });
    }
    
    // Fetch published blog posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false });
    
    if (postsError) {
      console.error('Error fetching blog posts:', postsError);
    } else if (posts) {
      console.log(`Found ${posts.length} published blog posts`);
      
      posts.forEach(post => {
        const lastmod = post.updated_at 
          ? new Date(post.updated_at).toISOString().split('T')[0]
          : today;
        
        urls.push({
          loc: `${baseUrl}/blog/${post.slug}`,
          lastmod,
          changefreq: 'monthly',
          priority: 0.7
        });
      });
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap content:', error);
  }
  
  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  // Write to file
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml);
  
  console.log(`✅ Sitemap generated successfully with ${urls.length} URLs`);
  console.log(`📍 Saved to: ${sitemapPath}`);
  
  // Also generate a sitemap index if needed
  if (urls.length > 50000) {
    console.log('⚠️ Warning: Sitemap has more than 50,000 URLs. Consider splitting into multiple sitemaps.');
  }
};

// Run the generator
generateSitemap().catch(console.error);