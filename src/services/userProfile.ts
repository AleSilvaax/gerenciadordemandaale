
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    // Buscar as funções do usuário
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
      
    if (rolesError) throw rolesError;
      
    // Assumir primeira função como principal (pode melhorar isso no futuro)
    const primaryRole = roles && roles.length > 0 ? roles[0].role : 'tecnico';
    
    return {
      id: data.id,
      name: data.name,
      avatar: data.avatar || '',
      role: primaryRole
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
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        avatar,
        user_roles:user_roles(role)
      `);
    
    if (error) throw error;
    
    return data.map((profile: any) => ({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar || '',
      role: profile.user_roles && profile.user_roles.length > 0 
        ? profile.user_roles[0].role 
        : 'tecnico'
    }));
  } catch (error) {
    console.error("Erro ao buscar membros da equipe:", error);
    toast.error("Erro ao carregar membros da equipe");
    return [];
  }
}

// Atualizar perfil do usuário
export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
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
    // Corrigir a consulta para obter os IDs dos técnicos primeiro
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'tecnico');
    
    if (rolesError) throw rolesError;
    
    if (!userRoles || userRoles.length === 0) {
      return [];
    }
    
    // Extrair os IDs dos técnicos
    const technicianIds = userRoles.map(role => role.user_id);
    
    // Buscar os perfis dos técnicos
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', technicianIds);
    
    if (error) throw error;
    
    return data?.map((profile: any) => ({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar || '',
      role: 'tecnico'
    })) || [];
  } catch (error) {
    console.error("Erro ao buscar técnicos:", error);
    toast.error("Erro ao carregar lista de técnicos");
    return [];
  }
}
