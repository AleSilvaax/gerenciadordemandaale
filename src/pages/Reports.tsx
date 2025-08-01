import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  FileBarChart,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/hooks/useServices';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useToast } from '@/hooks/use-toast';
import { generateExecutiveReport, generateOperationalReport, generateTeamPerformanceReport, generateServiceAnalysisReport } from '@/utils/pdf/reportGenerators';

const Reports: React.FC = () => {
  const { services, isLoading } = useServices();
  const { teamMembers } = useTeamMembers();
  const { toast } = useToast();
  
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');

  const reportTypes = [
    {
      id: 'executive',
      title: 'Relatório Executivo',
      description: 'Visão geral para gestores com KPIs principais',
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      id: 'operational',
      title: 'Relatório Operacional',
      description: 'Detalhes técnicos e métricas de performance',
      icon: BarChart3,
      color: 'bg-green-500'
    },
    {
      id: 'team_performance',
      title: 'Performance da Equipe',
      description: 'Análise individual e coletiva dos técnicos',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      id: 'service_analysis',
      title: 'Análise de Serviços',
      description: 'Breakdown por tipo, prioridade e status',
      icon: PieChart,
      color: 'bg-orange-500'
    }
  ];

  const handleGenerateReport = async (reportType: string) => {
    toast({
      title: "Gerando relatório...",
      description: "Preparando dados...",
    });
    
    try {
      // Filter data based on selections
      const filteredServices = services.filter(service => {
        // Apply period filter
        if (selectedPeriod !== 'all') {
          const now = new Date();
          const serviceDate = new Date(service.date || new Date());
          const diffDays = Math.floor((now.getTime() - serviceDate.getTime()) / (1000 * 3600 * 24));
          
          const periodDays = parseInt(selectedPeriod);
          if (diffDays > periodDays) return false;
        }
        
        // Apply type filter
        if (selectedType !== 'all' && service.serviceType !== selectedType) {
          return false;
        }
        
        // Apply technician filter
        if (selectedTechnician !== 'all' && !service.technicians?.some(t => t.id === selectedTechnician)) {
          return false;
        }
        
        return true;
      });

      const filteredTeamMembers = selectedTechnician !== 'all' 
        ? teamMembers.filter(member => member.id === selectedTechnician)
        : teamMembers;

      // Generate appropriate report
      switch (reportType) {
        case 'executive':
          await generateExecutiveReport(filteredServices, filteredTeamMembers);
          break;
        case 'operational':
          await generateOperationalReport(filteredServices, filteredTeamMembers);
          break;
        case 'team_performance':
          await generateTeamPerformanceReport(filteredServices, filteredTeamMembers);
          break;
        case 'service_analysis':
          await generateServiceAnalysisReport(filteredServices, filteredTeamMembers);
          break;
        default:
          throw new Error("Tipo de relatório inválido");
      }
      
      toast({
        title: "Relatório gerado!",
        description: "O download foi iniciado automaticamente.",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Tente novamente em alguns instantes.",
      });
    }
  };

  const calculateStats = () => {
    const total = services.length;
    const completed = services.filter(s => s.status === 'concluido').length;
    const pending = services.filter(s => s.status === 'pendente').length;
    const inProgress = services.filter(s => s.status === 'em_andamento').length;
    
    return { total, completed, pending, inProgress };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios Profissionais</h1>
            <p className="text-muted-foreground">
              Gere relatórios detalhados com dados em tempo real
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <FileBarChart className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros de Relatório</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 3 meses</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Técnico</label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Tipo de Serviço</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Vistoria">Vistoria</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Instalação">Instalação</SelectItem>
                  <SelectItem value="Reparo">Reparo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.inProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-red-500">{stats.pending}</p>
                </div>
                <Calendar className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Tipos de Relatório */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${report.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{report.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{report.description}</p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    PDF Profissional
                  </Badge>
                  <Button 
                    onClick={() => handleGenerateReport(report.id)}
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Gerar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Reports;