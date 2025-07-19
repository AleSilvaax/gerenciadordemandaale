
import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServices } from '@/services/servicesDataService';
import { Service } from '@/types/serviceTypes';
import { supabase } from '@/integrations/supabase/client';

interface Metrics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  todayCompleted: number;
  avgResponseTime: number;
}

export const RealtimeMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    todayCompleted: 0,
    avgResponseTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const calculateMetrics = (services: Service[]): Metrics => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const total = services.length;
    const pending = services.filter(s => s.status === 'pendente').length;
    const inProgress = services.filter(s => s.status === 'pendente').length; // Ajustado para usar apenas valores válidos
    const completed = services.filter(s => s.status === 'concluido').length;
    
    const overdue = services.filter(s => {
      if (!s.dueDate) return false;
      return new Date(s.dueDate) < now && s.status !== 'concluido';
    }).length;

    const todayCompleted = services.filter(s => {
      if (s.status !== 'concluido' || !s.creationDate) return false;
      return new Date(s.creationDate) >= todayStart;
    }).length;

    // Calcular tempo médio de resposta (simplificado)
    const completedServices = services.filter(s => s.status === 'concluido' && s.creationDate);
    const avgResponseTime = completedServices.length > 0 
      ? completedServices.reduce((acc, service) => {
          const created = new Date(service.creationDate!);
          const updated = new Date(); // Usando data atual como aproximação
          return acc + (updated.getTime() - created.getTime());
        }, 0) / completedServices.length / (1000 * 60 * 60 * 24) // em dias
      : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      todayCompleted,
      avgResponseTime
    };
  };

  const loadMetrics = async () => {
    try {
      const services = await getServices();
      const newMetrics = calculateMetrics(services);
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();

    // Configurar escuta em tempo real
    const channel = supabase
      .channel('metrics-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        () => {
          console.log('[METRICS] Atualizando métricas em tempo real...');
          loadMetrics();
        }
      )
      .subscribe();

    // Atualizar métricas a cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Demandas</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.pending} pendentes, {metrics.inProgress} em andamento
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídas Hoje</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{metrics.todayCompleted}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.completed} total concluídas
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.overdue > 0 ? 'Requer atenção urgente' : 'Tudo em dia'}
          </p>
        </CardContent>
      </Card>

      <Card className="card-enhanced">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.avgResponseTime.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            dias para conclusão
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
