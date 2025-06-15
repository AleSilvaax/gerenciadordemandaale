
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheState {
  cache: Record<string, CacheEntry>;
  set: <T>(key: string, data: T, ttl?: number) => void;
  get: <T>(key: string) => T | null;
  remove: (key: string) => void;
  clear: () => void;
  isExpired: (key: string) => boolean;
  cleanup: () => void;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      cache: {},

      set: <T>(key: string, data: T, ttl = DEFAULT_TTL) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: {
              data,
              timestamp: Date.now(),
              ttl
            }
          }
        }));
      },

      get: <T>(key: string): T | null => {
        const state = get();
        const entry = state.cache[key];
        
        if (!entry) return null;
        
        if (state.isExpired(key)) {
          state.remove(key);
          return null;
        }
        
        return entry.data as T;
      },

      remove: (key: string) => {
        set((state) => {
          const newCache = { ...state.cache };
          delete newCache[key];
          return { cache: newCache };
        });
      },

      clear: () => {
        set({ cache: {} });
      },

      isExpired: (key: string) => {
        const state = get();
        const entry = state.cache[key];
        if (!entry) return true;
        
        return Date.now() - entry.timestamp > entry.ttl;
      },

      cleanup: () => {
        const state = get();
        const newCache: Record<string, CacheEntry> = {};
        
        Object.entries(state.cache).forEach(([key, entry]) => {
          if (!state.isExpired(key)) {
            newCache[key] = entry;
          }
        });
        
        set({ cache: newCache });
      }
    }),
    {
      name: 'app-cache',
      partialize: (state) => ({ cache: state.cache })
    }
  )
);

// Auto cleanup expired entries every 5 minutes
setInterval(() => {
  useCacheStore.getState().cleanup();
}, 5 * 60 * 1000);
