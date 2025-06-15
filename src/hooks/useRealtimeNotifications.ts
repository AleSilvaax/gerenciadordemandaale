
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/serviceTypes';
import { useUIStore } from '@/store/uiStore';
import { useServiceStore } from '@/store/serviceStore';

export const useRealtimeNotifications = () => {
  const { setConnectionStatus, addNotification } = useUIStore();
  const { updateService, loadServices } = useServiceStore();

  useEffect(() => {
    console.log('[REALTIME] Iniciando escuta de notificações...');
    
    const channel = supabase
      .channel('service-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('[REALTIME] Nova demanda criada:', payload);
          const newService = payload.new as Service;
          addNotification({
            title: 'Nova demanda criada',
            message: `${newService.title} - Cliente: ${newService.client || 'N/A'}`,
            type: 'success'
          });
          loadServices(); // Recarregar lista
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('[REALTIME] Demanda atualizada:', payload);
          const updatedService = payload.new as Service;
          const oldService = payload.old as Service;
          
          if (oldService.status !== updatedService.status) {
            addNotification({
              title: 'Status atualizado',
              message: `${updatedService.title}: ${oldService.status} → ${updatedService.status}`,
              type: 'info'
            });
          }
          
          updateService(updatedService);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_messages'
        },
        (payload) => {
          console.log('[REALTIME] Nova mensagem:', payload);
          const newMessage = payload.new;
          addNotification({
            title: `Nova mensagem de ${newMessage.sender_name}`,
            message: newMessage.message.substring(0, 50) + '...',
            type: 'info'
          });
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Status da conexão:', status);
        const isConnected = status === 'SUBSCRIBED';
        setConnectionStatus(isConnected);
        
        if (isConnected) {
          addNotification({
            title: 'Conectado',
            message: 'Notificações em tempo real ativadas',
            type: 'success'
          });
        } else if (status === 'CHANNEL_ERROR') {
          addNotification({
            title: 'Erro de conexão',
            message: 'Falha na conexão em tempo real',
            type: 'error'
          });
        }
      });

    return () => {
      console.log('[REALTIME] Desconectando...');
      supabase.removeChannel(channel);
      setConnectionStatus(false);
    };
  }, [setConnectionStatus, addNotification, updateService, loadServices]);

  const { isConnected } = useUIStore();
  return { isConnected };
};
