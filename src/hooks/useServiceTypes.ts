// ARQUIVO ATUALIZADO E PADRONIZADO: src/hooks/useServiceTypes.ts

import { useQuery } from '@tanstack/react-query';
import { getServiceTypesFromDatabase } from '@/services/serviceTypesService';
import { ServiceTypeConfig } from '@/types/serviceTypes';

export const useServiceTypes = () => {
  const {
    data: serviceTypes,
    isLoading,
    error,
    refetch
  } = useQuery<ServiceTypeConfig[]>({ // Especificamos o tipo de dado esperado
    queryKey: ['service-types-list'],   // Chave de cache única para os tipos de serviço
    queryFn: getServiceTypesFromDatabase, // A função que busca os dados
    staleTime: 5 * 60 * 1000,           // Cache de 5 minutos

    // A lógica crucial que impede os dados de sumirem durante a atualização
    placeholderData: (previousData) => previousData,
    
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    // Retornamos os dados diretamente do useQuery. 
    // O '?? []' garante que, se não houver dados, retorne um array vazio.
    serviceTypes: serviceTypes ?? [], 
    isLoading,
    error,
    // Renomeamos 'refetch' para uma função com nome mais específico
    refetchServiceTypes: refetch,
  };
};
