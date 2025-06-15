
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Service } from '@/types/serviceTypes';

export const useRealtimeNotifications = () => {
  const [isConnected, setIsConnected] = useState(false);

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
          toast.success(`Nova demanda criada: ${newService.title}`, {
            description: `Cliente: ${newService.client || 'N/A'}`
          });
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
            toast.info(`Status atualizado: ${updatedService.title}`, {
              description: `${oldService.status} → ${updatedService.status}`
            });
          }
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
          toast.info(`Nova mensagem de ${newMessage.sender_name}`, {
            description: newMessage.message.substring(0, 50) + '...'
          });
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Status da conexão:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          toast.success('Notificações em tempo real ativadas');
        } else if (status === 'CHANNEL_ERROR') {
          toast.error('Erro na conexão em tempo real');
        }
      });

    return () => {
      console.log('[REALTIME] Desconectando...');
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, []);

  return { isConnected };
};
