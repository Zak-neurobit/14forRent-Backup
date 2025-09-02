import { supabase } from '@/integrations/supabase/client';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export class SitemapGenerator {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://14forrent.com') {
    this.baseUrl = baseUrl;
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  public getStaticUrls(): SitemapUrl[] {
    const today = this.formatDate(new Date());
    
    return [
      {
        loc: `${this.baseUrl}/`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 1.0
      },
      {
        loc: `${this.baseUrl}/search`,
        lastmod: today,
        changefreq: 'daily',
        priority: 0.9
      },
      {
        loc: `${this.baseUrl}/available-units`,
        lastmod: today,
        changefreq: 'daily',
        priority: 0.9
      },
      {
        loc: `${this.baseUrl}/blog`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        loc: `${this.baseUrl}/contact`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.7
      },
      {
        loc: `${this.baseUrl}/terms`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.5
      },
      {
        loc: `${this.baseUrl}/fair-housing`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.5
      }
    ];
  }

  public async getPropertyUrls(): Promise<SitemapUrl[]> {
    try {
      const { data: properties, error } = await supabase
        .from('listings')
        .select('id, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties for sitemap:', error);
        return [];
      }

      return properties?.map(property => ({
        loc: `${this.baseUrl}/property/${property.id}`,
        lastmod: this.formatDate(property.updated_at || new Date()),
        changefreq: 'weekly' as const,
        priority: 0.8
      })) || [];
    } catch (error) {
      console.error('Error generating property URLs for sitemap:', error);
      return [];
    }
  }

  public async getBlogUrls(): Promise<SitemapUrl[]> {
    try {
      const { data: blogPosts, error } = await supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('published', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching blog posts for sitemap:', error);
        return [];
      }

      return blogPosts?.map(post => ({
        loc: `${this.baseUrl}/blog/${post.slug}`,
        lastmod: this.formatDate(post.updated_at || new Date()),
        changefreq: 'monthly' as const,
        priority: 0.6
      })) || [];
    } catch (error) {
      console.error('Error generating blog URLs for sitemap:', error);
      return [];
    }
  }

  public async generateSitemap(): Promise<string> {
    const staticUrls = this.getStaticUrls();
    const propertyUrls = await this.getPropertyUrls();
    const blogUrls = await this.getBlogUrls();
    
    const allUrls = [...staticUrls, ...propertyUrls, ...blogUrls];

    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const urlsetClose = '</urlset>';

    const urlElements = allUrls.map(url => {
      return `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
    }).join('\n');

    return `${xmlHeader}\n${urlsetOpen}\n${urlElements}\n${urlsetClose}`;
  }

  public generateRobotsTxt(): string {
    return `# Robots.txt for 14ForRent - Reinventing Renting
# Allow search engines to index public content while protecting sensitive areas

User-agent: *
# Allow all public pages
Allow: /
Allow: /search
Allow: /property/
Allow: /blog/
Allow: /contact
Allow: /terms
Allow: /fair-housing
Allow: /available-units

# Block admin and sensitive areas
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /supabase/
Disallow: /login
Disallow: /signup
Disallow: /my-listings
Disallow: /favorites
Disallow: /profile
Disallow: /owner-dashboard
Disallow: /list
Disallow: /get-preapproved
Disallow: /welcome-back

# Block development and build files
Disallow: /src/
Disallow: /node_modules/
Disallow: /*.json
Disallow: /*.config.*
Disallow: /dist/

# Block common sensitive files
Disallow: /.env
Disallow: /.git
Disallow: /logs/
Disallow: /temp/
Disallow: /tmp/

# Social media crawlers - allow access to public content for sharing
User-agent: Twitterbot
Allow: /
Allow: /property/
Allow: /blog/
Disallow: /admin
Disallow: /api/

User-agent: facebookexternalhit
Allow: /
Allow: /property/
Allow: /blog/
Disallow: /admin
Disallow: /api/

User-agent: LinkedInBot
Allow: /
Allow: /property/
Allow: /blog/
Disallow: /admin
Disallow: /api/

# Sitemap location
Sitemap: ${this.baseUrl}/sitemap.xml`;
  }
}

// Export a default instance
export const sitemapGenerator = new SitemapGenerator();