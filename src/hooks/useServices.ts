
import { useEffect } from 'react';
import { useServiceStore } from '@/store/serviceStore';
import { useUIStore } from '@/store/uiStore';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/services/servicesDataService';

export const useServices = () => {
  const { addNotification } = useUIStore();
  const { services, setServices, setError, setLoading } = useServiceStore();

  // Use React Query with intelligent caching to prevent unnecessary reloads
  const {
    data: cachedServices,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['services-list'],
    queryFn: getServices,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Prevent automatic refetch on window focus
    refetchOnReconnect: false, // Prevent automatic refetch on reconnect
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // 1 second delay between retries
  });

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

  // Show error notification only once
  useEffect(() => {
    if (error && !isLoading) {
      console.error('[useServices] Erro ao carregar serviços:', error);
      addNotification({
        title: 'Erro ao carregar dados',
        message: 'Não foi possível carregar as demandas. Verifique sua conexão.',
        type: 'error'
      });
    }
  }, [error, isLoading, addNotification]);

  return {
    services,
    isLoading,
    error,
    refreshServices: refetch, // Manual refresh only
  };
};
