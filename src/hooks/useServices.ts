// ARQUIVO ATUALIZADO: src/hooks/useServices.ts

import { useEffect } from 'react';
import { useServiceStore } from '@/store/serviceStore';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/services/servicesDataService';
import { useAuth } from '@/context/AuthContext'; // ✅ 1. Importamos o hook de autenticação

export const useServices = () => {
  const { user } = useAuth(); // ✅ 2. Pegamos o usuário logado
  const { services, setServices, setError, setLoading } = useServiceStore();

  const {
    data: fetchedServices,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    // ✅ 3. A chave da query agora depende do usuário. Se o usuário mudar, os dados são buscados novamente.
    queryKey: ['services-list', user?.id], 
    
    // ✅ 4. A função de busca agora envia o usuário para a camada de dados.
    queryFn: () => getServices(user),
    
    // ✅ 5. A busca só é executada se houver um usuário logado.
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
      console.error('[useServices] Erro ao carregar serviços:', error);
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
