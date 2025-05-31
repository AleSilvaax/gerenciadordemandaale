
import { TeamMember } from '@/types/serviceTypes';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

// Get all users as team members (since there are no teams anymore)
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar');
    
    if (error) throw error;
    
    if (!data) return [];
    
    // Obtemos o papel de cada membro
    const membersWithRoles: TeamMember[] = await Promise.all(
      data.map(async (profile) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .single();
        
        return {
          id: profile.id,
          name: profile.name || 'Sem nome',
          avatar: profile.avatar || '',
          role: (roleData?.role || 'tecnico') as any,
        };
      })
    );
    
    return membersWithRoles;
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
  throw new Error("Função não mais necessária - todos os usuários estão na mesma equipe");
};

// Remove team member - deprecated function
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  throw new Error("Função não mais necessária - todos os usuários estão na mesma equipe");
};
