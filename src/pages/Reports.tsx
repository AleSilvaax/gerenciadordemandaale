
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
  CheckCircle,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'executive',
      title: 'Relatório Executivo',
      description: 'Visão geral estratégica com KPIs e métricas principais para tomada de decisão',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-blue-600',
      accent: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'operational',
      title: 'Relatório Operacional',
      description: 'Análise detalhada de processos, performance técnica e métricas operacionais',
      icon: BarChart3,
      gradient: 'from-emerald-500 to-emerald-600',
      accent: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'team_performance',
      title: 'Performance da Equipe',
      description: 'Avaliação individual e coletiva dos técnicos com métricas de produtividade',
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      accent: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    },
    {
      id: 'service_analysis',
      title: 'Análise de Serviços',
      description: 'Breakdown completo por tipo, prioridade, status e tendências temporais',
      icon: PieChart,
      gradient: 'from-orange-500 to-orange-600',
      accent: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
    }
  ];

  const handleGenerateReport = async (reportType: string) => {
    setGeneratingReport(reportType);
    
    toast({
      title: "🚀 Gerando relatório profissional...",
      description: "Processando dados e criando documento PDF...",
    });
    
    try {
      // Filter data based on selections
      const filteredServices = services.filter(service => {
        if (selectedPeriod !== 'all') {
          const now = new Date();
          const serviceDate = new Date(service.date || new Date());
          const diffDays = Math.floor((now.getTime() - serviceDate.getTime()) / (1000 * 3600 * 24));
          
          const periodDays = parseInt(selectedPeriod);
          if (diffDays > periodDays) return false;
        }
        
        if (selectedType !== 'all' && service.serviceType !== selectedType) {
          return false;
        }
        
        if (selectedTechnician !== 'all' && !service.technicians?.some(t => t.id === selectedTechnician)) {
          return false;
        }
        
        return true;
      });

      const filteredTeamMembers = selectedTechnician !== 'all' 
        ? teamMembers.filter(member => member.id === selectedTechnician)
        : teamMembers;

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
        title: "✅ Relatório gerado com sucesso!",
        description: "O download foi iniciado automaticamente.",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "❌ Erro ao gerar relatório",
        description: "Tente novamente em alguns instantes.",
      });
    } finally {
      setGeneratingReport(null);
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 pb-24 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link 
            to="/estatisticas" 
            className="h-12 w-12 rounded-xl flex items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
                <FileBarChart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Relatórios Profissionais
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Gere relatórios detalhados com dados em tempo real
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Filter className="w-5 h-5 text-primary" />
                </div>
                Filtros de Relatório
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Técnico</label>
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Serviço</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
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
        </motion.div>

        {/* Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Concluídos</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Em Andamento</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.inProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Pendentes</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.pending}</p>
                </div>
                <Calendar className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tipos de Relatório */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {reportTypes.map((report, index) => {
            const Icon = report.icon;
            const isGenerating = generatingReport === report.id;
            
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${report.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${report.gradient} text-white shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{report.title}</h3>
                        <Badge variant="outline" className={`mt-1 ${report.accent} border-0`}>
                          PDF Profissional
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 relative">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.description}
                    </p>
                    
                    <Button 
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={isGenerating}
                      className={`w-full bg-gradient-to-r ${report.gradient} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-200`}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Gerar Relatório
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
