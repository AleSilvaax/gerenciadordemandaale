import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  staleWhileRevalidate?: boolean;
  onEvict?: (key: string, data: any) => void;
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private revalidationPromises = new Map<string, Promise<any>>();

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    // Clean up expired entries
    this.cleanup();

    // Evict LRU if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = Date.now();

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.isStale(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.revalidationPromises.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.revalidationPromises.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats() {
    let totalHits = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      totalHits,
      expiredCount,
      hitRate: totalHits > 0 ? totalHits / this.cache.size : 0
    };
  }
}

const globalCache = new IntelligentCache(200);

export const useIntelligentCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Check cache first
      const cachedData = globalCache.get<T>(key);
      const hasCache = globalCache.has(key);
      const cacheIsStale = globalCache.isStale(key);

      // If we have valid cache and not forcing refresh, use it
      if (hasCache && !forceRefresh) {
        setData(cachedData);
        setIsStale(false);
        return cachedData;
      }

      // If stale but we have data, show stale data while revalidating
      if (cachedData && staleWhileRevalidate && !forceRefresh) {
        setData(cachedData);
        setIsStale(true);
      } else {
        setIsLoading(true);
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      if (!mountedRef.current) return freshData;

      // Update cache and state
      globalCache.set(key, freshData, ttl);
      setData(freshData);
      setIsStale(false);
      
      return freshData;
    } catch (err) {
      if (!mountedRef.current) return null;
      
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      
      // If we have stale data, keep showing it on error
      const cachedData = globalCache.get<T>(key);
      if (cachedData && staleWhileRevalidate) {
        setData(cachedData);
        setIsStale(true);
      }
      
      throw errorObj;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [key, fetcher, ttl, staleWhileRevalidate]);

  const mutate = useCallback(async (newData?: T | Promise<T> | ((current: T | null) => T | Promise<T>)) => {
    if (typeof newData === 'function') {
      const currentData = globalCache.get<T>(key);
      const result = (newData as Function)(currentData);
      const resolvedData = await Promise.resolve(result);
      globalCache.set(key, resolvedData, ttl);
      setData(resolvedData);
      setIsStale(false);
      return resolvedData;
    } else if (newData !== undefined) {
      const resolvedData = await Promise.resolve(newData);
      globalCache.set(key, resolvedData, ttl);
      setData(resolvedData);
      setIsStale(false);
      return resolvedData;
    } else {
      return fetchData(true);
    }
  }, [key, ttl, fetchData]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
    setData(null);
    setIsStale(false);
  }, [key]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isStale,
    mutate,
    invalidate,
    refresh: () => fetchData(true),
    cacheStats: globalCache.getStats()
  };
};

export { globalCache };
