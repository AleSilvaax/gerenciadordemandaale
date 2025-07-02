
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/services/servicesDataService';
import { Service } from '@/types/serviceTypes';
import { useDebounce } from '@/utils/performance';

interface ServiceFilters {
  status: string;
  priority: string;
  serviceType: string;
  searchTerm: string;
}

const SERVICES_QUERY_KEY = ['services'];
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export const useOptimizedServices = () => {
  const [filters, setFilters] = useState<ServiceFilters>({
    status: 'all',
    priority: 'all',
    serviceType: 'all',
    searchTerm: '',
  });

  const queryClient = useQueryClient();

  // React Query para cache inteligente
  const {
    data: services = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: getServices,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Debounced search para otimizar performance
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  // Filtros memoizados para evitar recálculos desnecessários
  const filteredServices = useMemo(() => {
    let filtered = [...services];

    // Filtro de status
    if (filters.status !== 'all') {
      filtered = filtered.filter(service => service.status === filters.status);
    }

    // Filtro de prioridade
    if (filters.priority !== 'all') {
      filtered = filtered.filter(service => service.priority === filters.priority);
    }

    // Filtro de tipo de serviço
    if (filters.serviceType !== 'all') {
      filtered = filtered.filter(service => service.serviceType === filters.serviceType);
    }

    // Filtro de busca textual (debounced)
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
  }, [services, filters.status, filters.priority, filters.serviceType, debouncedSearchTerm]);

  // Estatísticas calculadas de forma otimizada
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

  // Opções de filtro extraídas dos dados reais
  const filterOptions = useMemo(() => {
    const serviceTypes = [...new Set(services.map(s => s.serviceType).filter(Boolean))];
    const priorities = [...new Set(services.map(s => s.priority).filter(Boolean))];
    
    return {
      serviceTypes,
      priorities,
      statuses: ['pendente', 'em_andamento', 'concluido', 'cancelado']
    };
  }, [services]);

  // Funções de ação otimizadas
  const actions = {
    loadServices: () => {
      return refetch();
    },
    
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

    // Invalidar cache quando necessário
    invalidateCache: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },

    // Atualização otimista do cache
    updateServiceInCache: (updatedService: Service) => {
      queryClient.setQueryData(SERVICES_QUERY_KEY, (oldData: Service[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(service => 
          service.id === updatedService.id ? updatedService : service
        );
      });
    },

    // Adicionar novo serviço ao cache
    addServiceToCache: (newService: Service) => {
      queryClient.setQueryData(SERVICES_QUERY_KEY, (oldData: Service[] | undefined) => {
        if (!oldData) return [newService];
        return [newService, ...oldData];
      });
    }
  };

  return {
    services: filteredServices,
    allServices: services,
    isLoading,
    error,
    filters,
    serviceStats,
    filterOptions,
    actions,
  };
};

// Hook específico para performance de busca
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
