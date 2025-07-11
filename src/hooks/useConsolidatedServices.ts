import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/services/servicesDataService';
import { Service } from '@/types/serviceTypes';
import { useDebounce } from '@/utils/performance';
import { useUIStore } from '@/store/uiStore';

interface ServiceFilters {
  status: string;
  priority: string;
  serviceType: string;
  searchTerm: string;
}

interface UseConsolidatedServicesOptions {
  enableFilters?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

const SERVICES_QUERY_KEY = ['services'];

export const useConsolidatedServices = (options: UseConsolidatedServicesOptions = {}) => {
  const {
    enableFilters = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
  } = options;

  const { addNotification } = useUIStore();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ServiceFilters>({
    status: 'all',
    priority: 'all',
    serviceType: 'all',
    searchTerm: '',
  });

  // React Query with intelligent caching
  const {
    data: services = [],
    isLoading,
    error,
    refetch,
    isStale
  } = useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: getServices,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Debounced search for performance
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  // Memoized filtered services
  const filteredServices = useMemo(() => {
    if (!enableFilters) return services;

    let filtered = [...services];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(service => service.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(service => service.priority === filters.priority);
    }

    // Service type filter
    if (filters.serviceType !== 'all') {
      filtered = filtered.filter(service => service.serviceType === filters.serviceType);
    }

    // Text search filter (debounced)
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower) ||
        service.client?.toLowerCase().includes(searchLower) ||
        service.location.toLowerCase().includes(searchLower) ||
        service.number.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [services, filters.status, filters.priority, filters.serviceType, debouncedSearchTerm, enableFilters]);

  // Optimized service statistics
  const serviceStats = useMemo(() => {
    const total = services.length;
    const pending = services.filter(s => s.status === 'pendente').length;
    const inProgress = services.filter(s => s.status === 'em_andamento').length;
    const completed = services.filter(s => s.status === 'concluido').length;
    const highPriority = services.filter(s => s.priority === 'alta').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      highPriority,
      completionRate,
    };
  }, [services]);

  // Filter options extracted from real data
  const filterOptions = useMemo(() => {
    const serviceTypes = [...new Set(services.map(s => s.serviceType).filter(Boolean))];
    const priorities = [...new Set(services.map(s => s.priority).filter(Boolean))];
    
    return {
      serviceTypes,
      priorities,
      statuses: ['pendente', 'em_andamento', 'concluido', 'cancelado']
    };
  }, [services]);

  // Error handling
  useEffect(() => {
    if (error) {
      addNotification({
        title: 'Erro ao carregar dados',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'error'
      });
    }
  }, [error, addNotification]);

  // Optimized actions
  const actions = useMemo(() => ({
    refreshServices: () => refetch(),
    
    setSearchTerm: (term: string) => {
      setFilters(prev => ({ ...prev, searchTerm: term }));
    },
    
    setStatusFilter: (status: string) => {
      setFilters(prev => ({ ...prev, status }));
    },
    
    setPriorityFilter: (priority: string) => {
      setFilters(prev => ({ ...prev, priority }));
    },
    
    setServiceTypeFilter: (serviceType: string) => {
      setFilters(prev => ({ ...prev, serviceType }));
    },
    
    clearFilters: () => {
      setFilters({
        status: 'all',
        priority: 'all',
        serviceType: 'all',
        searchTerm: '',
      });
    },

    // Cache management
    invalidateCache: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },

    // Optimistic updates
    updateServiceInCache: (updatedService: Service) => {
      queryClient.setQueryData(SERVICES_QUERY_KEY, (oldData: Service[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(service => 
          service.id === updatedService.id ? updatedService : service
        );
      });
    },

    addServiceToCache: (newService: Service) => {
      queryClient.setQueryData(SERVICES_QUERY_KEY, (oldData: Service[] | undefined) => {
        if (!oldData) return [newService];
        return [newService, ...oldData];
      });
    },

    removeServiceFromCache: (serviceId: string) => {
      queryClient.setQueryData(SERVICES_QUERY_KEY, (oldData: Service[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(service => service.id !== serviceId);
      });
    }
  }), [refetch, queryClient]);

  return {
    // Data
    services: filteredServices,
    allServices: services,
    serviceStats,
    filterOptions,
    
    // State
    isLoading,
    error,
    isStale,
    filters,
    
    // Actions
    actions,
    
    // Legacy compatibility
    refreshServices: actions.refreshServices,
    setServices: () => {}, // Deprecated - use cache actions instead
    setLoading: () => {}, // Deprecated - handled internally
    setError: () => {}, // Deprecated - handled internally
  };
};

// Hook for service search optimization
export const useServiceSearch = (searchTerm: string, services: Service[]) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  return useMemo(() => {
    if (!debouncedSearchTerm.trim()) return services;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return services.filter(service => 
      service.title.toLowerCase().includes(searchLower) ||
      service.description?.toLowerCase().includes(searchLower) ||
      service.client?.toLowerCase().includes(searchLower) ||
      service.location.toLowerCase().includes(searchLower) ||
      service.number.toLowerCase().includes(searchLower)
    );
  }, [services, debouncedSearchTerm]);
};
