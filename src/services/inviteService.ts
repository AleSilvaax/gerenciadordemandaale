import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { UserRole } from '@/types/auth';

export interface UserInvite {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string;
  team_id?: string;
  invited_by: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at?: string;
}

export interface InviteFormData {
  email: string;
  role: UserRole;
  teamId?: string;
  organizationId?: string;
}

// Buscar convites da organização
export const getOrganizationInvites = async (): Promise<UserInvite[]> => {
  try {
    const { data, error } = await supabase
      .from('user_invites')
      .select(`
        *,
        profiles!user_invites_invited_by_fkey(name),
        teams(name),
        organizations(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserInvite[];
  } catch (error) {
    console.error('Erro ao buscar convites:', error);
    throw error;
  }
};

// Criar novo convite
export const createInvite = async (inviteData: InviteFormData): Promise<boolean> => {
  try {
    // Obter organização atual se não fornecida
    let organizationId = inviteData.organizationId;
    if (!organizationId) {
      const { data, error } = await supabase.rpc('get_current_user_organization_id');
      if (error) throw error;
      organizationId = data;
    }

    // Verificar se já existe convite ativo para este email
    const { data: existingInvite } = await supabase
      .from('user_invites')
      .select('id')
      .eq('email', inviteData.email)
      .eq('organization_id', organizationId)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      toast.error('Já existe um convite ativo para este email');
      return false;
    }

    // Criar o convite
    const { error } = await supabase
      .from('user_invites')
      .insert({
        email: inviteData.email,
        role: inviteData.role,
        organization_id: organizationId,
        team_id: inviteData.teamId || null,
        invited_by: (await supabase.auth.getUser()).data.user?.id || ''
      });

    if (error) throw error;

    toast.success(`Convite enviado para ${inviteData.email}`);
    return true;
  } catch (error) {
    console.error('Erro ao criar convite:', error);
    toast.error('Erro ao enviar convite');
    return false;
  }
};

// Reenviar convite
export const resendInvite = async (inviteId: string): Promise<boolean> => {
  try {
    // Atualizar data de expiração
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 7);

    const { error } = await supabase
      .from('user_invites')
      .update({
        expires_at: newExpiryDate.toISOString(),
        created_at: new Date().toISOString()
      })
      .eq('id', inviteId);

    if (error) throw error;

    toast.success('Convite reenviado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao reenviar convite:', error);
    toast.error('Erro ao reenviar convite');
    return false;
  }
};

// Cancelar convite
export const cancelInvite = async (inviteId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_invites')
      .delete()
      .eq('id', inviteId);

    if (error) throw error;

    toast.success('Convite cancelado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao cancelar convite:', error);
    toast.error('Erro ao cancelar convite');
    return false;
  }
};

// Aceitar convite (usado durante o processo de registro)
export const acceptInvite = async (token: string, userId: string): Promise<boolean> => {
  try {
    // Buscar o convite
    const { data: invite, error: fetchError } = await supabase
      .from('user_invites')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !invite) {
      toast.error('Convite inválido ou expirado');
      return false;
    }

    // Marcar convite como usado
    const { error: updateError } = await supabase
      .from('user_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (updateError) throw updateError;

    // Atualizar perfil do usuário com organização e equipe
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: invite.organization_id,
        team_id: invite.team_id
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // Criar role organizacional se necessário
    if (invite.role !== 'tecnico') {
      const { error: roleError } = await supabase
        .from('organization_roles')
        .upsert({
          user_id: userId,
          organization_id: invite.organization_id,
          role: invite.role,
          assigned_by: invite.invited_by
        });

      if (roleError) throw roleError;
    }

    toast.success('Convite aceito com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    toast.error('Erro ao aceitar convite');
    return false;
  }
};

// Verificar se email pode ser convidado
export const canInviteEmail = async (email: string): Promise<boolean> => {
  try {
    // Para verificação simples, apenas checamos convites pendentes
    // Em produção, você implementaria verificação de usuários existentes

    // Verificar se já tem convite pendente
    const { data: existingInvite } = await supabase
      .from('user_invites')
      .select('id')
      .eq('email', email)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      toast.error('Já existe um convite pendente para este email');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return false;
  }
};

// Buscar convites expirados para limpeza
export const getExpiredInvites = async (): Promise<UserInvite[]> => {
  try {
    const { data, error } = await supabase
      .from('user_invites')
      .select('*')
      .is('used_at', null)
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar convites expirados:', error);
    return [];
  }
};

// Limpar convites expirados
export const cleanupExpiredInvites = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_invites')
      .delete()
      .is('used_at', null)
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    console.log('Convites expirados removidos com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao limpar convites expirados:', error);
    return false;
  }
};