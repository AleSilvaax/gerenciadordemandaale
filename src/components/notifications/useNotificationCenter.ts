// Arquivo: src/hooks/useNotificationCenter.ts (CRIE ESTE NOVO ARQUIVO)

import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Define a estrutura de uma notificação que virá do banco de dados
export interface Notification {
  id: string;
  userId: string;
  serviceId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATIONS_QUERY_KEY = 'notification-center';

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[NotificationCenter] Erro ao buscar notificações:', error);
    throw error;
  }

  return data.map(n => ({
    id: n.id,
    userId: n.user_id,
    serviceId: n.service_id,
    message: n.message,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
};

export const useNotificationCenter = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const handleNewNotification = (payload: any) => {
      console.log('[Realtime] Nova notificação recebida:', payload.new);
      
      queryClient.setQueryData([NOTIFICATIONS_QUERY_KEY, user.id], (oldData: Notification[] = []) => {
        const newNotification: Notification = {
          id: payload.new.id,
          userId: payload.new.user_id,
          serviceId: payload.new.service_id,
          message: payload.new.message,
          isRead: payload.new.is_read,
          createdAt: payload.new.created_at,
        };
        return [newNotification, ...oldData.filter(n => n.id !== newNotification.id)];
      });
      
      toast.info("Você tem uma nova notificação!", {
          description: payload.new.message,
      });
    };

    const subscription = supabase
      .channel(`public:notifications:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        handleNewNotification
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, queryClient]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .in('id', notificationIds);

    if (error) {
      console.error('[NotificationCenter] Erro ao marcar como lida:', error);
    } else {
      queryClient.setQueryData([NOTIFICATIONS_QUERY_KEY, user.id], (oldData: Notification[] = []) => 
        oldData.map(n => 
            notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
    }
  }, [user, queryClient]);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
  };
};
