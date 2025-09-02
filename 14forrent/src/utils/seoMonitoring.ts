/**
 * SEO Monitoring Utilities
 * Track and report SEO issues to prevent Soft 404s and other indexing problems
 */

interface SEOIssue {
  type: 'soft_404' | 'missing_meta' | 'duplicate_content' | 'slow_load' | 'broken_link';
  url: string;
  details: string;
  timestamp: Date;
}

class SEOMonitor {
  private issues: SEOIssue[] = [];
  private readonly GOOGLE_SEARCH_CONSOLE_WEBHOOK = process.env.VITE_GSC_WEBHOOK_URL;

  /**
   * Check if a page might trigger a Soft 404
   */
  checkForSoft404(pathname: string, content?: string): boolean {
    // Common patterns that might trigger Soft 404
    const soft404Patterns = [
      /page not found/i,
      /404 error/i,
      /this page doesn't exist/i,
      /content not available/i,
      /coming soon/i,
      /under construction/i,
      /no results found/i,
      /empty page/i
    ];

    // Check URL patterns that commonly cause Soft 404s
    const problematicPaths = [
      '/undefined',
      '/null',
      '/[object Object]',
      '///', // Multiple slashes
      '/test',
      '/temp',
      '/.well-known'
    ];

    if (problematicPaths.some(path => pathname.includes(path))) {
      this.logIssue({
        type: 'soft_404',
        url: pathname,
        details: 'URL pattern commonly associated with Soft 404 errors',
        timestamp: new Date()
      });
      return true;
    }

    // Check content for Soft 404 indicators
    if (content) {
      const hasSoft404Content = soft404Patterns.some(pattern => 
        pattern.test(content)
      );
      
      if (hasSoft404Content) {
        this.logIssue({
          type: 'soft_404',
          url: pathname,
          details: 'Content contains patterns that may trigger Soft 404',
          timestamp: new Date()
        });
        return true;
      }

      // Check for thin content (less than 200 characters of meaningful text)
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      if (textContent.length < 200) {
        this.logIssue({
          type: 'soft_404',
          url: pathname,
          details: 'Page has thin content that might be seen as Soft 404',
          timestamp: new Date()
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Validate meta tags for SEO compliance
   */
  validateMetaTags(pathname: string): boolean {
    const metaTags = {
      title: document.querySelector('title'),
      description: document.querySelector('meta[name="description"]'),
      robots: document.querySelector('meta[name="robots"]'),
      canonical: document.querySelector('link[rel="canonical"]')
    };

    const issues: string[] = [];

    // Check title
    if (!metaTags.title || !metaTags.title.textContent) {
      issues.push('Missing page title');
    } else if (metaTags.title.textContent.length > 60) {
      issues.push('Title too long (>60 chars)');
    } else if (metaTags.title.textContent.length < 30) {
      issues.push('Title too short (<30 chars)');
    }

    // Check description
    if (!metaTags.description) {
      issues.push('Missing meta description');
    } else {
      const content = metaTags.description.getAttribute('content');
      if (!content) {
        issues.push('Empty meta description');
      } else if (content.length > 160) {
        issues.push('Description too long (>160 chars)');
      } else if (content.length < 50) {
        issues.push('Description too short (<50 chars)');
      }
    }

    // Check robots meta
    if (metaTags.robots) {
      const content = metaTags.robots.getAttribute('content');
      if (content?.includes('noindex') && !this.shouldNoIndex(pathname)) {
        issues.push('Unexpected noindex directive');
      }
    }

    // Check canonical
    if (!metaTags.canonical && this.shouldHaveCanonical(pathname)) {
      issues.push('Missing canonical URL');
    }

    if (issues.length > 0) {
      this.logIssue({
        type: 'missing_meta',
        url: pathname,
        details: issues.join(', '),
        timestamp: new Date()
      });
      return false;
    }

    return true;
  }

  /**
   * Check page load performance
   */
  checkPagePerformance(pathname: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      // Google recommends < 3 seconds for good user experience
      if (pageLoadTime > 3000) {
        this.logIssue({
          type: 'slow_load',
          url: pathname,
          details: `Page load time: ${pageLoadTime}ms (recommended: <3000ms)`,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Monitor 404 errors
   */
  track404Error(pathname: string, referrer?: string): void {
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_not_found', {
        page_path: pathname,
        page_referrer: referrer || document.referrer,
        page_location: window.location.href
      });
    }

    // Log for monitoring
    console.error('[SEO Monitor] 404 Error:', {
      path: pathname,
      referrer: referrer || document.referrer,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if URL should be noindexed
   */
  private shouldNoIndex(pathname: string): boolean {
    const noIndexPaths = [
      '/login',
      '/signup',
      '/admin',
      '/profile',
      '/my-listings',
      '/owner-dashboard',
      '/welcome-back'
    ];
    
    return noIndexPaths.some(path => pathname.startsWith(path));
  }

  /**
   * Check if URL should have canonical tag
   */
  private shouldHaveCanonical(pathname: string): boolean {
    // All public pages should have canonical URLs
    const publicPaths = [
      '/',
      '/search',
      '/property/',
      '/blog/',
      '/contact',
      '/available-units',
      '/terms',
      '/fair-housing'
    ];
    
    return publicPaths.some(path => 
      pathname === path || pathname.startsWith(path)
    );
  }

  /**
   * Log SEO issue for monitoring
   */
  private logIssue(issue: SEOIssue): void {
    this.issues.push(issue);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SEO Monitor]', issue);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(issue);
    }
  }

  /**
   * Send issues to monitoring service
   */
  private async sendToMonitoring(issue: SEOIssue): Promise<void> {
    try {
      // Send to Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'seo_issue', {
          issue_type: issue.type,
          page_path: issue.url,
          issue_details: issue.details
        });
      }
      
      // Send to webhook if configured
      if (this.GOOGLE_SEARCH_CONSOLE_WEBHOOK) {
        await fetch(this.GOOGLE_SEARCH_CONSOLE_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(issue)
        });
      }
    } catch (error) {
      console.error('Failed to send SEO monitoring data:', error);
    }
  }

  /**
   * Get current issues
   */
  getIssues(): SEOIssue[] {
    return this.issues;
  }

  /**
   * Clear issues
   */
  clearIssues(): void {
    this.issues = [];
  }

  /**
   * Generate SEO health report
   */
  generateHealthReport(): {
    totalIssues: number;
    criticalIssues: number;
    issuesByType: Record<string, number>;
    recommendations: string[];
  } {
    const issuesByType = this.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const criticalIssues = this.issues.filter(
      issue => issue.type === 'soft_404' || issue.type === 'broken_link'
    ).length;

    const recommendations: string[] = [];
    
    if (issuesByType.soft_404 > 0) {
      recommendations.push('Fix Soft 404 errors by ensuring proper HTTP status codes');
    }
    if (issuesByType.missing_meta > 0) {
      recommendations.push('Add missing meta tags to improve search visibility');
    }
    if (issuesByType.slow_load > 0) {
      recommendations.push('Optimize page load times for better SEO rankings');
    }
    if (issuesByType.duplicate_content > 0) {
      recommendations.push('Use canonical URLs to avoid duplicate content issues');
    }

    return {
      totalIssues: this.issues.length,
      criticalIssues,
      issuesByType,
      recommendations
    };
  }
}

// Export singleton instance
export const seoMonitor = new SEOMonitor();

// Export utility functions
export const checkSEOHealth = (pathname: string, content?: string): boolean => {
  const hasSoft404 = seoMonitor.checkForSoft404(pathname, content);
  const hasValidMeta = seoMonitor.validateMetaTags(pathname);
  seoMonitor.checkPagePerformance(pathname);
  
  return !hasSoft404 && hasValidMeta;
};

export const reportSEOIssue = (
  type: SEOIssue['type'],
  url: string,
  details: string
): void => {
  seoMonitor['logIssue']({
    type,
    url,
    details,
    timestamp: new Date()
  });
};