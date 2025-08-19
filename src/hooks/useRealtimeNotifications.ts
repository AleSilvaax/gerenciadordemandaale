import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/context/AuthContext';

export const useRealtimeNotifications = () => {
  const { addNotification, setConnectionStatus } = useUIStore();
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.organizationId) {
      setConnectionStatus(false);
      return;
    }

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`realtime-changes-${user.organizationId}`)
      // Novas demandas da organização
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'services',
        filter: `organization_id=eq.${user.organizationId}`
      }, (payload) => {
        const newService = payload.new as any;
        // Não notificar o próprio criador
        if (newService.created_by !== user.id) {
          addNotification({
            title: '🆕 Nova Demanda',
            message: `Nova demanda: "${newService.title}"`,
            type: newService.priority === 'alta' ? 'warning' : 'info',
            serviceId: newService.id,
            route: `/demanda/${newService.id}`,
          });
        }
      })
      // Mudança de status nas demandas da organização
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'services',
        filter: `organization_id=eq.${user.organizationId}`
      }, (payload) => {
        const before = payload.old as any;
        const after = payload.new as any;
        if (before.status !== after.status) {
          const statusMap: Record<string, { title: string; type: 'success'|'info'|'warning'|'error' }> = {
            'concluido': { title: '✅ Demanda Concluída', type: 'success' },
            'em_andamento': { title: '🚧 Demanda em Andamento', type: 'info' },
            'cancelado': { title: '❌ Demanda Cancelada', type: 'warning' },
            'agendado': { title: '📅 Demanda Agendada', type: 'info' },
            'pendente': { title: '⏳ Demanda Pendente', type: 'info' },
          };
          const meta = statusMap[after.status] || { title: 'Atualização de Demanda', type: 'info' } as any;
          addNotification({
            title: meta.title,
            message: `"${after.title}" agora está: ${after.status.replace('_', ' ')}`,
            type: meta.type,
            serviceId: after.id,
            route: `/demanda/${after.id}`,
          });
        }
      })
      // Novas mensagens nas demandas
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_messages' }, (payload) => {
        const msg = payload.new as any;
        // Verificar se a mensagem não é do próprio usuário
        if (msg.sender_id !== user.id) {
          addNotification({
            title: '💬 Nova mensagem',
            message: `Nova mensagem de ${msg.sender_name}`,
            type: 'info',
            serviceId: msg.service_id,
            route: `/demanda/${msg.service_id}`,
          });
        }
      })
      // Novas fotos anexadas
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_photos' }, (payload) => {
        const photo = payload.new as any;
        addNotification({
          title: '📸 Nova foto anexada',
          message: 'Uma nova foto foi adicionada à demanda',
          type: 'info',
          serviceId: photo.service_id,
          route: `/demanda/${photo.service_id}`,
        });
      })
      // Notificações diretas da tabela notifications
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const notification = payload.new as any;
        addNotification({
          title: '🔔 Nova Notificação',
          message: notification.message,
          type: 'info',
          serviceId: notification.service_id,
          route: notification.service_id ? `/demanda/${notification.service_id}` : undefined,
        });
      })
      // Movimentações de estoque (apenas para gestores)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'inventory_movements',
        filter: `organization_id=eq.${user.organizationId}`
      }, (payload) => {
        const movement = payload.new as any;
        if (['administrador', 'gestor', 'owner'].includes(user.role)) {
          const typeMap: Record<string, string> = {
            'entrada': '📦 Entrada de estoque',
            'saida': '📤 Saída de estoque',
            'ajuste': '🔧 Ajuste de estoque'
          };
          addNotification({
            title: typeMap[movement.movement_type] || '📊 Movimentação de estoque',
            message: `${movement.movement_type}: ${movement.quantity} unidades`,
            type: 'info',
            route: '/estoque',
          });
        }
      })
      .subscribe((status) => {
        console.log('Realtime connection status:', status);
        setConnectionStatus(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [addNotification, setConnectionStatus, user?.organizationId, user?.id, user?.role]);

  const { isConnected } = useUIStore();
  return { isConnected };
};