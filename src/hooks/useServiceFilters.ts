
import { useState, useMemo } from 'react';
import { Service, ServiceStatus } from '@/types/serviceTypes';

export interface FilterState {
  search: string;
  status: ServiceStatus | 'todos';
  technicianId: string;
  serviceType: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

export const useServiceFilters = (services: Service[]) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'todos',
    technicianId: 'all',
    serviceType: 'all',
    dateRange: {
      from: null,
      to: null
    }
  });

  const filteredServices = useMemo(() => {
    console.log('[FILTERS] Aplicando filtros:', filters);
    console.log('[FILTERS] Total de serviços:', services.length);
    
    let filtered = [...services];

    // Filtro de busca por texto
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(service => 
        service.title?.toLowerCase().includes(searchTerm) ||
        service.client?.toLowerCase().includes(searchTerm) ||
        service.location?.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm) ||
        service.number?.toLowerCase().includes(searchTerm)
      );
      console.log('[FILTERS] Após busca por texto:', filtered.length);
    }

    // Filtro por status
    if (filters.status !== 'todos') {
      filtered = filtered.filter(service => service.status === filters.status);
      console.log('[FILTERS] Após filtro de status:', filtered.length);
    }

    // Filtro por técnico
    if (filters.technicianId && filters.technicianId !== 'all') {
      filtered = filtered.filter(service => 
        service.technician?.id === filters.technicianId
      );
      console.log('[FILTERS] Após filtro de técnico:', filtered.length);
    }

    // Filtro por tipo de serviço
    if (filters.serviceType && filters.serviceType !== 'all') {
      filtered = filtered.filter(service => 
        service.serviceType === filters.serviceType
      );
      console.log('[FILTERS] Após filtro de tipo:', filtered.length);
    }

    // Filtro por data - usando creationDate em vez de createdAt
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(service => {
        const serviceDate = new Date(service.creationDate || service.date || new Date());
        const fromDate = filters.dateRange.from;
        const toDate = filters.dateRange.to;

        if (fromDate && serviceDate < fromDate) return false;
        if (toDate && serviceDate > toDate) return false;
        return true;
      });
      console.log('[FILTERS] Após filtro de data:', filtered.length);
    }

    console.log('[FILTERS] Total filtrado:', filtered.length);
    return filtered;
  }, [services, filters]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    console.log('[FILTERS] Atualizando filtro:', key, value);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    console.log('[FILTERS] Limpando filtros');
    setFilters({
      search: '',
      status: 'todos',
      technicianId: 'all',
      serviceType: 'all',
      dateRange: {
        from: null,
        to: null
      }
    });
  };

  return {
    filters,
    filteredServices,
    updateFilter,
    clearFilters
  };
};
