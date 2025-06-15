
// Performance utilities for React optimization
import { useCallback, useMemo, useRef } from 'react';

// Debounce hook for search and input optimization
export const useDebounce = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
};

// Throttle hook for scroll and resize events
export const useThrottle = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: T) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  );
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
};

// Memoized service filtering
export const useFilteredServices = (services: Service[], filters: any, searchTerm: string) => {
  return useMemo(() => {
    return services.filter(service => {
      if (filters.status !== 'all' && service.status !== filters.status) return false;
      if (filters.priority !== 'all' && service.priority !== filters.priority) return false;
      if (filters.serviceType !== 'all' && service.serviceType !== filters.serviceType) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          service.title.toLowerCase().includes(searchLower) ||
          service.client?.toLowerCase().includes(searchLower) ||
          service.location.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [services, filters, searchTerm]);
};

import { useState, useEffect } from 'react';
import { Service } from '@/types/serviceTypes';
