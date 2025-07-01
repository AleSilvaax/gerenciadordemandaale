
import { useState, useEffect } from 'react';
import { getTeamMembers } from '@/services/servicesDataService';
import { TeamMember } from '@/types/serviceTypes';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const members = await getTeamMembers();
        setTeamMembers(members);
      } catch (err) {
        setError(err as Error);
        console.error('Erro ao carregar membros da equipe:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  return { teamMembers, isLoading, error };
};
