
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUIStore } from '@/store/uiStore';
import { useOptimizedAuth } from '@/context/OptimizedAuthContext';

interface DatabaseNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user_id: string;
  read: boolean;
  created_at: string;
}

export const useRealtimeNotifications = () => {
  const { addNotification, setConnectionStatus } = useUIStore();
  const { user } = useOptimizedAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('[RealtimeNotifications] Usuário não autenticado, cancelando subscriptions');
      return;
    }

    console.log('[RealtimeNotifications] Inicializando para usuário:', user.id);

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to user-specific notifications
    const userChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[RealtimeNotifications] Nova notificação recebida:', payload);
          const notification = payload.new as DatabaseNotification;
          
          if (notification && !notification.read) {
            addNotification({
              title: notification.title,
              message: notification.message,
              type: notification.type,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'services',
          filter: user.organizationId ? `organization_id=eq.${user.organizationId}` : '',
        },
        (payload) => {
          console.log('[RealtimeNotifications] Serviço atualizado:', payload);
          
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Notify about status changes
          if (oldRecord?.status !== newRecord?.status) {
            addNotification({
              title: 'Status de Serviço Atualizado',
              message: `Serviço #${newRecord.id} mudou para: ${newRecord.status}`,
              type: 'info',
            });
          }
          
          // Notify about assignment changes
          if (oldRecord?.assigned_to !== newRecord?.assigned_to && newRecord?.assigned_to === user.id) {
            addNotification({
              title: 'Novo Serviço Atribuído',
              message: `Você foi designado para o serviço #${newRecord.id}`,
              type: 'success',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeNotifications] Status da conexão:', status);
        setConnectionStatus(status === 'SUBSCRIBED');
      });

    channelRef.current = userChannel;

    return () => {
      console.log('[RealtimeNotifications] Limpando subscriptions');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, user?.organizationId, addNotification, setConnectionStatus]);

  // Subscribe to team notifications if user is part of a team
  useEffect(() => {
    if (!user?.teamId) return;

    console.log('[RealtimeNotifications] Inicializando notificações da equipe:', user.teamId);

    const teamChannel = supabase
      .channel(`team:${user.teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'services',
          filter: `team_id=eq.${user.teamId}`,
        },
        (payload) => {
          console.log('[RealtimeNotifications] Novo serviço da equipe:', payload);
          const service = payload.new as any;
          
          addNotification({
            title: 'Novo Serviço na Equipe',
            message: `Um novo serviço foi criado para sua equipe: ${service.title || `#${service.id}`}`,
            type: 'info',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${user.teamId}`,
        },
        (payload) => {
          console.log('[RealtimeNotifications] Novo membro da equipe:', payload);
          
          addNotification({
            title: 'Novo Membro na Equipe',
            message: 'Um novo membro foi adicionado à sua equipe',
            type: 'success',
          });
        }
      )
      .subscribe();

    return () => {
      console.log('[RealtimeNotifications] Limpando subscriptions da equipe');
      supabase.removeChannel(teamChannel);
    };
  }, [user?.teamId, addNotification]);

  // Subscribe to organization-wide notifications for managers/admins
  useEffect(() => {
    if (!user?.organizationId || !['gestor', 'administrador'].includes(user.role)) return;

    console.log('[RealtimeNotifications] Inicializando notificações da organização:', user.organizationId);

    const orgChannel = supabase
      .channel(`organization:${user.organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'services',
          filter: `organization_id=eq.${user.organizationId}`,
        },
        (payload) => {
          console.log('[RealtimeNotifications] Novo serviço na organização:', payload);
          const service = payload.new as any;
          
          // Only notify if it's a high priority service
          if (service.priority === 'urgent' || service.priority === 'high') {
            addNotification({
              title: `Serviço ${service.priority === 'urgent' ? 'Urgente' : 'Alta Prioridade'}`,
              message: `Novo serviço: ${service.title || `#${service.id}`}`,
              type: service.priority === 'urgent' ? 'error' : 'warning',
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[RealtimeNotifications] Limpando subscriptions da organização');
      supabase.removeChannel(orgChannel);
    };
  }, [user?.organizationId, user?.role, addNotification]);

  return { isConnected: true };
};
