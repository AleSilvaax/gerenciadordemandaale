import { useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { Service } from '@/types/serviceTypes';
import { toast } from '@/hooks/use-toast';

export const useIntelligentNotifications = () => {
  const { addNotification } = useUIStore();

  const notifyServiceAssigned = useCallback(async (service: Service, technicianId: string) => {
    addNotification({
      title: '🔧 Técnico Atribuído',
      message: `Você foi atribuído à demanda: "${service.title}"`,
      type: 'info',
      serviceId: service.id,
      route: `/demanda/${service.id}`,
    });
  }, [addNotification]);

  const notifyServiceCompleted = useCallback(async (service: Service) => {
    addNotification({
      title: '✅ Demanda Concluída',
      message: `Demanda "${service.title}" foi finalizada!`,
      type: 'success',
      serviceId: service.id,
      route: `/demanda/${service.id}`,
    });
  }, [addNotification]);

  const notifyServiceOverdue = useCallback(async (service: Service) => {
    addNotification({
      title: '⏰ Demanda em Atraso',
      message: `Demanda "${service.title}" está atrasada`,
      type: 'warning',
      serviceId: service.id,
      route: `/demanda/${service.id}`,
    });
    
    toast({
      title: '⏰ Atenção',
      description: `Demanda em atraso: "${service.title}"`,
      variant: 'destructive',
      duration: 5000,
    });
  }, [addNotification]);

  return {
    notifyServiceAssigned,
    notifyServiceCompleted,
    notifyServiceOverdue
  };
};