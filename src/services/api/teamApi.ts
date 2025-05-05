
import { TeamMember } from '@/types/serviceTypes';
import { toast } from "sonner";
import { getTeamMembers as getTeamMembersFromTeamService } from '../teamService';
import { supabase } from '@/integrations/supabase/client';

// Get team members
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    // Usar a nova função de teamService para obter os membros da equipe
    const members = await getTeamMembersFromTeamService();
    return members;
  } catch (error) {
    console.error("Error getting team members:", error);
    toast.error("Falha ao carregar membros da equipe");
    return [];
  }
};

// Update team member
export const updateTeamMember = async (id: string, data: Partial<TeamMember>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        avatar: data.avatar
      })
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating team member:", error);
    toast.error("Falha ao atualizar membro da equipe");
    return false;
  }
};

// Add new team member - deprecated function
export const addTeamMember = async (member: Omit<TeamMember, "id">): Promise<TeamMember> => {
  throw new Error("Função substituída por teamService.addTeamMember");
};

// Remove team member - deprecated function
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  throw new Error("Função substituída por teamService.deleteTeamMember");
};
