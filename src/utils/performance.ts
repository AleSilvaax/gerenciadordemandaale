
import { useMemo, useRef, useEffect, useState } from 'react';
import { Service } from '@/types/serviceTypes';

export interface ServiceFilters {
  status: string;
  priority: string;
  serviceType: string;
  searchTerm: string;
}

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
          service.client?.toLowerCase().includes(searchLower) || // Usando 'client' ao invés de 'clientName'
          service.location.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [services, filters, searchTerm]);
};

// Hook de debounce para otimizar performance
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const debouncedCallback = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    }) as T;
  }, [callback, delay]);

  return debouncedCallback;
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
