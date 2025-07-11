
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  priority: 'low' | 'medium' | 'high';
  accessCount: number;
  lastAccessed: number;
}

interface CacheStrategy {
  maxSize: number;
  defaultTTL: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
}

class StrategicCache {
  private cache = new Map<string, CacheEntry<any>>();
  private strategy: CacheStrategy;
  private cleanupInterval: NodeJS.Timeout;

  constructor(strategy: Partial<CacheStrategy> = {}) {
    this.strategy = {
      maxSize: 100,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      evictionPolicy: 'lru',
      ...strategy
    };

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): void {
    const now = Date.now();
    const ttl = options.ttl ?? this.strategy.defaultTTL;
    const priority = options.priority ?? 'medium';

    // Check if cache is full and evict if necessary
    if (this.cache.size >= this.strategy.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      priority,
      accessCount: 0,
      lastAccessed: now
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();

    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`[CACHE] Limpeza: ${expiredKeys.length} entradas expiradas removidas`);
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict = '';

    switch (this.strategy.evictionPolicy) {
      case 'lru':
        keyToEvict = this.findLRUKey();
        break;
      case 'lfu':
        keyToEvict = this.findLFUKey();
        break;
      case 'ttl':
        keyToEvict = this.findOldestKey();
        break;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      console.log(`[CACHE] Evicted: ${keyToEvict} (policy: ${this.strategy.evictionPolicy})`);
    }
  }

  private findLRUKey(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFUKey(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private findOldestKey(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.strategy.maxSize,
      utilization: Math.round((this.cache.size / this.strategy.maxSize) * 100),
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAge: entries.length > 0 
        ? Math.round(entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length / 1000)
        : 0,
      expired: entries.filter(entry => now - entry.timestamp > entry.ttl).length
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Global cache instances
export const serviceCache = new StrategicCache({
  maxSize: 50,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  evictionPolicy: 'lru'
});

export const userCache = new StrategicCache({
  maxSize: 20,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  evictionPolicy: 'lfu'
});

export const staticCache = new StrategicCache({
  maxSize: 30,
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  evictionPolicy: 'ttl'
});

// Cache utilities
export const withCache = <T>(
  cache: StrategicCache,
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; priority?: 'low' | 'medium' | 'high' }
): Promise<T> => {
  const cached = cache.get<T>(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetcher().then(data => {
    cache.set(key, data, options);
    return data;
  });
};

export { StrategicCache };
