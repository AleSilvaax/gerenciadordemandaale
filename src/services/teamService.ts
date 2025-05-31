import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { TeamMember, UserRole } from '@/types/serviceTypes';

// Função para gerar código de convite
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Criar uma nova equipe
export const createTeam = async (name: string): Promise<{ id: string, invite_code: string } | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log("Criando equipe para usuário:", userData);
    
    if (userError || !userData.user) {
      console.error("Usuário não autenticado:", userError);
      throw new Error("Usuário não autenticado");
    }
    
    console.log("Chamando criação de equipe com:", {name, creator_id: userData.user.id});
    
    // Gerar código único
    let inviteCode = generateInviteCode();
    let codeExists = true;
    
    // Verificar se o código já existe
    while (codeExists) {
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();
      
      if (!existingTeam) {
        codeExists = false;
      } else {
        inviteCode = generateInviteCode();
      }
    }
    
    // Criar a equipe
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: name,
        created_by: userData.user.id,
        invite_code: inviteCode
      })
      .select('id, invite_code')
      .single();
    
    if (teamError) {
      console.error("Erro ao criar equipe:", teamError);
      throw teamError;
    }
    
    console.log("Equipe criada:", teamData);
    
    // Atualizar o perfil do usuário para associá-lo à equipe
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ team_id: teamData.id })
      .eq('id', userData.user.id);
    
    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError);
      throw profileError;
    }
    
    console.log("Perfil atualizado com sucesso");
    toast.success("Equipe criada com sucesso!");
    return teamData;
  } catch (error: any) {
    console.error("Erro ao criar equipe:", error);
    toast.error("Falha ao criar a equipe: " + (error.message || "Erro desconhecido"));
    return null;
  }
};

// Associar um usuário a uma equipe usando o código de convite
export const joinTeamByCode = async (code: string): Promise<boolean> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Usuário não autenticado");
    }
    
    console.log("Tentando juntar usuário à equipe com código:", code);
    
    // Buscar a equipe pelo código
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('invite_code', code)
      .single();
    
    if (teamError || !teamData) {
      console.error("Código de convite inválido:", teamError);
      throw new Error("Código de convite inválido");
    }
    
    // Atualizar o perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ team_id: teamData.id })
      .eq('id', userData.user.id);
    
    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError);
      throw profileError;
    }
    
    console.log("Usuário associado à equipe com sucesso");
    toast.success("Você entrou na equipe com sucesso!");
    return true;
  } catch (error: any) {
    console.error("Erro ao entrar na equipe:", error);
    toast.error(error.message || "Falha ao entrar na equipe");
    return false;
  }
};

// Obter informações da equipe atual do usuário
export const getCurrentTeam = async (): Promise<{ id: string, name: string, invite_code: string } | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Usuário não autenticado");
    
    // Primeiro obtemos o team_id do perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', userData.user.id)
      .single();
    
    if (profileError || !profileData.team_id) return null;
    
    // Depois buscamos os detalhes da equipe
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, name, invite_code')
      .eq('id', profileData.team_id)
      .single();
    
    if (teamError) return null;
    
    return teamData;
  } catch (error) {
    console.error("Erro ao obter informações da equipe:", error);
    return null;
  }
};

// Obter membros da equipe atual
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const team = await getCurrentTeam();
    if (!team) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .eq('team_id', team.id);
    
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
          role: (roleData?.role as UserRole) || 'tecnico',
        };
      })
    );
    
    return membersWithRoles;
  } catch (error) {
    console.error("Erro ao obter membros da equipe:", error);
    return [];
  }
};

// Adicionar um novo membro à equipe
export const addTeamMember = async (member: Omit<TeamMember, "id">): Promise<TeamMember> => {
  try {
    // Esta função só seria implementada completamente
    // se houvesse um processo de criação de usuário
    // desde a aplicação. Por enquanto, retornamos um erro.
    throw new Error("Esta funcionalidade requer implementação de criação de usuários");
  } catch (error) {
    console.error("Erro ao adicionar membro à equipe:", error);
    throw error;
  }
};

// Remover um membro da equipe
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  try {
    // Esta função só seria implementada completamente
    // se houvesse um processo de gerenciamento completo de usuários
    // Por enquanto, retornamos um erro.
    throw new Error("Esta funcionalidade requer implementação completa de gerenciamento de usuários");
  } catch (error) {
    console.error("Erro ao remover membro da equipe:", error);
    throw error;
  }
};
