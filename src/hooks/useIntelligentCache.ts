
import { useState, useEffect, useRef } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cached items
  staleWhileRevalidate?: boolean;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
  key: string;
}

class IntelligentCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private defaultTTL: number;
  
  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      isStale: false,
      key
    };

    this.cache.set(key, item);

    // Set expiration timer
    const effectiveTTL = ttl || this.defaultTTL;
    setTimeout(() => {
      const cachedItem = this.cache.get(key);
      if (cachedItem) {
        cachedItem.isStale = true;
      }
    }, effectiveTTL);
  }

  get<T>(key: string): CacheItem<T> | null {
    const item = this.cache.get(key);
    if (!item) return null;

    return item as CacheItem<T>;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Get all keys that match a pattern
  getKeysByPattern(pattern: RegExp): string[] {
    return Array.from(this.cache.keys()).filter(key => pattern.test(key));
  }

  // Invalidate all keys matching a pattern
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete = this.getKeysByPattern(pattern);
    keysToDelete.forEach(key => this.delete(key));
  }
}

// Global cache instance
const globalCache = new IntelligentCache();

export const useIntelligentCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate = false
  } = options;

  const fetchData = async (ignoreCache = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Check cache first
      if (!ignoreCache) {
        const cachedItem = globalCache.get<T>(key);
        if (cachedItem && !cachedItem.isStale) {
          setData(cachedItem.data);
          setIsLoading(false);
          return cachedItem.data;
        }

        // If stale data exists and staleWhileRevalidate is enabled
        if (cachedItem && cachedItem.isStale && staleWhileRevalidate) {
          setData(cachedItem.data);
          setIsLoading(false);
          setIsValidating(true);
        }
      }

      // Fetch fresh data
      if (!isValidating) {
        setIsLoading(true);
      }
      
      const freshData = await fetchFn();
      
      if (!mountedRef.current) return freshData;

      // Cache the fresh data
      globalCache.set(key, freshData, ttl);
      
      setData(freshData);
      setError(null);
      
      return freshData;
    } catch (err) {
      if (!mountedRef.current) return null;
      
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        console.error(`Cache fetch error for key ${key}:`, err);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
    
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!ttl) return;

    const interval = setInterval(() => {
      const cachedItem = globalCache.get<T>(key);
      if (cachedItem) {
        const age = Date.now() - cachedItem.timestamp;
        // const cacheIsStale = age > ttl;
        
        // Proactively refresh if cache is getting old (80% of TTL)
        if (age > ttl * 0.8) {
          fetchData(true);
        }
      }
    }, ttl * 0.1); // Check every 10% of TTL

    return () => clearInterval(interval);
  }, [key, ttl]);

  const mutate = (newData?: T) => {
    if (newData) {
      globalCache.set(key, newData, ttl);
      setData(newData);
    } else {
      // Revalidate
      fetchData(true);
    }
  };

  const invalidate = () => {
    globalCache.delete(key);
    setData(null);
  };

  return {
    data,
    isLoading,
    error,
    isValidating,
    mutate,
    invalidate,
    cache: globalCache
  };
};

export { globalCache as intelligentCache };
