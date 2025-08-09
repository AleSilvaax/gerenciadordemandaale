import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUIStore } from '@/store/uiStore';

let channelInstance: any = null;
let subscribers = 0;

export const useRealtimeNotifications = () => {
  const { addNotification, setConnectionStatus } = useUIStore();

  useEffect(() => {
    const channel = supabase
      .channel('realtime-changes')
      // Novas demandas
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'services' }, (payload) => {
        const newService = payload.new as any;
        addNotification({
          title: '🆕 Nova Demanda',
          message: `Nova demanda: "${newService.title}"`,
          type: newService.priority === 'alta' ? 'warning' : 'info',
          serviceId: newService.id,
          route: `/demanda/${newService.id}`,
        });
      })
      // Mudança de status
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'services' }, (payload) => {
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
        addNotification({
          title: '💬 Nova mensagem',
          message: 'Você recebeu uma nova mensagem em uma demanda',
          type: 'info',
          serviceId: msg.service_id,
          route: `/demanda/${msg.service_id}`,
        });
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
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification, setConnectionStatus]);

  const { isConnected } = useUIStore();
  return { isConnected };
};