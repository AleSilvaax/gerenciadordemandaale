// ARQUIVO ATUALIZADO: src/hooks/useServices.ts

import { useEffect } from 'react';
import { useServiceStore } from '@/store/serviceStore';
import { useUIStore } from '@/store/uiStore';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/services/servicesDataService';

export const useServices = () => {
  const { addNotification } = useUIStore();
  // Pegamos os 'services' do store para usar como dado inicial/placeholder
  const { services, setServices, setError, setLoading } = useServiceStore();

  const {
    data: cachedServices,
    isLoading,
    isFetching, // Usaremos isFetching para saber sobre atualizações em segundo plano
    error,
    refetch
  } = useQuery({
    queryKey: ['services-list'],
    queryFn: getServices,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    // A LINHA MÁGICA ABAIXO:
    // Mantém os dados antigos visíveis enquanto busca por novos.
    // Isso evita o "sumiço" dos dados durante um refresh.
    placeholderData: (previousData) => previousData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Atualiza o store apenas quando a busca for bem-sucedida
  useEffect(() => {
    if (cachedServices) {
      setServices(cachedServices);
    }
  }, [cachedServices, setServices]);

  // Sincroniza o estado de loading do store
  useEffect(() => {
    // isLoading é true só na primeira busca.
    // isFetching é true em toda busca (primeira ou em segundo plano).
    // Queremos que a tela só mostre o "loading" grande na primeira vez.
    setLoading(isLoading);
  }, [isLoading, setLoading]);
  
  // Trata e notifica os erros
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      console.error('[useServices] Erro ao carregar serviços:', error);
      setError(errorMessage);
      addNotification({
        title: 'Erro ao carregar dados',
        message: 'Não foi possível atualizar as demandas. Os dados mostrados podem estar desatualizados.',
        type: 'error'
      });
    }
  }, [error, setError, addNotification]);

  return {
    services,
    isLoading: isLoading, // O loading principal, que bloqueia a tela
    isRefreshing: isFetching && !isLoading, // Um novo estado para indicar refresh em background
    error,
    refreshServices: refetch,
  };
};
