import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRole {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
}

// Buscar todas as organizações (só super_admin)
export const getAllOrganizations = async (): Promise<Organization[]> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar organizações:', error);
    throw error;
  }
};

// Buscar organização do usuário atual
export const getCurrentUserOrganization = async (): Promise<Organization | null> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', await getCurrentUserOrganizationId())
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar organização atual:', error);
    return null;
  }
};

// Função auxiliar para obter o ID da organização do usuário atual
const getCurrentUserOrganizationId = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('get_current_user_organization_id');
  if (error) throw error;
  return data;
};

// Criar nova organização (só super_admin)
export const createOrganization = async (orgData: { name: string; slug?: string }): Promise<Organization> => {
  try {
    const slug = orgData.slug || orgData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: orgData.name,
        slug,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    toast.success(`Organização "${orgData.name}" criada com sucesso!`);
    return data;
  } catch (error) {
    console.error('Erro ao criar organização:', error);
    toast.error('Erro ao criar organização');
    throw error;
  }
};

// Atualizar organização
export const updateOrganization = async (id: string, updates: Partial<Organization>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    toast.success('Organização atualizada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao atualizar organização:', error);
    toast.error('Erro ao atualizar organização');
    return false;
  }
};

// Desativar organização (não deletar para manter integridade)
export const deactivateOrganization = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    toast.success('Organização desativada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao desativar organização:', error);
    toast.error('Erro ao desativar organização');
    return false;
  }
};

// Buscar roles organizacionais
export const getOrganizationRoles = async (organizationId: string): Promise<OrganizationRole[]> => {
  try {
    const { data, error } = await supabase
      .from('organization_roles')
      .select(`
        *,
        profiles!organization_roles_user_id_fkey(name, avatar)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar roles organizacionais:', error);
    throw error;
  }
};

// Atribuir role organizacional
export const assignOrganizationRole = async (
  userId: string, 
  organizationId: string, 
  role: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organization_roles')
      .upsert({
        user_id: userId,
        organization_id: organizationId,
        role,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,organization_id'
      });

    if (error) throw error;

    toast.success('Role organizacional atribuído com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao atribuir role organizacional:', error);
    toast.error('Erro ao atribuir role organizacional');
    return false;
  }
};

// Remover role organizacional
export const removeOrganizationRole = async (userId: string, organizationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organization_roles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    toast.success('Role organizacional removido com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao remover role organizacional:', error);
    toast.error('Erro ao remover role organizacional');
    return false;
  }
};

// Verificar se usuário é super admin
export const isSuperAdmin = async (userId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_super_admin', {
      check_user_id: userId || null
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao verificar super admin:', error);
    return false;
  }
};

// Verificar se usuário é owner de uma organização
export const isOrganizationOwner = async (userId: string, organizationId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_organization_owner', {
      check_user_id: userId,
      org_id: organizationId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao verificar owner da organização:', error);
    return false;
  }
};

// Obter role efetivo do usuário considerando hierarquia
export const getEffectiveUserRole = async (organizationId?: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('get_effective_user_role', {
      check_org_id: organizationId || null
    });

    if (error) throw error;
    return data || 'tecnico';
  } catch (error) {
    console.error('Erro ao obter role efetivo:', error);
    return 'tecnico';
  }
};