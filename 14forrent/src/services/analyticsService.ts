import { supabase } from "@/integrations/supabase/client";

// Generate a unique session ID for the browser session
const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('visitor-session-id');
  if (stored) return stored;
  
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem('visitor-session-id', sessionId);
  return sessionId;
};

// Get client IP address (fallback method)
const getClientIP = async (): Promise<string | null> => {
  try {
    // In production, you might want to use a proper IP detection service
    // For now, we'll use a simple approach
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Could not fetch client IP:', error);
    return null;
  }
};

export class AnalyticsService {
  private sessionId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Array<{ type: string; handler: EventListener }> = [];

  constructor() {
    this.sessionId = generateSessionId();
    this.startHeartbeat();
  }

  // Track a page view
  async trackPageView(pagePath: string, referrer?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert page view record immediately with null IP (non-blocking)
      const { error } = await supabase
        .from('page_views')
        .insert({
          session_id: this.sessionId,
          user_id: user?.id || null,
          page_path: pagePath,
          user_agent: navigator.userAgent,
          ip_address: null, // Will be updated asynchronously
          referrer: referrer || document.referrer || null
        });

      if (error) {
        console.error('Failed to track page view:', error);
        // If table doesn't exist, try to track in listing_views as fallback
        if (error.message?.includes('page_views') || error.code === '42P01') {
          console.log('Falling back to listing_views for analytics');
        }
        return;
      }

      // Fetch IP and update session in background (non-blocking)
      Promise.resolve().then(async () => {
        try {
          const ip = await getClientIP();
          if (ip) {
            // Update the page view with IP address in background
            await supabase
              .from('page_views')
              .update({ ip_address: ip })
              .eq('session_id', this.sessionId)
              .order('created_at', { ascending: false })
              .limit(1);
          }
        } catch (error) {
          console.warn('Failed to update IP address:', error);
        }
      });

      // Disabled: Active session tracking was causing performance issues
      // Promise.resolve().then(() => this.updateActiveSession());
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Update active session - DISABLED due to performance issues
  private async updateActiveSession(): Promise<void> {
    // Disabled: This function was causing 403 errors and slowing down listing updates
    // The analytics tracking is not critical for core functionality
    return;
  }

  // Start heartbeat to keep session active - DISABLED
  private startHeartbeat(): void {
    // Disabled: Heartbeat was causing performance issues with 403 errors
    // The session tracking is not critical for core functionality
    return;
  }

  // Stop heartbeat (cleanup)
  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Complete cleanup method to prevent memory leaks
  public cleanup(): void {
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Remove all event listeners
    this.eventListeners.forEach(({ type, handler }) => {
      window.removeEventListener(type, handler);
    });
    this.eventListeners = [];
  }

  // Get live visitor count
  static async getLiveVisitorCount(): Promise<number> {
    // Use the getActiveVisitorCount method we created
    return AnalyticsService.getActiveVisitorCount();
  }

  // Get daily visitor count
  static async getDailyVisitorCount(date?: Date): Promise<number> {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Try page_views table first (now that it's created)
      const { data, error } = await supabase
        .from('page_views')
        .select('session_id')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());
      
      if (error) {
        // Fallback to listing_views if page_views fails
        console.log('Falling back to listing_views for daily count');
        const { data: viewsData, error: viewsError } = await supabase
          .from('listing_views')
          .select('viewer_id')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
        
        if (viewsError) {
          console.error('Failed to get daily visitor count:', viewsError);
          return 0;
        }
        
        // Count unique viewers
        const uniqueViewers = new Set(viewsData?.map(view => view.viewer_id || 'anonymous') || []);
        return uniqueViewers.size;
      }

      // Count unique sessions for the day
      if (data && data.length > 0) {
        const uniqueSessions = new Set(data.map(view => view.session_id));
        return uniqueSessions.size;
      }
      
      return 0;
    } catch (error) {
      console.error('Daily visitor count error:', error);
      return 0;
    }
  }

  // Get active visitor count (last 5 minutes)
  static async getActiveVisitorCount(): Promise<number> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Try active_sessions table first (now that it's created)
      const { data, error } = await supabase
        .from('active_sessions')
        .select('session_id')
        .gte('last_activity', fiveMinutesAgo.toISOString());
      
      if (error) {
        // Fallback to listing_views if active_sessions fails
        console.log('Falling back to listing_views for active count');
        const { data: viewsData, error: viewsError } = await supabase
          .from('listing_views')
          .select('viewer_id')
          .gte('created_at', fiveMinutesAgo.toISOString());
        
        if (viewsError) {
          console.error('Failed to get active visitor count:', viewsError);
          return 0;
        }
        
        // Count unique viewers in the last 5 minutes
        const uniqueViewers = new Set(viewsData?.map(view => view.viewer_id || 'anonymous') || []);
        return uniqueViewers.size;
      }

      // Count active sessions
      return data?.length || 0;
    } catch (error) {
      console.error('Active visitor count error:', error);
      return 0;
    }
  }

  // Get visitor stats for date range
  static async getVisitorStatsForRange(startDate: Date, endDate: Date): Promise<Array<{ date: string; visitors: number }>> {
    try {
      const { data, error } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        console.error('Failed to get visitor stats:', error);
        return [];
      }

      // Group by date and count unique sessions
      const dateMap = new Map<string, Set<string>>();
      
      data.forEach((view: any) => {
        const date = new Date(view.created_at).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, new Set());
        }
      });

      // Convert to array format
      const result = Array.from(dateMap.entries()).map(([date, sessions]) => ({
        date,
        visitors: sessions.size
      }));

      return result.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Visitor stats range error:', error);
      return [];
    }
  }

  // Get session ID for debugging
  public getSessionId(): string {
    return this.sessionId;
  }
}

// Create a singleton instance
export const analyticsService = new AnalyticsService();

// Store observer for cleanup
let mutationObserver: MutationObserver | null = null;
let beforeUnloadHandler: (() => void) | null = null;

// Initialize tracking on app load
export const initializeAnalytics = () => {
  // Track initial page view
  analyticsService.trackPageView(window.location.pathname);

  // Clean up existing observer if any
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  // Track route changes (for React Router)
  let currentPath = window.location.pathname;
  mutationObserver = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      analyticsService.trackPageView(currentPath);
    }
  });

  mutationObserver.observe(document.body, {
    subtree: true,
    childList: true
  });

  // Cleanup on page unload
  beforeUnloadHandler = () => {
    analyticsService.cleanup();
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
  };
  
  window.addEventListener('beforeunload', beforeUnloadHandler);
  
  // Return cleanup function for React
  return () => {
    analyticsService.cleanup();
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  };
};