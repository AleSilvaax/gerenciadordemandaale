
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Bell, MessageSquare, Calendar, AlertCircle } from 'lucide-react';

interface NotificationData {
  id: string;
  type: 'service_update' | 'new_message' | 'schedule_reminder' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  created_at: string;
}

export const RealtimeNotifications: React.FC = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    console.log('[NOTIFICATIONS] Conectando ao sistema de notificações...');

    // Subscribe to service updates
    const serviceChannel = supabase
      .channel('service-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('[NOTIFICATIONS] Service updated:', payload);
          
          // Only notify if user is involved in the service
          if (payload.new.created_by === user.id || 
              (user.role === 'tecnico' && payload.new.id)) {
            toast.info('Demanda atualizada', {
              description: `Status alterado para: ${payload.new.status}`,
              icon: <AlertCircle className="h-4 w-4" />
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
          console.log('[NOTIFICATIONS] New message:', payload);
          
          // Don't notify if the user is the sender
          if (payload.new.sender_id !== user.id) {
            toast.info('Nova mensagem', {
              description: `${payload.new.sender_name}: ${payload.new.message.substring(0, 50)}...`,
              icon: <MessageSquare className="h-4 w-4" />
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[NOTIFICATIONS] Channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to schedule updates for technicians
    let scheduleChannel: any = null;
    if (user.role === 'tecnico') {
      scheduleChannel = supabase
        .channel('schedule-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'technician_schedule',
            filter: `technician_id=eq.${user.id}`
          },
          (payload) => {
            console.log('[NOTIFICATIONS] New schedule:', payload);
            toast.info('Novo agendamento', {
              description: `${payload.new.title} agendado`,
              icon: <Calendar className="h-4 w-4" />
            });
          }
        )
        .subscribe();
    }

    return () => {
      console.log('[NOTIFICATIONS] Desconectando...');
      serviceChannel.unsubscribe();
      if (scheduleChannel) {
        scheduleChannel.unsubscribe();
      }
    };
  }, [user]);

  // Visual indicator of connection status (optional)
  if (user && isConnected) {
    console.log('[NOTIFICATIONS] Sistema conectado e funcionando');
  }

  return null; // This component doesn't render anything visible
};
