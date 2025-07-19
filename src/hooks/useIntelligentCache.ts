
import { useState, useEffect, useRef } from 'react';

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
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
  
  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      isStale: false,
      key
    };

    this.cache.set(key, item);

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

  getKeysByPattern(pattern: RegExp): string[] {
    return Array.from(this.cache.keys()).filter(key => pattern.test(key));
  }

  invalidatePattern(pattern: RegExp): void {
    const keysToDelete = this.getKeysByPattern(pattern);
    keysToDelete.forEach(key => this.delete(key));
  }
}

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
    ttl = 5 * 60 * 1000,
    staleWhileRevalidate = false
  } = options;

  const fetchData = async (ignoreCache = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (!ignoreCache) {
        const cachedItem = globalCache.get<T>(key);
        if (cachedItem && !cachedItem.isStale) {
          setData(cachedItem.data);
          setIsLoading(false);
          return cachedItem.data;
        }

        if (cachedItem && cachedItem.isStale && staleWhileRevalidate) {
          setData(cachedItem.data);
          setIsLoading(false);
          setIsValidating(true);
        }
      }

      if (!isValidating) {
        setIsLoading(true);
      }
      
      const freshData = await fetchFn();
      
      if (!mountedRef.current) return freshData;

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

  useEffect(() => {
    fetchData();
    
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key]);

  useEffect(() => {
    if (!ttl) return;

    const interval = setInterval(() => {
      const cachedItem = globalCache.get<T>(key);
      if (cachedItem) {
        const age = Date.now() - cachedItem.timestamp;
        if (age > ttl * 0.8) {
          fetchData(true);
        }
      }
    }, ttl * 0.1);

    return () => clearInterval(interval);
  }, [key, ttl]);

  const mutate = (newData?: T) => {
    if (newData) {
      globalCache.set(key, newData, ttl);
      setData(newData);
    } else {
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
