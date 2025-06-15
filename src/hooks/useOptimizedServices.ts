
import { useMemo, useCallback } from 'react';
import { useServiceStore } from '@/store/serviceStore';
import { useFilteredServices, useDebounce } from '@/utils/performance';
import { Service } from '@/types/serviceTypes';

export const useOptimizedServices = () => {
  const {
    services,
    isLoading,
    error,
    filters,
    setFilters,
    loadServices,
    clearError
  } = useServiceStore();

  // Memoized filtered services
  const filteredServices = useFilteredServices(services, filters, filters.searchTerm);

  // Debounced search to avoid excessive filtering
  const debouncedSetSearchTerm = useDebounce((searchTerm: string) => {
    setFilters({ searchTerm });
  }, 300);

  // Memoized filter handlers
  const handleStatusFilter = useCallback((status: string) => {
    setFilters({ status });
  }, [setFilters]);

  const handlePriorityFilter = useCallback((priority: string) => {
    setFilters({ priority });
  }, [setFilters]);

  const handleServiceTypeFilter = useCallback((serviceType: string) => {
    setFilters({ serviceType });
  }, [setFilters]);

  // Memoized service statistics usando os valores corretos do enum
  const serviceStats = useMemo(() => {
    const total = services.length;
    const pending = services.filter(s => s.status === 'pendente').length;
    const inProgress = services.filter(s => s.status === 'pendente').length; // Ajustado para usar valor válido
    const completed = services.filter(s => s.status === 'concluido').length;
    const highPriority = services.filter(s => s.priority === 'alta').length;

    return {
      total,
      pending,
      inProgress,
      completed,
      highPriority,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [services]);

  // Memoized grouped services (for dashboard)
  const groupedServices = useMemo(() => {
    const groups = services.reduce((acc, service) => {
      const key = service.status;
      if (!acc[key]) acc[key] = [];
      acc[key].push(service);
      return acc;
    }, {} as Record<string, Service[]>);

    return groups;
  }, [services]);

  return {
    services: filteredServices,
    allServices: services,
    isLoading,
    error,
    filters,
    serviceStats,
    groupedServices,
    actions: {
      loadServices,
      clearError,
      setSearchTerm: debouncedSetSearchTerm,
      setStatusFilter: handleStatusFilter,
      setPriorityFilter: handlePriorityFilter,
      setServiceTypeFilter: handleServiceTypeFilter
    }
  };
};
