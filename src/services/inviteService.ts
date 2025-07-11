
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateInviteData {
  email: string;
  role: 'tecnico' | 'gestor' | 'administrador';
  team_id?: string;
}

export interface InviteListItem {
  id: string;
  email: string;
  role: string;
  team_id: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  teams?: {
    name: string;
  };
}

export const inviteService = {
  async createInvite(inviteData: CreateInviteData): Promise<boolean> {
    try {
      console.log('[INVITE] Criando convite:', inviteData);
      
      const { error } = await supabase
        .from('user_invites')
        .insert({
          email: inviteData.email,
          role: inviteData.role,
          team_id: inviteData.team_id || null
        });

      if (error) {
        console.error('[INVITE] Erro ao criar convite:', error);
        toast.error('Erro ao enviar convite', { 
          description: error.message 
        });
        return false;
      }

      toast.success('Convite enviado!', {
        description: `Convite enviado para ${inviteData.email}`
      });
      
      return true;
    } catch (error) {
      console.error('[INVITE] Erro inesperado:', error);
      toast.error('Erro inesperado ao enviar convite');
      return false;
    }
  },

  async getInvites(): Promise<InviteListItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_invites')
        .select(`
          id,
          email,
          role,
          team_id,
          expires_at,
          used_at,
          created_at,
          teams:team_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[INVITE] Erro ao buscar convites:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[INVITE] Erro ao buscar convites:', error);
      toast.error('Erro ao carregar convites');
      return [];
    }
  },

  async resendInvite(inviteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_invites')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: `${Math.random().toString(36).substring(2)}${Date.now()}`
        })
        .eq('id', inviteId);

      if (error) {
        console.error('[INVITE] Erro ao reenviar convite:', error);
        toast.error('Erro ao reenviar convite');
        return false;
      }

      toast.success('Convite reenviado com sucesso!');
      return true;
    } catch (error) {
      console.error('[INVITE] Erro inesperado:', error);
      toast.error('Erro inesperado');
      return false;
    }
  },

  async deleteInvite(inviteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_invites')
        .delete()
        .eq('id', inviteId);

      if (error) {
        console.error('[INVITE] Erro ao deletar convite:', error);
        toast.error('Erro ao deletar convite');
        return false;
      }

      toast.success('Convite removido com sucesso!');
      return true;
    } catch (error) {
      console.error('[INVITE] Erro inesperado:', error);
      toast.error('Erro inesperado');
      return false;
    }
  }
};
