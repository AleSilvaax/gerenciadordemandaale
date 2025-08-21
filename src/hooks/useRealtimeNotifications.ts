
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUIStore } from '@/store/uiStore';
import { useOptimizedAuth } from '@/context/OptimizedAuthContext';

interface DatabaseNotification {
  id: string;
  user_id: string;
  message: string;
  service_id?: string;
  is_read: boolean;
  created_at: string;
}

export const useRealtimeNotifications = () => {
  const { addNotification, setConnectionStatus } = useUIStore();
  const { user } = useOptimizedAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) {
      setConnectionStatus(false);
      return;
    }

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Use a fallback organization ID if user doesn't have one
    const organizationId = user.organizationId || '00000000-0000-0000-0000-000000000001';

    // Enhanced real-time channel with comprehensive event listening
    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      
      // Direct notifications from database
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[REALTIME] Database notification:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          const notification = payload.new as DatabaseNotification;
          addNotification({
            title: '🔔 Notificação',
            message: notification.message,
            type: 'info',
            serviceId: notification.service_id,
            route: notification.service_id ? `/demanda/${notification.service_id}` : undefined,
          });
        }
      })

      // New service creation (organization level)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'services',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        console.log('[REALTIME] New service created:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // Don't notify service creator of their own service
          if (payload.new.created_by !== user.id) {
            addNotification({
              title: '🆕 Nova Demanda',
              message: `Nova demanda: "${payload.new.title}"`,
              type: payload.new.priority === 'alta' ? 'warning' : 'info',
              serviceId: payload.new.id,
              route: `/demanda/${payload.new.id}`,
            });
          }
        }
      })

      // Service status updates
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'services',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        console.log('[REALTIME] Service updated:', payload);
        
        if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
          // Only show if status changed
          if (payload.old.status !== payload.new.status) {
            const statusMap: Record<string, { title: string; type: 'success'|'info'|'warning'|'error' }> = {
              'concluido': { title: '✅ Demanda Concluída', type: 'success' },
              'em_andamento': { title: '🚧 Demanda em Andamento', type: 'info' },
              'cancelado': { title: '❌ Demanda Cancelada', type: 'warning' },
              'agendado': { title: '📅 Demanda Agendada', type: 'info' },
              'pendente': { title: '⏳ Demanda Pendente', type: 'info' },
            };
            
            const meta = statusMap[payload.new.status] || { title: 'Atualização de Demanda', type: 'info' } as any;
            
            addNotification({
              title: meta.title,
              message: `"${payload.new.title}" agora está: ${payload.new.status.replace('_', ' ')}`,
              type: meta.type,
              serviceId: payload.new.id,
              route: `/demanda/${payload.new.id}`,
            });
          }
        }
      })

      // New messages
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'service_messages'
      }, (payload) => {
        console.log('[REALTIME] New message:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // Don't notify the sender of their own message
          if (payload.new.sender_id !== user.id) {
            addNotification({
              title: '💬 Nova Mensagem',
              message: `${payload.new.sender_name} enviou uma mensagem`,
              type: 'info',
              serviceId: payload.new.service_id,
              route: `/demanda/${payload.new.service_id}`,
            });
          }
        }
      })

      // New photos
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'service_photos'
      }, (payload) => {
        console.log('[REALTIME] New photo attached:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          addNotification({
            title: '📷 Foto Anexada',
            message: `Nova foto foi anexada à demanda`,
            type: 'info',
            serviceId: payload.new.service_id,
            route: `/demanda/${payload.new.service_id}`,
          });
        }
      })

      // Inventory movements (managers only)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'inventory_movements',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        console.log('[REALTIME] Inventory movement:', payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // Only show for managers/admins
          if (user.role && ['administrador', 'gestor', 'owner', 'super_admin'].includes(user.role)) {
            const typeMap: Record<string, string> = {
              'entrada': '📦 Entrada de estoque',
              'saida': '📤 Saída de estoque',
              'ajuste': '🔧 Ajuste de estoque'
            };
            
            addNotification({
              title: typeMap[payload.new.movement_type] || '📊 Movimentação de estoque',
              message: `${payload.new.movement_type}: ${payload.new.quantity} unidades`,
              type: 'info',
              route: '/inventory',
            });
          }
        }
      })

      .subscribe((status) => {
        console.log('[REALTIME] Connection status:', status);
        setConnectionStatus(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setConnectionStatus(false);
      }
    };
  }, [addNotification, setConnectionStatus, user?.id, user?.organizationId, user?.role]);

  const { isConnected } = useUIStore();
  return { isConnected };
};
