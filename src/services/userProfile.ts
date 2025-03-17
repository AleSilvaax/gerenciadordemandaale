
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updateUserAvatar } from "./upload";

// Interface para o perfil de usuário
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

// Buscar perfil do usuário atual
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    console.log("Buscando perfil do usuário atual...");
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("Nenhum usuário logado");
      return null;
    }
    
    console.log("Usuário autenticado encontrado:", user.id);
    
    // Buscar o perfil do usuário na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);
      throw profileError;
    }
    
    // Se não encontrou perfil, provavelmente é um usuário novo ou não tem perfil ainda
    if (!profile) {
      console.log("Perfil não encontrado, verificando se precisa ser criado");
      return null;
    }
    
    console.log("Perfil encontrado:", profile);
    
    // Buscar as funções do usuário
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (roleError && roleError.code !== 'PGRST116') {
      console.error("Erro ao buscar função do usuário:", roleError);
      throw roleError;
    }
    
    // Definir a função padrão como 'tecnico' se não encontrar
    const role = roleData?.role || 'tecnico';
    console.log("Função do usuário:", role);
    
    return {
      id: profile.id,
      name: profile.name || 'Usuário',
      avatar: profile.avatar || '',
      role: role
    };
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    toast.error("Erro ao carregar perfil de usuário");
    return null;
  }
}

// Buscar todos os membros da equipe
export async function getAllTeamMembers(): Promise<UserProfile[]> {
  try {
    console.log("Buscando todos os membros da equipe...");
    
    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar');
    
    if (profilesError) throw profilesError;
    
    console.log("Perfis encontrados:", profiles?.length || 0);
    
    // Para cada perfil, buscar a função
    const members: UserProfile[] = [];
    
    for (const profile of profiles || []) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      members.push({
        id: profile.id,
        name: profile.name || 'Usuário',
        avatar: profile.avatar || '',
        role: roleData?.role || 'tecnico'
      });
    }
    
    console.log("Membros da equipe processados:", members.length);
    return members;
  } catch (error) {
    console.error("Erro ao buscar membros da equipe:", error);
    toast.error("Erro ao carregar membros da equipe");
    return [];
  }
}

// Atualizar perfil do usuário
export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    console.log("Atualizando perfil do usuário:", userId);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        avatar: data.avatar,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    toast.success("Perfil atualizado com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    toast.error("Erro ao atualizar perfil de usuário");
    return false;
  }
}

// Atualizar avatar com upload de arquivo
export async function updateProfileAvatar(userId: string, file: File): Promise<boolean> {
  try {
    console.log("Atualizando avatar do usuário:", userId);
    const avatarUrl = await updateUserAvatar(userId, file);
    
    if (!avatarUrl) {
      throw new Error("Falha ao fazer upload do avatar");
    }
    
    // Atualizar o URL do avatar no perfil
    return await updateUserProfile(userId, { avatar: avatarUrl });
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
    toast.error("Erro ao atualizar foto de perfil");
    return false;
  }
}

// Buscar técnicos (usuários com função 'tecnico')
export async function getTechnicians(): Promise<UserProfile[]> {
  try {
    console.log("Buscando técnicos...");
    
    // Buscar os IDs dos usuários com função 'tecnico'
    const { data: technicianRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'tecnico');
    
    if (rolesError) throw rolesError;
    
    if (!technicianRoles || technicianRoles.length === 0) {
      console.log("Nenhum técnico encontrado");
      return [];
    }
    
    console.log("Técnicos encontrados:", technicianRoles.length);
    
    // Extrair os IDs dos técnicos
    const technicianIds = technicianRoles.map(role => role.user_id);
    
    // Buscar os perfis dos técnicos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', technicianIds);
    
    if (profilesError) throw profilesError;
    
    const technicians = profiles?.map(profile => ({
      id: profile.id,
      name: profile.name || 'Técnico',
      avatar: profile.avatar || '',
      role: 'tecnico'
    })) || [];
    
    console.log("Perfis de técnicos processados:", technicians.length);
    return technicians;
  } catch (error) {
    console.error("Erro ao buscar técnicos:", error);
    toast.error("Erro ao carregar lista de técnicos");
    return [];
  }
}
