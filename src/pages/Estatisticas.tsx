
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Download,
  PieChart,
  BarChart,
  FileText,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { AnimatedPieChart } from "@/components/dashboard/AnimatedPieChart";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateServiceAnalysisReport } from "@/utils/pdf/reportGenerators";

const Estatisticas: React.FC = () => {
  const { services, isLoading } = useServices();
  const { teamMembers } = useTeamMembers();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedType, setSelectedType] = useState("all");
  const isMobile = useIsMobile();

  const filteredServices = services.filter(service => {
    // Period filter
    const periodOk = selectedPeriod === "all" ? true : (() => {
      const serviceDate = new Date(service.creationDate || service.date || '');
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (parseInt(selectedPeriod) * 24 * 60 * 60 * 1000));
      return serviceDate >= cutoffDate;
    })();

    // Type filter
    const typeOk = selectedType === "all" ? true : (service.serviceType === selectedType);

    return periodOk && typeOk;
  });

  const total = filteredServices.length;
  const pending = filteredServices.filter(s => s.status === 'pendente').length;
  const inProgress = filteredServices.filter(s => s.status === 'em_andamento').length;
  const completed = filteredServices.filter(s => s.status === 'concluido').length;
  const highPriority = filteredServices.filter(s => s.priority === 'alta').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Real data for service types distribution
  const serviceTypeDistribution = filteredServices.reduce((acc, service) => {
    const type = service.serviceType || 'Não especificado';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceTypeData = Object.entries(serviceTypeDistribution).map(([name, value]) => ({
    name,
    value
  }));

  const pieData = [
    { name: 'Concluído', value: completed, color: '#10b981' },
    { name: 'Pendente', value: pending, color: '#f59e0b' },
    { name: 'Em Andamento', value: inProgress, color: '#3b82f6' }
  ].filter(item => item.value > 0);

  // Average resolution time calculation (mock data)
  const avgResolutionTime = 38;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Estatísticas
              </h1>
              <p className="text-muted-foreground mt-1">Acompanhe o desempenho e evolução das suas demandas</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Period Filter */}
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
                <SelectItem value="all">Todos os períodos</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.keys(serviceTypeDistribution).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Professional Reports Button */}
            <Link to="/relatorios">
              <Button variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Relatórios Profissionais</span>
                <span className="sm:hidden">Relatórios</span>
              </Button>
            </Link>

            {/* Export PDF Button */}
            <Button onClick={() => generateServiceAnalysisReport(filteredServices, teamMembers)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total de Demandas</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{total}</p>
                    <div className="flex items-center mt-2 text-blue-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm">Trending</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-200 dark:bg-blue-800/50 rounded-full">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Concluídas</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{completed}</p>
                    <div className="flex items-center mt-2 text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">Success</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-200 dark:bg-green-800/50 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Taxa de Conclusão</p>
                    <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{completionRate}%</p>
                    <div className="flex items-center mt-2 text-yellow-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm">Rate</span>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-200 dark:bg-yellow-800/50 rounded-full">
                    <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Tempo Médio</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{avgResolutionTime}h</p>
                    <div className="flex items-center mt-2 text-purple-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">Average</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-200 dark:bg-purple-800/50 rounded-full">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Charts */}
        <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Distribuição por Status
                </CardTitle>
                <CardDescription>
                  Proporção dos serviços por status atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="space-y-4">
                    <AnimatedPieChart data={pieData} />
                    <div className="flex flex-wrap justify-center gap-4">
                      {pieData.map((entry, index) => (
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
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-primary" />
                  Tipos de Serviço
                </CardTitle>
                <CardDescription>
                  Distribuição por categoria de serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                {serviceTypeData.length > 0 ? (
                  <div className="space-y-4">
                    {serviceTypeData.map((item, index) => {
                      const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground">{item.value} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Team Performance */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Performance da Equipe
              </CardTitle>
              <CardDescription>
                Métricas individuais dos técnicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {teamMembers.map((member) => {
                    const memberServices = filteredServices.filter(service => 
                      service.technicians?.some(tech => tech.id === member.id)
                    );
                    const memberCompleted = memberServices.filter(s => s.status === 'concluido').length;
                    const memberRate = memberServices.length > 0 ? Math.round((memberCompleted / memberServices.length) * 100) : 0;

                    return (
                      <div key={member.id} className="p-4 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{member.name}</h4>
                          <Badge variant="outline" className={
                            memberRate >= 80 ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800" :
                            memberRate >= 60 ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800" :
                            "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                          }>
                            {memberRate}%
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-medium">{memberServices.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Concluídos:</span>
                            <span className="font-medium text-green-600">{memberCompleted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pendentes:</span>
                            <span className="font-medium text-orange-600">
                              {memberServices.filter(s => s.status === 'pendente').length}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhum membro da equipe encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Estatisticas;
