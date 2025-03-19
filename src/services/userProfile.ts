
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { updateUserAvatar } from "./upload";

// Define valid role types to match the database constraints
export type UserRole = 'tecnico' | 'administrador' | 'gestor';

// Interface para o perfil de usuário
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role?: UserRole;
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
      
      // Tentar criar perfil para o usuário
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || "Usuário",
          avatar: ""
        });
      
      if (insertError) {
        console.error("Erro ao criar perfil:", insertError);
        throw insertError;
      }
      
      // Retornar perfil recém-criado
      return {
        id: user.id,
        name: user.user_metadata?.name || "Usuário",
        avatar: "",
        role: "tecnico" // Papel padrão
      };
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
    
    // Se não encontrou a função, criar uma
    if (!roleData) {
      const { error: insertRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'tecnico' as UserRole // Função padrão com tipo explícito
        });
      
      if (insertRoleError) {
        console.error("Erro ao criar função do usuário:", insertRoleError);
      }
    }
    
    // Definir a função padrão como 'tecnico' se não encontrar
    const role = (roleData?.role || 'tecnico') as UserRole;
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
        role: (roleData?.role || 'tecnico') as UserRole
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
    
    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    updateData.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    if (error) throw error;
    
    // If role is being updated, update user_roles table
    if (data.role) {
      // Ensure role is a valid UserRole type
      const role = data.role as UserRole;
      
      // Check if role record exists
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleCheckError && roleCheckError.code !== 'PGRST116') {
        throw roleCheckError;
      }
      
      if (existingRole) {
        // Update existing role
        const { error: roleUpdateError } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('id', existingRole.id);
        
        if (roleUpdateError) throw roleUpdateError;
      } else {
        // Insert new role
        const { error: roleInsertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role
          });
        
        if (roleInsertError) throw roleInsertError;
      }
    }
    
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
    
    // Garantir que o bucket avatars exista
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'avatars')) {
      await supabase.storage.createBucket('avatars', { public: true });
    }
    
    // Adicionar timestamp ao nome do arquivo para evitar caching e conflitos
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Remover avatares antigos do usuário
    const { data: oldFiles } = await supabase.storage
      .from('avatars')
      .list(userId);
    
    if (oldFiles && oldFiles.length > 0) {
      const filesToRemove = oldFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage
        .from('avatars')
        .remove(filesToRemove);
    }
    
    // Fazer upload do novo avatar
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: 'no-cache', // Evitar cache
        upsert: true
      });
    
    if (error) throw error;
    
    // Obter URL público
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Falha ao obter URL público");
    }
    
    // Adicionar parâmetro de cache busting à URL
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
    
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
      role: 'tecnico' as UserRole
    })) || [];
    
    console.log("Perfis de técnicos processados:", technicians.length);
    return technicians;
  } catch (error) {
    console.error("Erro ao buscar técnicos:", error);
    toast.error("Erro ao carregar lista de técnicos");
    return [];
  }
}
