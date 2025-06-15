
import { useEffect } from 'react';
import { useServiceStore } from '@/store/serviceStore';
import { useUIStore } from '@/store/uiStore';

export const useServices = () => {
  const {
    services,
    isLoading,
    error,
    filters,
    loadServices,
    setFilters,
    clearError
  } = useServiceStore();

  const { addNotification } = useUIStore();

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (error) {
      addNotification({
        title: 'Erro ao carregar dados',
        message: error,
        type: 'error'
      });
    }
  }, [error, addNotification]);

  const filteredServices = services.filter(service => {
    if (filters.status !== 'all' && service.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && service.priority !== filters.priority) {
      return false;
    }
    if (filters.serviceType !== 'all' && service.serviceType !== filters.serviceType) {
      return false;
    }
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        service.title.toLowerCase().includes(searchLower) ||
        service.client?.toLowerCase().includes(searchLower) ||
        service.location.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return {
    services: filteredServices,
    allServices: services,
    isLoading,
    error,
    filters,
    setFilters,
    clearError,
    refreshServices: loadServices
  };
};
