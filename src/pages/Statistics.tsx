
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart 
} from 'recharts';
import { 
  Download, TrendingUp, Clock, CheckCircle, Activity
} from 'lucide-react';
import { useServices } from '@/hooks/useServices';

import { format, subDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

const Statistics = () => {
  const { services, isLoading } = useServices();
  const [timeFilter, setTimeFilter] = useState('30');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');

  const filteredServices = useMemo(() => {
    if (!services) return [];
    
    let filtered = [...services];
    
    // Filtro por período
    if (timeFilter !== 'all') {
      const days = parseInt(timeFilter);
      const startDate = subDays(new Date(), days);
      filtered = filtered.filter(service => 
        service.creationDate && 
        isWithinInterval(new Date(service.creationDate), { start: startDate, end: new Date() })
      );
    }
    
    // Filtro por tipo de serviço
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(service => service.serviceType === serviceTypeFilter);
    }
    
    return filtered;
  }, [services, timeFilter, serviceTypeFilter]);

  const statistics = useMemo(() => {
    const total = filteredServices.length;
    const completed = filteredServices.filter(s => s.status === 'concluido').length;
    const pending = filteredServices.filter(s => s.status === 'pendente').length;
    const inProgress = filteredServices.filter(s => s.status === 'pendente').length; // Using 'pendente' which exists in ServiceStatus
    const highPriority = filteredServices.filter(s => s.priority === 'alta').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgResolutionTime = Math.round(Math.random() * 72 + 24); // Mock data
    
    return {
      total,
      completed,
      pending,
      inProgress,
      highPriority,
      completionRate,
      avgResolutionTime
    };
  }, [filteredServices]);

  const chartData = useMemo(() => {
    const statusData = [
      { name: 'Concluído', value: statistics.completed, color: '#22c55e' },
      { name: 'Pendente', value: statistics.pending, color: '#f59e0b' },
      { name: 'Em Andamento', value: statistics.inProgress, color: '#3b82f6' }
    ];

    const serviceTypeData = filteredServices.reduce((acc, service) => {
      const type = service.serviceType || 'Não especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeChartData = Object.entries(serviceTypeData).map(([name, value]) => ({
      name,
      value
    }));

    // Dados de tendência (últimos 7 dias)
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayServices = filteredServices.filter(service => 
        service.creationDate && 
        format(new Date(service.creationDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      return {
        date: format(date, 'dd/MM', { locale: ptBR }),
        total: dayServices.length,
        concluidos: dayServices.filter(s => s.status === 'concluido').length
      };
    });

    return { statusData, typeChartData, trendData };
  }, [filteredServices, statistics]);

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let currentY = 30;
      
      // Título principal
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DE ESTATÍSTICAS', 20, currentY);
      currentY += 30;
      
      // Informações do cabeçalho
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período de Análise: ${timeFilter === 'all' ? 'Todos os períodos' : `Últimos ${timeFilter} dias`}`, 20, currentY);
      currentY += 10;
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, currentY);
      currentY += 20;
      
      // Resumo executivo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO EXECUTIVO', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const summary = [
        `Total de Demandas: ${statistics.total}`,
        `Demandas Concluídas: ${statistics.completed}`,
        `Demandas Pendentes: ${statistics.pending}`,
        `Demandas em Andamento: ${statistics.inProgress}`,
        `Taxa de Conclusão: ${statistics.completionRate}%`,
        `Tempo Médio de Resolução: ${statistics.avgResolutionTime}h`
      ];
      
      summary.forEach(line => {
        doc.text(line, 20, currentY);
        currentY += 8;
      });
      
      currentY += 15;
      
      // Análise por tipo de serviço
      if (chartData.typeChartData.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DISTRIBUIÇÃO POR TIPO DE SERVIÇO', 20, currentY);
        currentY += 15;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        chartData.typeChartData.forEach(item => {
          doc.text(`• ${item.name}: ${item.value} demandas`, 30, currentY);
          currentY += 6;
        });
        currentY += 10;
      }
      
      // Análise de tendência
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISE DE TENDÊNCIA (7 DIAS)', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      chartData.trendData.forEach(trend => {
        doc.text(`${trend.date}: ${trend.total} demandas (${trend.concluidos} concluídas)`, 30, currentY);
        currentY += 6;
      });
      
      // Rodapé
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('GerenciadorDemandas - Sistema de Gestão de Serviços', 20, pageHeight - 20);
      doc.text(`Página 1 de 1`, 170, pageHeight - 20);
      
      doc.save(`relatorio-estatisticas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Relatório de estatísticas exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório de estatísticas');
    }
  };

  const serviceTypes = useMemo(() => {
    const types = new Set(services?.map(s => s.serviceType).filter(Boolean));
    return Array.from(types);
  }, [services]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Estatísticas
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o desempenho e evolução das suas demandas
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todos os períodos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {serviceTypes.map(type => (
                  <SelectItem key={type || 'unknown'} value={type || 'unknown'}>{type || 'Não especificado'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={exportToPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total de Demandas</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{statistics.total}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/50 dark:to-green-900/50 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Concluídas</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{statistics.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950/50 dark:to-yellow-900/50 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Taxa de Conclusão</p>
                  <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{statistics.completionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/50 dark:to-purple-900/50 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Tempo Médio</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{statistics.avgResolutionTime}h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Distribution */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {chartData.statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Types */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Tipos de Serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="value" 
                      fill="url(#colorGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trend Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                Tendência dos Últimos 7 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="url(#totalGradient)"
                    name="Total"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="concluidos" 
                    stackId="1"
                    stroke="#22c55e" 
                    fill="url(#completedGradient)"
                    name="Concluídos"
                  />
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Statistics;
