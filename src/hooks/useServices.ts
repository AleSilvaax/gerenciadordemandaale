// Arquivo: src/hooks/useServices.ts (VERSÃO ATUALIZADA COM CONTROLE DE ACESSO)

import { useEffect } from 'react';
import { useServiceStore } from '@/store/serviceStore';
import { useQuery } from '@tanstack/react-query';
import { getServicesFromDatabase } from '@/services/serviceCrud'; // ✅ 1. Importamos a função diretamente de serviceCrud
import { useAuth } from '@/context/AuthContext'; // ✅ 2. Importamos o hook de autenticação

export const useServices = () => {
  // ✅ 3. Pegamos o usuário logado do contexto de autenticação
  const { user } = useAuth(); 
  const { services, setServices, setError, setLoading } = useServiceStore();

  const {
    data: fetchedServices,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    // ✅ 4. A chave da query agora inclui o ID do usuário.
    // Isso garante que, se o usuário mudar, os dados serão buscados novamente.
    queryKey: ['services-list', user?.id], 
    
    // ✅ 5. A função da query agora chama getServicesFromDatabase passando o usuário.
    queryFn: () => getServicesFromDatabase(user),
    
    // ✅ 6. A busca só é ativada se houver um usuário logado.
    // Isso evita buscas desnecessárias durante o logout ou antes do login.
    enabled: !!user, 
    
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    placeholderData: (previousData) => previousData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Atualiza o store do Zustand apenas quando a busca for bem-sucedida
  useEffect(() => {
    if (fetchedServices) {
      setServices(fetchedServices);
    }
  }, [fetchedServices, setServices]);

  // Sincroniza o estado de loading
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);
  
  // Trata e notifica os erros
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      console.error('[useServices] Erro ao carregar serviços:', error);
      setError(errorMessage);
      // A notificação de erro pode ser adicionada aqui se você usar um store de UI
    }
  }, [error, setError]);

  return {
    services,
    isLoading: isLoading, 
    isRefreshing: isFetching && !isLoading,
    error,
    refreshServices: refetch,
  };
};
