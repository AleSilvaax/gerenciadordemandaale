import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUIStore } from '@/store/uiStore';

export const useRealtimeNotifications = () => {
  const { addNotification, setConnectionStatus } = useUIStore();

  useEffect(() => {
    const channel = supabase
      .channel('realtime-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'services' }, (payload) => {
        const newService = payload.new;
        addNotification({
          title: '🆕 Nova Demanda',
          message: `Nova demanda: "${newService.title}"`,
          type: newService.priority === 'alta' ? 'warning' : 'info'
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'services' }, (payload) => {
        const service = payload.new;
        if (service.status === 'concluido') {
          addNotification({
            title: '✅ Demanda Concluída',
            message: `"${service.title}" foi finalizada`,
            type: 'success'
          });
        }
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