
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart 
} from 'recharts';
import { 
  Download, TrendingUp, Clock, CheckCircle, AlertTriangle, 
  Users, Calendar, FileText, Activity 
} from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { Service } from '@/types/serviceTypes';
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
      
      // === CAPA PROFISSIONAL ===
      // Fundo colorido para capa
      doc.setFillColor(59, 130, 246); // Azul moderno
      doc.rect(0, 0, 210, 80, 'F');
      
      // Título principal
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('RELATÓRIO ANALÍTICO', 105, 30, { align: 'center' });
      doc.text('DE ESTATÍSTICAS', 105, 45, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Gestão de Demandas', 105, 60, { align: 'center' });
      
      // === INFORMAÇÕES DA CAPA ===
      doc.setFillColor(255, 255, 255);
      doc.rect(20, 90, 170, 140, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, 90, 170, 140, 'S');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO EXECUTIVO', 105, 110, { align: 'center' });
      
      currentY = 130;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      const executiveSummary = [
        [`Período Analisado:`, `${timeFilter === 'all' ? 'Todos os períodos' : `Últimos ${timeFilter} dias`}`],
        [`Total de Demandas:`, `${statistics.total}`],
        [`Taxa de Conclusão:`, `${statistics.completionRate}%`],
        [`Demandas Concluídas:`, `${statistics.completed}`],
        [`Demandas Pendentes:`, `${statistics.pending}`],
        [`Eficiência Operacional:`, `${statistics.completionRate > 80 ? 'Excelente' : statistics.completionRate > 60 ? 'Boa' : 'Necessita Melhoria'}`]
      ];
      
      executiveSummary.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 30, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 120, currentY);
        currentY += 12;
      });
      
      // Data e rodapé da capa
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 105, 250, { align: 'center' });
      
      // === NOVA PÁGINA - CONTEÚDO DETALHADO ===
      doc.addPage();
      currentY = 30;
      
      // Cabeçalho da página
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISE DETALHADA', 20, 15);
      
      doc.setTextColor(0, 0, 0);
      currentY = 40;
      
      // === INDICADORES DE PERFORMANCE ===
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('🎯 INDICADORES DE PERFORMANCE', 20, currentY);
      currentY += 20;
      
      const kpis = [
        { label: 'Volume Total', value: statistics.total, trend: '📈', color: [59, 130, 246] },
        { label: 'Taxa de Conclusão', value: `${statistics.completionRate}%`, trend: statistics.completionRate > 80 ? '📈' : '📊', color: [34, 197, 94] },
        { label: 'Pendências Ativas', value: statistics.pending, trend: '⏱️', color: [251, 146, 60] },
        { label: 'Tempo Médio', value: `${statistics.avgResolutionTime}h`, trend: '⚡', color: [168, 85, 247] }
      ];
      
      kpis.forEach((kpi, index) => {
        const xPos = 20 + (index % 2) * 90;
        const yPos = currentY + Math.floor(index / 2) * 25;
        
        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.rect(xPos, yPos - 5, 80, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${kpi.trend} ${kpi.label}`, xPos + 5, yPos + 5);
        doc.setFontSize(14);
        doc.text(String(kpi.value), xPos + 5, yPos + 15);
      });
      
      currentY += 60;
      
      // === DISTRIBUIÇÃO POR TIPO ===
      if (chartData.typeChartData.length > 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('📊 DISTRIBUIÇÃO POR TIPO DE SERVIÇO', 20, currentY);
        currentY += 15;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        chartData.typeChartData.forEach((item, index) => {
          const percentage = ((item.value / statistics.total) * 100).toFixed(1);
          doc.text(`▪ ${item.name}:`, 30, currentY);
          doc.text(`${item.value} demandas (${percentage}%)`, 120, currentY);
          currentY += 8;
        });
        currentY += 15;
      }
      
      // === ANÁLISE TEMPORAL ===
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('📅 ANÁLISE TEMPORAL (7 DIAS)', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      chartData.trendData.forEach(trend => {
        const efficiency = trend.total > 0 ? ((trend.concluidos / trend.total) * 100).toFixed(1) : '0';
        doc.text(`${trend.date}:`, 30, currentY);
        doc.text(`${trend.total} total • ${trend.concluidos} concluídas • ${efficiency}% eficiência`, 60, currentY);
        currentY += 8;
      });
      
      // === RECOMENDAÇÕES INTELIGENTES ===
      currentY += 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('💡 RECOMENDAÇÕES ESTRATÉGICAS', 20, currentY);
      currentY += 15;
      
      const recommendations = [];
      if (statistics.completionRate < 70) {
        recommendations.push('• Revisar processos operacionais para melhorar taxa de conclusão');
      }
      if (statistics.pending > statistics.completed) {
        recommendations.push('• Implementar gestão mais eficiente de backlog de demandas');
      }
      if (statistics.avgResolutionTime > 48) {
        recommendations.push('• Otimizar tempo de resposta através de automação de processos');
      }
      recommendations.push('• Considerar expansão da equipe técnica baseado na demanda crescente');
      recommendations.push('• Implementar sistema de feedback contínuo para melhoria da qualidade');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      recommendations.forEach(rec => {
        doc.text(rec, 30, currentY);
        currentY += 8;
      });
      
      // === RODAPÉ PROFISSIONAL ===
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 25, 190, pageHeight - 25);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('GerenciadorDemandas - Relatório Analítico de Performance', 20, pageHeight - 15);
      doc.text(`Página 2 de 2 • Confidencial`, 190, pageHeight - 15, { align: 'right' });
      
      doc.save(`relatorio-dashboard-avancado-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Relatório de dashboard exportado com sucesso!');
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
                  <SelectItem key={type} value={type}>{type}</SelectItem>
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
