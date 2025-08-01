// ARQUIVO ATUALIZADO E PADRONIZADO: src/hooks/useTeamMembers.ts

import { useQuery } from '@tanstack/react-query';
// ATENÇÃO: Verifique se a função que busca os membros da equipe está neste arquivo.
// O nome pode ser ligeiramente diferente (ex: getTeamMembersFromDatabase).
import { getTeamMembers } from '@/services/teamMembersService'; 
import { TeamMember } from '@/types/serviceTypes';

export const useTeamMembers = () => {
  const {
    data: teamMembers,
    isLoading,
    error,
    refetch
  } = useQuery<TeamMember[]>({ // Especificamos que o dado retornado é um array de TeamMember
    queryKey: ['team-members-list'], // Uma chave única para o cache
    queryFn: getTeamMembers,          // A função que busca os dados
    staleTime: 5 * 60 * 1000,         // Cache de 5 minutos
    
    // A lógica que impede os dados de sumirem durante a atualização
    placeholderData: (previousData) => previousData,
    
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    // Retornamos os dados diretamente do useQuery. 
    // O '?? []' garante que, se não houver dados, retorne um array vazio.
    teamMembers: teamMembers ?? [], 
    isLoading,
    error,
    // Renomeamos 'refetch' para uma função com nome mais específico
    refreshTeamMembers: refetch,
  };
};
