
import { useMemo, useRef, useEffect, useState } from 'react';
import { Service } from '@/types/serviceTypes';

export interface ServiceFilters {
  status: string;
  priority: string;
  serviceType: string;
  searchTerm: string;
}

// Re-export do hook de debounce
export { useDebounce, useDebouncedCallback, useThrottle } from './useDebounce';

// Hook para observar intersecção (usado no LazyImage)
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

// Hook para filtrar serviços de forma otimizada
export const useFilteredServices = (
  services: Service[],
  filters: ServiceFilters,
  searchTerm: string
) => {
  return useMemo(() => {
    return services.filter(service => {
      // Filtro de status
      if (filters.status !== 'all' && service.status !== filters.status) {
        return false;
      }

      // Filtro de prioridade
      if (filters.priority !== 'all' && service.priority !== filters.priority) {
        return false;
      }

      // Filtro de tipo de serviço
      if (filters.serviceType !== 'all' && service.serviceType !== filters.serviceType) {
        return false;
      }

      // Filtro de busca textual - usando propriedades corretas do tipo Service
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          service.title.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower) ||
          service.client?.toLowerCase().includes(searchLower) ||
          service.location.toLowerCase().includes(searchLower) ||
          service.number.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [services, filters, searchTerm]);
};

// Utility para memoização de cálculos pesados
export const memoizeCalculation = <T>(
  calculation: () => T,
  dependencies: any[]
): T => {
  return useMemo(calculation, dependencies);
};

// Utility para virtualização de listas grandes
export const getVisibleItems = <T>(
  items: T[],
  startIndex: number,
  endIndex: number
): T[] => {
  return items.slice(startIndex, endIndex + 1);
};

// Performance metrics
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};

// Hook para cache local otimizado
export const useLocalCache = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Erro ao carregar cache local para ${key}:`, error);
      return initialValue;
    }
  });

  const setCachedValue = (newValue: T) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Erro ao salvar cache local para ${key}:`, error);
    }
  };

  return [value, setCachedValue] as const;
};
