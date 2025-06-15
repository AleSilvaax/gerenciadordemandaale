
import { useEffect, useState } from 'react';
import { useCacheStore } from '@/store/cacheStore';

export const useCachedData = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
    enabled?: boolean;
  } = {}
) => {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true, enabled = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { get, set, isExpired } = useCacheStore();

  const fetchData = async (useCache = true) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get from cache first
      if (useCache) {
        const cachedData = get<T>(key);
        if (cachedData) {
          setData(cachedData);
          
          // If stale-while-revalidate is enabled and data is expired,
          // return cached data but fetch fresh data in background
          if (staleWhileRevalidate && isExpired(key)) {
            fetchData(false); // Fetch in background without using cache
          }
          setIsLoading(false);
          return cachedData;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      setData(freshData);
      set(key, freshData, ttl);
      
      return freshData;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const mutate = (newData?: T) => {
    if (newData) {
      setData(newData);
      set(key, newData, ttl);
    } else {
      fetchData(false); // Refetch without cache
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [key, enabled]);

  return {
    data,
    isLoading,
    error,
    mutate,
    refetch: () => fetchData(false)
  };
};
