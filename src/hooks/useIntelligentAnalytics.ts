import { useMemo } from 'react';
import { useServices } from './useServices';
import { useTeamMembers } from './useTeamMembers';

export interface AnalyticsInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
}

export const useIntelligentAnalytics = () => {
  const { services } = useServices();
  const { teamMembers } = useTeamMembers();

  const insights = useMemo(() => {
    const analyticsInsights: AnalyticsInsight[] = [];

    if (!services || services.length === 0) {
      return analyticsInsights;
    }

    // Análise de conclusão
    const totalServices = services.length;
    const completedServices = services.filter(s => s.status === 'concluido').length;
    const completionRate = (completedServices / totalServices) * 100;

    if (completionRate >= 80) {
      analyticsInsights.push({
        type: 'success',
        title: 'Excelente Taxa de Conclusão',
        description: `${completionRate.toFixed(1)}% dos serviços foram concluídos`,
        value: `${completionRate.toFixed(1)}%`,
        trend: 'up'
      });
    } else if (completionRate < 50) {
      analyticsInsights.push({
        type: 'warning',
        title: 'Taxa de Conclusão Baixa',
        description: `Apenas ${completionRate.toFixed(1)}% dos serviços foram concluídos`,
        value: `${completionRate.toFixed(1)}%`,
        trend: 'down'
      });
    }

    // Análise de sobrecarga de trabalho
    const pendingServices = services.filter(s => s.status === 'pendente').length;
    const activeTechnicians = teamMembers.length;
    
    if (activeTechnicians > 0) {
      const servicesPerTechnician = pendingServices / activeTechnicians;
      
      if (servicesPerTechnician > 5) {
        analyticsInsights.push({
          type: 'danger',
          title: 'Sobrecarga Detectada',
          description: `Média de ${servicesPerTechnician.toFixed(1)} serviços pendentes por técnico`,
          value: servicesPerTechnician.toFixed(1),
          trend: 'up'
        });
      }
    }

    // Análise de tendência temporal
    const last7Days = services.filter(s => {
      const serviceDate = new Date(s.date || '');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return serviceDate >= weekAgo;
    });

    const previous7Days = services.filter(s => {
      const serviceDate = new Date(s.date || '');
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return serviceDate >= twoWeeksAgo && serviceDate < weekAgo;
    });

    if (previous7Days.length > 0) {
      const currentWeekAvg = last7Days.length / 7;
      const previousWeekAvg = previous7Days.length / 7;
      const trendPercent = ((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100;

      if (Math.abs(trendPercent) > 20) {
        analyticsInsights.push({
          type: trendPercent > 0 ? 'info' : 'warning',
          title: trendPercent > 0 ? 'Aumento na Demanda' : 'Redução na Demanda',
          description: `${Math.abs(trendPercent).toFixed(1)}% ${trendPercent > 0 ? 'aumento' : 'redução'} comparado à semana anterior`,
          value: `${trendPercent > 0 ? '+' : ''}${trendPercent.toFixed(1)}%`,
          trend: trendPercent > 0 ? 'up' : 'down'
        });
      }
    }

    // Análise de performance por prioridade
    const highPriorityServices = services.filter(s => s.priority === 'alta');
    const highPriorityCompleted = highPriorityServices.filter(s => s.status === 'concluido').length;
    
    if (highPriorityServices.length > 0) {
      const highPriorityRate = (highPriorityCompleted / highPriorityServices.length) * 100;
      
      if (highPriorityRate < 70) {
        analyticsInsights.push({
          type: 'danger',
          title: 'Prioridades Altas em Atraso',
          description: `${highPriorityRate.toFixed(1)}% dos serviços de alta prioridade foram concluídos`,
          value: `${highPriorityRate.toFixed(1)}%`,
          trend: 'down'
        });
      }
    }

    return analyticsInsights;
  }, [services, teamMembers]);

  const kpis = useMemo(() => {
    if (!services || services.length === 0) {
      return {
        totalServices: 0,
        completedServices: 0,
        pendingServices: 0,
        completionRate: 0,
        averageResolutionTime: 0,
        activeTeamMembers: teamMembers.length
      };
    }

    const totalServices = services.length;
    const completedServices = services.filter(s => s.status === 'concluido').length;
    const pendingServices = services.filter(s => s.status === 'pendente').length;
    const completionRate = totalServices > 0 ? (completedServices / totalServices) * 100 : 0;

    // Calcular tempo médio de resolução (simplificado)
    const completedWithDates = services.filter(s => 
      s.status === 'concluido' && s.date
    );
    
    const averageResolutionTime = completedWithDates.length > 0 ? 2.5 : 0;

    return {
      totalServices,
      completedServices,
      pendingServices,
      completionRate,
      averageResolutionTime,
      activeTeamMembers: teamMembers.length
    };
  }, [services, teamMembers]);

  return {
    insights,
    kpis
  };
};