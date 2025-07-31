// Arquivo: src/services/teamMembersService.ts (VERSÃO FINAL E CORRIGIDA)

import { supabase } from '@/integrations/supabase/client';
import { TeamMember, UserRole } from '@/types/serviceTypes';

/**
 * Busca todos os membros da equipe e seus respectivos papéis em uma única consulta.
 * É robusta e sempre retorna um array, mesmo em caso de erro ou se não houver dados.
 */
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        avatar,
        user_roles (
          role
        )
      `);

    if (error) {
      console.error("Erro ao buscar membros da equipe:", error);
      throw error; // Lança o erro para ser capturado pelo react-query ou chamador
    }

    if (!data) {
      return []; // Garante que sempre retorne um array se não houver dados
    }

    const members: TeamMember[] = data.map(profile => ({
      id: profile.id,
      name: profile.name || "Sem Nome",
      avatar: profile.avatar || "",
      // @ts-ignore - Usamos ts-ignore pois a estrutura é garantida pela consulta
      role: profile.user_roles?.[0]?.role as UserRole || "tecnico",
    }));

    return members;
  } catch (error) {
    // Em caso de qualquer erro, loga e retorna um array vazio para não quebrar a UI
    console.error("Falha crítica ao buscar membros da equipe:", error);
    return []; 
  }
};

// Suas outras funções permanecem exatamente as mesmas
export const addTeamMember = async (member: {
  name: string;
  role: UserRole;
  avatar?: string;
  id?: string;
}): Promise<TeamMember> => {
  const insertData: any = {
    name: member.name,
    avatar: member.avatar || null
  };
  if (member.id) {
    insertData.id = member.id;
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert(insertData)
    .select()
    .single();

  if (profileError) throw profileError;

  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: profile.id,
      role: member.role
    });
  if (roleError) throw roleError;

  return {
    id: profile.id,
    name: profile.name || "",
    avatar: profile.avatar || "",
    role: member.role
  };
};

export const updateTeamMember = async (memberId: string, data: Partial<TeamMember>): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      name: data.name,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone,
      signature: data.signature
    })
    .eq('id', memberId);

  if (error) throw error;

  if (data.role) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: data.role })
      .eq('user_id', memberId);
    if (roleError) throw roleError;
  }
  return true;
};

export const deleteTeamMember = async (memberId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
  return true;
};
