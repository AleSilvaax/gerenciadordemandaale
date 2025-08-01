import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from './useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Service, UserRole } from '@/types/serviceTypes';

interface NotificationRule {
  id: string;
  name: string;
  condition: (context: NotificationContext) => boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target: (context: NotificationContext) => string[];
  message: (context: NotificationContext) => { title: string; message: string };
}

interface NotificationContext {
  service?: Service;
  user?: any;
  userRole?: UserRole;
  organizationId?: string;
  action?: string;
  timestamp: Date;
}

export const useIntelligentNotifications = () => {
  const { user } = useAuth();
  const { showSuccess, showWarning, showError, showInfo } = useNotifications();

  // Regras inteligentes de notificação
  const notificationRules: NotificationRule[] = [
    {
      id: 'high_priority_assignment',
      name: 'Atribuição de Alta Prioridade',
      condition: (ctx) => ctx.service?.priority === 'alta' && ctx.action === 'assigned',
      priority: 'urgent',
      target: (ctx) => ctx.service?.technicians?.map(t => t.id) || [],
      message: (ctx) => ({
        title: 'Demanda Urgente Atribuída!',
        message: `Nova demanda de alta prioridade: "${ctx.service?.title}" precisa de atenção imediata.`
      })
    },
    {
      id: 'overdue_service',
      name: 'Serviço em Atraso',
      condition: (ctx) => {
        if (!ctx.service?.dueDate) return false;
        const dueDate = new Date(ctx.service.dueDate);
        const now = new Date();
        return dueDate < now && ctx.service.status === 'pendente';
      },
      priority: 'high',
      target: (ctx) => [
        ...(ctx.service?.technicians?.map(t => t.id) || []),
        ctx.service?.createdBy || ''
      ].filter(Boolean),
      message: (ctx) => ({
        title: 'Serviço em Atraso',
        message: `A demanda "${ctx.service?.title}" passou do prazo e precisa de atenção.`
      })
    },
    {
      id: 'completion_notification',
      name: 'Conclusão de Serviço',
      condition: (ctx) => ctx.action === 'completed',
      priority: 'medium',
      target: (ctx) => [ctx.service?.createdBy || ''].filter(Boolean),
      message: (ctx) => ({
        title: 'Serviço Concluído',
        message: `A demanda "${ctx.service?.title}" foi marcada como concluída pelo técnico.`
      })
    },
    {
      id: 'feedback_request',
      name: 'Solicitação de Feedback',
      condition: (ctx) => ctx.action === 'completed' && !ctx.service?.feedback,
      priority: 'low',
      target: (ctx) => [ctx.service?.createdBy || ''].filter(Boolean),
      message: (ctx) => ({
        title: 'Avalie o Serviço',
        message: `Por favor, avalie o serviço "${ctx.service?.title}" que foi concluído.`
      })
    },
    {
      id: 'technician_overload',
      name: 'Sobrecarga de Técnico',
      condition: (ctx) => {
        // Esta lógica seria mais complexa, verificando a carga de trabalho atual
        return ctx.action === 'assigned' && ctx.userRole === 'gestor';
      },
      priority: 'medium',
      target: (ctx) => [user?.id || ''].filter(Boolean),
      message: (ctx) => ({
        title: 'Atenção: Possível Sobrecarga',
        message: `O técnico pode estar sobrecarregado com a nova atribuição de "${ctx.service?.title}".`
      })
    }
  ];

  const processNotification = async (context: NotificationContext) => {
    for (const rule of notificationRules) {
      if (rule.condition(context)) {
        const targets = rule.target(context);
        const { title, message } = rule.message(context);
        
        // Enviar notificação para cada target
        for (const targetId of targets) {
          if (targetId === user?.id) {
            // Mostrar notificação local para o usuário atual
            switch (rule.priority) {
              case 'urgent':
                showError(title, message);
                break;
              case 'high':
                showWarning(title, message);
                break;
              case 'medium':
                showInfo(title, message);
                break;
              case 'low':
                showSuccess(title, message);
                break;
            }
          } else {
            // Salvar notificação no banco para outros usuários
            try {
              await supabase.from('notifications').insert({
                user_id: targetId,
                message: `${title}: ${message}`,
                service_id: context.service?.id
              });
            } catch (error) {
              console.error('[Notifications] Erro ao salvar notificação:', error);
            }
          }
        }
      }
    }
  };

  const notifyServiceAssigned = (service: Service) => {
    processNotification({
      service,
      user,
      userRole: user?.role,
      organizationId: user?.organizationId,
      action: 'assigned',
      timestamp: new Date()
    });
  };

  const notifyServiceCompleted = (service: Service) => {
    processNotification({
      service,
      user,
      userRole: user?.role,
      organizationId: user?.organizationId,
      action: 'completed',
      timestamp: new Date()
    });
  };

  const notifyServiceOverdue = (service: Service) => {
    processNotification({
      service,
      user,
      userRole: user?.role,
      organizationId: user?.organizationId,
      action: 'overdue',
      timestamp: new Date()
    });
  };

  // Verificar serviços em atraso periodicamente
  useEffect(() => {
    if (!user) return;

    const checkOverdueServices = async () => {
      try {
        const { data: services } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'pendente')
          .not('due_date', 'is', null);

        if (services) {
          const now = new Date();
          services.forEach(service => {
            const dueDate = new Date(service.due_date);
            if (dueDate < now) {
              // Serviço em atraso - notificar apenas uma vez por dia
              const lastCheck = localStorage.getItem(`overdue_check_${service.id}`);
              const today = now.toDateString();
              
              if (lastCheck !== today) {
                notifyServiceOverdue(service as any);
                localStorage.setItem(`overdue_check_${service.id}`, today);
              }
            }
          });
        }
      } catch (error) {
        console.error('[Notifications] Erro ao verificar serviços em atraso:', error);
      }
    };

    // Verificar a cada hora
    const interval = setInterval(checkOverdueServices, 60 * 60 * 1000);
    checkOverdueServices(); // Verificar imediatamente

    return () => clearInterval(interval);
  }, [user]);

  return {
    notifyServiceAssigned,
    notifyServiceCompleted,
    notifyServiceOverdue,
    processNotification
  };
};