// Arquivo: src/hooks/useServices.ts (VERSÃO ATUALIZADA)

import { useEffect } from 'react';
import { useServiceStore } from '@/store/serviceStore';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/services/servicesDataService';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';

export const useServices = () => {
  const { user } = useEnhancedAuth();
  const { services, setServices, setError, setLoading } = useServiceStore();

  const {
    data: fetchedServices,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: ['services-list', user?.id], 
    queryFn: () => getServices(),
    enabled: !!user, 
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (fetchedServices) {
      setServices(fetchedServices);
    }
  }, [fetchedServices, setServices]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);
  
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
    }
  }, [error, setError]);

  return {
    services,
    isLoading,
    isRefreshing: isFetching && !isLoading,
    error,
    refreshServices: refetch,
  };
};
