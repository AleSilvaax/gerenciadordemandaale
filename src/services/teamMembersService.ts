// Arquivo: src/services/teamMembersService.ts (VERSÃO COMPLETA E CORRIGIDA)

import { supabase } from '@/integrations/supabase/client';
import { TeamMember, UserRole } from '@/types/serviceTypes';

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, name, avatar, user_roles (role)`);

    if (error) throw error;
    if (!data) return []; 

    const members: TeamMember[] = data.map(profile => ({
      id: profile.id,
      name: profile.name || "Sem Nome",
      avatar: profile.avatar || "",
      // @ts-ignore
      role: profile.user_roles?.[0]?.role as UserRole || "tecnico",
    }));
    return members;
  } catch (error) {
    console.error("Erro ao buscar membros da equipe:", error);
    return []; // Garante que retorne um array vazio em caso de erro.
  }
};

export const addTeamMember = async (member: { name: string; role: UserRole; avatar?: string; id?: string; }): Promise<TeamMember> => {
  const insertData: any = { name: member.name, avatar: member.avatar || null };
  if (member.id) { insertData.id = member.id; }
  const { data: profile, error: profileError } = await supabase.from('profiles').insert(insertData).select().single();
  if (profileError) throw profileError;
  const { error: roleError } = await supabase.from('user_roles').insert({ user_id: profile.id, role: member.role });
  if (roleError) throw roleError;
  return { id: profile.id, name: profile.name || "", avatar: profile.avatar || "", role: member.role };
};

export const updateTeamMember = async (memberId: string, data: Partial<TeamMember>): Promise<boolean> => {
  const { error } = await supabase.from('profiles').update({ name: data.name, avatar: data.avatar, email: data.email, phone: data.phone, signature: data.signature }).eq('id', memberId);
  if (error) throw error;
  if (data.role) {
    const { error: roleError } = await supabase.from('user_roles').update({ role: data.role }).eq('user_id', memberId);
    if (roleError) throw roleError;
  }
  return true;
};

export const deleteTeamMember = async (memberId: string): Promise<boolean> => {
  const { error } = await supabase.from('profiles').delete().eq('id', memberId);
  if (error) throw error;
  return true;
};
