
import { useEffect } from 'react';
import { useServiceStore } from '@/store/serviceStore';
import { useUIStore } from '@/store/uiStore';
import { useCachedData } from './useCachedData';
import { getServices } from '@/services/servicesDataService';
import { useOptimizedServices } from './useOptimizedServices';

export const useServices = () => {
  const { addNotification } = useUIStore();
  const { services, setServices, setError, setLoading } = useServiceStore();

  // Use cached data with automatic background revalidation
  const {
    data: cachedServices,
    isLoading,
    error,
    mutate
  } = useCachedData(
    'services-list',
    getServices,
    {
      ttl: 2 * 60 * 1000, // 2 minutes cache
      staleWhileRevalidate: true
    }
  );

  // Update store when cached data changes
  useEffect(() => {
    if (cachedServices) {
      setServices(cachedServices);
    }
    setLoading(isLoading);
    if (error) {
      setError(error.message);
    }
  }, [cachedServices, isLoading, error, setServices, setLoading, setError]);

  useEffect(() => {
    if (error) {
      addNotification({
        title: 'Erro ao carregar dados',
        message: error.message,
        type: 'error'
      });
    }
  }, [error, addNotification]);

  // Use optimized services hook for filtering and performance
  const optimizedServices = useOptimizedServices();

  return {
    ...optimizedServices,
    refreshServices: () => mutate(), // Use mutate to refresh cache
    isLoading
  };
};
