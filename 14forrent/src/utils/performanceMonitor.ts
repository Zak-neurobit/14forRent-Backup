interface PerformanceMetrics {
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  tti: number; // Time to Interactive
  customMarks: Record<string, number>;
}

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe paint timing
    if ('PerformanceObserver' in window) {
      try {
        // LCP Observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // FID Observer
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            console.log('FID:', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // CLS Observer
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              console.log('CLS:', clsValue);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.error('Failed to initialize performance observers:', e);
      }
    }
  }

  mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      const time = performance.now();
      this.marks.set(name, time);
      performance.mark(name);
      console.log(`⏱️ Performance mark: ${name} at ${time.toFixed(2)}ms`);
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && window.performance) {
      const end = endMark || `${name}-end`;
      
      if (!endMark) {
        this.mark(end);
      }
      
      try {
        performance.measure(name, startMark, end);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        console.log(`⏱️ Performance measure: ${name} took ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      } catch (e) {
        // Fallback to manual calculation
        const startTime = this.marks.get(startMark);
        const endTime = this.marks.get(end) || performance.now();
        
        if (startTime) {
          const duration = endTime - startTime;
          console.log(`⏱️ Performance measure: ${name} took ${duration.toFixed(2)}ms`);
          return duration;
        }
      }
    }
    return 0;
  }

  async getMetrics(): Promise<Partial<PerformanceMetrics>> {
    const metrics: Partial<PerformanceMetrics> = {};
    
    if (typeof window === 'undefined' || !window.performance) {
      return metrics;
    }

    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.ttfb = navigation.responseStart - navigation.requestStart;
    }

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) {
      metrics.fcp = fcp.startTime;
    }

    // Get custom marks
    const customMarks: Record<string, number> = {};
    this.marks.forEach((value, key) => {
      customMarks[key] = value;
    });
    metrics.customMarks = customMarks;

    return metrics;
  }

  logMetrics() {
    this.getMetrics().then(metrics => {
      console.group('📊 Performance Metrics');
      if (metrics.ttfb) console.log(`TTFB: ${metrics.ttfb.toFixed(2)}ms`);
      if (metrics.fcp) console.log(`FCP: ${metrics.fcp.toFixed(2)}ms`);
      
      if (metrics.customMarks && Object.keys(metrics.customMarks).length > 0) {
        console.group('Custom Marks');
        Object.entries(metrics.customMarks).forEach(([name, time]) => {
          console.log(`${name}: ${time.toFixed(2)}ms`);
        });
        console.groupEnd();
      }
      console.groupEnd();
    });
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.marks.clear();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// Utility functions for easy usage
export const perfMark = (name: string) => {
  getPerformanceMonitor().mark(name);
};

export const perfMeasure = (name: string, startMark: string, endMark?: string) => {
  return getPerformanceMonitor().measure(name, startMark, endMark);
};

export const logPerformanceMetrics = () => {
  getPerformanceMonitor().logMetrics();
};

// Auto-log metrics on page visibility change
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      logPerformanceMetrics();
    }
  });
}