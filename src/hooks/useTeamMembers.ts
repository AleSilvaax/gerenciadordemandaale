
import { useState, useEffect } from 'react';
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from '@/services/servicesDataService';
import { TeamMember } from '@/types/serviceTypes';
import { toast } from 'sonner';

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

  const addMember = async (memberData: Omit<TeamMember, 'id'>) => {
    try {
      const newMember = await addTeamMember(memberData);
      setTeamMembers(prev => [...prev, newMember]);
      toast.success('Membro adicionado com sucesso!');
      return newMember;
    } catch (err) {
      toast.error('Erro ao adicionar membro');
      throw err;
    }
  };

  const updateMember = async (id: string, memberData: Partial<TeamMember>) => {
    try {
      const updatedMember = await updateTeamMember(id, memberData);
      setTeamMembers(prev => prev.map(member => 
        member.id === id ? { ...member, ...memberData } : member
      ));
      toast.success('Membro atualizado com sucesso!');
      return updatedMember;
    } catch (err) {
      toast.error('Erro ao atualizar membro');
      throw err;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await deleteTeamMember(id);
      setTeamMembers(prev => prev.filter(member => member.id !== id));
      toast.success('Membro removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao remover membro');
      throw err;
    }
  };

  return { 
    teamMembers, 
    isLoading, 
    error,
    addMember,
    updateMember,
    deleteMember
  };
};
