import { useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { Service, TeamMember } from '@/types/serviceTypes';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, parseISO } from 'date-fns';

interface NotificationOptions {
  serviceId?: string;
  autoShowToast?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'service' | 'system' | 'deadline' | 'assignment';
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

export const useIntelligentNotifications = () => {
  const { addNotification } = useUIStore();

  // Notification creators with enhanced intelligence
  const notifyServiceAssigned = useCallback(async (
    service: Service, 
    technicians: TeamMember[],
    options: NotificationOptions = {}
  ) => {
    const technicanNames = technicians.map(t => t.name).join(', ');
    const isMultiple = technicians.length > 1;
    
    addNotification({
      title: isMultiple ? '👥 Múltiplos Técnicos Atribuídos' : '🔧 Técnico Atribuído',
      message: isMultiple 
        ? `${technicians.length} técnicos foram atribuídos à demanda: "${service.title}"`
        : `${technicanNames} foi atribuído à demanda: "${service.title}"`,
      type: service.priority === 'alta' || service.priority === 'urgente' ? 'warning' : 'info',
      serviceId: service.id,
      ...options,
      category: options.category || 'assignment',
      priority: options.priority || (service.priority === 'urgente' ? 'critical' : 'medium')
    });

    if (options.autoShowToast !== false) {
      toast({
        title: isMultiple ? 'Técnicos Atribuídos' : 'Técnico Atribuído',
        description: `Demanda "${service.title}" foi atribuída`,
        duration: 4000,
      });
    }
  }, [addNotification]);

  const notifyServiceCompleted = useCallback(async (
    service: Service,
    options: NotificationOptions = {}
  ) => {
    addNotification({
      title: '✅ Demanda Concluída',
      message: `A demanda "${service.title}" foi finalizada com sucesso!`,
      type: 'success',
      serviceId: service.id,
      ...options,
      category: options.category || 'service',
      priority: options.priority || 'medium'
    });

    if (options.autoShowToast !== false) {
      toast({
        title: 'Demanda Concluída',
        description: `"${service.title}" foi finalizada`,
        duration: 5000,
      });
    }
  }, [addNotification]);

  const notifyServiceOverdue = useCallback(async (
    service: Service,
    options: NotificationOptions = {}
  ) => {
    const daysOverdue = service.dueDate ? Math.abs(differenceInDays(new Date(), parseISO(service.dueDate))) : 0;
    
    addNotification({
      title: '⚠️ Demanda em Atraso',
      message: `A demanda "${service.title}" está ${daysOverdue} dias em atraso`,
      type: 'warning',
      serviceId: service.id,
      ...options,
      category: options.category || 'deadline',
      priority: options.priority || 'high',
      actions: [
        {
          label: 'Ver Demanda',
          action: () => window.location.href = `/demanda/${service.id}`,
          variant: 'default'
        },
        {
          label: 'Adiar Prazo',
          action: () => console.log('Adiar prazo', service.id),
          variant: 'outline'
        }
      ]
    });
    
    if (options.autoShowToast !== false) {
      toast({
        title: '⏰ Atenção - Prazo Vencido',
        description: `Demanda "${service.title}" está ${daysOverdue} dias em atraso`,
        variant: 'destructive',
        duration: 8000,
      });
    }
  }, [addNotification]);

  const notifyDeadlineApproaching = useCallback(async (
    service: Service,
    daysUntilDeadline: number,
    options: NotificationOptions = {}
  ) => {
    const urgencyLevel = daysUntilDeadline <= 1 ? 'crítico' : 
                        daysUntilDeadline <= 3 ? 'urgente' : 'próximo';
    
    addNotification({
      title: '📅 Prazo Próximo',
      message: `A demanda "${service.title}" vence em ${daysUntilDeadline} dias (${urgencyLevel})`,
      type: daysUntilDeadline <= 1 ? 'error' : 'warning',
      serviceId: service.id,
      ...options,
      category: options.category || 'deadline',
      priority: options.priority || (daysUntilDeadline <= 1 ? 'critical' : 'high')
    });

    if (options.autoShowToast !== false && daysUntilDeadline <= 1) {
      toast({
        title: '🚨 Prazo Crítico',
        description: `"${service.title}" vence hoje!`,
        variant: 'destructive',
        duration: 10000,
      });
    }
  }, [addNotification]);

  const notifyServiceCreated = useCallback(async (
    service: Service,
    options: NotificationOptions = {}
  ) => {
    addNotification({
      title: '🆕 Nova Demanda Criada',
      message: `Nova demanda "${service.title}" foi criada`,
      type: service.priority === 'urgente' ? 'warning' : 'info',
      serviceId: service.id,
      ...options,
      category: options.category || 'service',
      priority: options.priority || (service.priority === 'urgente' ? 'high' : 'medium')
    });
  }, [addNotification]);

  const notifyServiceStatusChanged = useCallback(async (
    service: Service,
    oldStatus: string,
    newStatus: string,
    options: NotificationOptions = {}
  ) => {
    const statusMessages = {
      'pendente': 'está pendente',
      'em_andamento': 'está em andamento',
      'concluido': 'foi concluída',
      'cancelado': 'foi cancelada',
      'agendado': 'foi agendada'
    };

    const getStatusEmoji = (status: string) => {
      switch (status) {
        case 'concluido': return '✅';
        case 'cancelado': return '❌';
        case 'em_andamento': return '🔄';
        case 'agendado': return '📅';
        default: return '📋';
      }
    };

    addNotification({
      title: `${getStatusEmoji(newStatus)} Status Atualizado`,
      message: `A demanda "${service.title}" ${statusMessages[newStatus as keyof typeof statusMessages] || 'teve o status atualizado'}`,
      type: newStatus === 'concluido' ? 'success' : 
            newStatus === 'cancelado' ? 'error' : 'info',
      serviceId: service.id,
      ...options,
      category: options.category || 'service',
      priority: options.priority || 'medium'
    });
  }, [addNotification]);

  const notifyCommentAdded = useCallback(async (
    service: Service,
    commenterName: string,
    options: NotificationOptions = {}
  ) => {
    addNotification({
      title: '💬 Novo Comentário',
      message: `${commenterName} comentou na demanda "${service.title}"`,
      type: 'info',
      serviceId: service.id,
      ...options,
      category: options.category || 'service',
      priority: options.priority || 'low'
    });
  }, [addNotification]);

  // Auto-monitoring system for deadlines
  const monitorDeadlines = useCallback(async (services: Service[]) => {
    const today = new Date();
    
    services.forEach(service => {
      if (!service.dueDate || service.status === 'concluido' || service.status === 'cancelado') {
        return;
      }

      const dueDate = parseISO(service.dueDate);
      const daysUntilDeadline = differenceInDays(dueDate, today);

      // Overdue
      if (daysUntilDeadline < 0) {
        notifyServiceOverdue(service, { autoShowToast: false });
      }
      // Due today or tomorrow
      else if (daysUntilDeadline <= 1) {
        notifyDeadlineApproaching(service, daysUntilDeadline, { autoShowToast: daysUntilDeadline === 0 });
      }
      // Due in 3 days
      else if (daysUntilDeadline === 3) {
        notifyDeadlineApproaching(service, daysUntilDeadline, { autoShowToast: false });
      }
    });
  }, [notifyServiceOverdue, notifyDeadlineApproaching]);

  return {
    notifyServiceAssigned,
    notifyServiceCompleted,
    notifyServiceOverdue,
    notifyDeadlineApproaching,
    notifyServiceCreated,
    notifyServiceStatusChanged,
    notifyCommentAdded,
    monitorDeadlines
  };
};