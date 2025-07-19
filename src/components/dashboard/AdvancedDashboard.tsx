import React, { useState } from 'react';

import { useServices } from '@/hooks/useServices';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Download
} from 'lucide-react';

interface AdvancedDashboardProps {
  className?: string;
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ className }) => {
  const { services = [] } = useServices();
  const { teamMembers = [] } = useTeamMembers();
  
  const [timeRange, setTimeRange] = useState('30');
  const [selectedTechnician, setSelectedTechnician] = useState('todos');

  // Filtrar dados baseado no período selecionado
  const filteredServices = services.filter(service => {
    const serviceDate = new Date(service.date || Date.now());
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    return serviceDate >= cutoffDate;
  });

  // Filtrar por técnico se selecionado
  const finalServices = selectedTechnician === 'todos' 
    ? filteredServices 
    : filteredServices.filter(service => service.technician?.id === selectedTechnician);

  // Métricas gerais
  const metrics = {
    total: finalServices.length,
    completed: finalServices.filter(s => s.status === 'concluido').length,
    inProgress: finalServices.filter(s => s.status === 'em_andamento').length,
    pending: finalServices.filter(s => s.status === 'pendente').length,
    overdue: finalServices.filter(s => {
      if (!s.dueDate || s.status === 'concluido') return false;
      return new Date(s.dueDate) < new Date();
    }).length
  };

  // Taxa de conclusão
  const completionRate = metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0;

  // Tempo médio de conclusão
  const completedServices = finalServices.filter(s => s.status === 'concluido');
  const avgCompletionTime = completedServices.length > 0 
    ? completedServices.reduce((acc, service) => {
        const created = new Date(service.date || Date.now());
        const updated = new Date(service.date || Date.now());
        return acc + (updated.getTime() - created.getTime());
      }, 0) / completedServices.length / (1000 * 60 * 60 * 24) // em dias
    : 0;

  // Dados para gráficos
  
  // Serviços por status
  const statusData = [
    { name: 'Concluído', value: metrics.completed, color: '#10b981' },
    { name: 'Em Andamento', value: metrics.inProgress, color: '#3b82f6' },
    { name: 'Pendente', value: metrics.pending, color: '#f59e0b' },
    { name: 'Atrasado', value: metrics.overdue, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Serviços por tipo
  const serviceTypeData = finalServices.reduce((acc, service) => {
    const type = service.serviceType || 'Vistoria';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Serviços por prioridade
  const priorityData = finalServices.reduce((acc, service) => {
    const priority = service.priority || 'media';
    const existing = acc.find(item => item.name === priority);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: priority, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Performance por técnico
  const technicianPerformance = teamMembers
    .filter(member => member.role === 'tecnico')
    .map(technician => {
      const techServices = finalServices.filter(s => s.technician?.id === technician.id);
      const completed = techServices.filter(s => s.status === 'concluido').length;
      const total = techServices.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;
      
      return {
        name: technician.name,
        total,
        completed,
        rate: Math.round(rate),
        pending: techServices.filter(s => s.status === 'pendente').length,
        inProgress: techServices.filter(s => s.status === 'em_andamento').length
      };
    })
    .filter(tech => tech.total > 0)
    .sort((a, b) => b.rate - a.rate);

  // Tendência ao longo do tempo (últimos 30 dias)
  const trendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const dayServices = services.filter(service => 
      (service.date || '').startsWith(dateStr)
    );
    
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      criados: dayServices.length,
      concluidos: dayServices.filter(s => s.status === 'concluido').length
    };
  });

  const exportData = () => {
    const data = {
      periodo: `${timeRange} dias`,
      metricas: metrics,
      taxaConclusao: `${completionRate.toFixed(1)}%`,
      tempoMedioConclusao: `${avgCompletionTime.toFixed(1)} dias`,
      performanceTecnicos: technicianPerformance,
      geradoEm: new Date().toLocaleString('pt-BR')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className={className}>
      {/* Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Avançado</h2>
          <p className="text-muted-foreground">Análise detalhada de performance e métricas</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos técnicos</SelectItem>
              {teamMembers
                .filter(member => member.role === 'tecnico')
                .map(technician => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa Conclusão</p>
                <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{avgCompletionTime.toFixed(1)}d</p>
              </div>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Status das Demandas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicianPerformance.map((tech, index) => (
                  <div key={tech.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{tech.name}</span>
                      </div>
                      <Badge variant={tech.rate >= 80 ? 'default' : tech.rate >= 60 ? 'secondary' : 'destructive'}>
                        {tech.rate}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-medium">{tech.total}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Concluídas: </span>
                        <span className="font-medium text-green-600">{tech.completed}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Andamento: </span>
                        <span className="font-medium text-blue-600">{tech.inProgress}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pendentes: </span>
                        <span className="font-medium text-yellow-600">{tech.pending}</span>
                      </div>
                    </div>
                    <Progress value={tech.rate} className="mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Demandas (Últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="criados" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                    name="Criadas"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="concluidos" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="Concluídas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo Executivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Insights Principais</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Taxa de conclusão: {completionRate.toFixed(1)}%</li>
                    <li>• Tempo médio: {avgCompletionTime.toFixed(1)} dias</li>
                    <li>• {metrics.overdue} demandas atrasadas</li>
                    <li>• {technicianPerformance.length} técnicos ativos</li>
                  </ul>
                </div>

                {metrics.overdue > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Atenção Necessária</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {metrics.overdue} demandas estão atrasadas e precisam de atenção imediata.
                    </p>
                  </div>
                )}

                {completionRate >= 90 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Excelente Performance</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Taxa de conclusão acima de 90%! Continue assim.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedDashboard;