interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<any>>;
  private localStorage: Storage | null;

  private constructor() {
    this.cache = new Map();
    this.localStorage = typeof window !== 'undefined' ? window.localStorage : null;
    this.loadFromLocalStorage();
    
    // Clean up expired items periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupExpired(), 60000); // Clean every minute
    }
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private loadFromLocalStorage(): void {
    if (!this.localStorage) return;
    
    try {
      const keys = Object.keys(this.localStorage).filter(key => key.startsWith('14forrent_cache_'));
      
      keys.forEach(key => {
        const item = this.localStorage!.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item) as CacheItem<any>;
            const actualKey = key.replace('14forrent_cache_', '');
            
            // Check if still valid
            if (Date.now() - parsed.timestamp < parsed.ttl) {
              this.cache.set(actualKey, parsed);
            } else {
              // Remove expired item
              this.localStorage!.removeItem(key);
            }
          } catch (e) {
            console.error('Failed to parse cache item:', key, e);
            this.localStorage!.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
    }
  }

  private saveToLocalStorage(key: string, item: CacheItem<any>): void {
    if (!this.localStorage) return;
    
    try {
      const storageKey = `14forrent_cache_${key}`;
      this.localStorage.setItem(storageKey, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage (quota exceeded?):', error);
      // Clear old items if storage is full
      this.clearOldestItems();
    }
  }

  private removeFromLocalStorage(key: string): void {
    if (!this.localStorage) return;
    
    try {
      const storageKey = `14forrent_cache_${key}`;
      this.localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  private clearOldestItems(): void {
    if (!this.localStorage) return;
    
    const keys = Object.keys(this.localStorage).filter(key => key.startsWith('14forrent_cache_'));
    const items: { key: string; timestamp: number }[] = [];
    
    keys.forEach(key => {
      const item = this.localStorage!.getItem(key);
      if (item) {
        try {
          const parsed = JSON.parse(item) as CacheItem<any>;
          items.push({ key, timestamp: parsed.timestamp });
        } catch (e) {
          // Remove corrupt item
          this.localStorage!.removeItem(key);
        }
      }
    });
    
    // Sort by timestamp (oldest first) and remove oldest 25%
    items.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(items.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      this.localStorage!.removeItem(items[i].key);
    }
  }

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    };
    
    this.cache.set(key, item);
    this.saveToLocalStorage(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }
    
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.removeFromLocalStorage(key);
  }

  clear(): void {
    this.cache.clear();
    
    if (this.localStorage) {
      const keys = Object.keys(this.localStorage).filter(key => key.startsWith('14forrent_cache_'));
      keys.forEach(key => this.localStorage!.removeItem(key));
    }
  }

  cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }

  // Get all cache keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance();

// Cache key generators
export const cacheKeys = {
  listings: {
    all: () => 'listings:all',
    available: () => 'listings:available',
    hotDeals: (limit: number) => `listings:hotdeals:${limit}`,
    byId: (id: string) => `listings:id:${id}`,
    search: (query: string) => `listings:search:${query}`,
    filtered: (filters: any) => `listings:filtered:${JSON.stringify(filters)}`
  },
  user: {
    favorites: (userId: string) => `user:${userId}:favorites`,
    listings: (userId: string) => `user:${userId}:listings`
  }
};

// Cache TTL presets (in milliseconds)
export const cacheTTL = {
  instant: 0,
  short: 30 * 1000,        // 30 seconds
  medium: 5 * 60 * 1000,    // 5 minutes
  long: 30 * 60 * 1000,     // 30 minutes
  hour: 60 * 60 * 1000,     // 1 hour
  day: 24 * 60 * 60 * 1000  // 1 day
};