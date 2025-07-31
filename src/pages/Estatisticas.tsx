import React, { useState, useEffect } from "react";
import { ArrowLeft, Filter, TrendingUp, Calendar, Users, Activity, BarChart3, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealTimeStatsCards } from "@/components/dashboard/RealTimeStatsCards";
import { AnimatedBarChart } from "@/components/dashboard/AnimatedBarChart";
import { AnimatedPieChart } from "@/components/dashboard/AnimatedPieChart";
import { getServices, getTeamMembers } from "@/services/servicesDataService";

const Estatisticas: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedTechnician, setSelectedTechnician] = useState("all");
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({
    pieChartData: [],
    barChartData: [],
    teamPerformance: [],
    serviceTypes: []
  });

  // Load real data for charts
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        const [services, teamMembers] = await Promise.all([
          getServices(),
          getTeamMembers()
        ]);

        // Status distribution
        const statusCounts = services.reduce((acc, service) => {
          acc[service.status] = (acc[service.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const pieChartData = [
          { name: "Concluídas", value: statusCounts.concluido || 0, color: "#10b981" },
          { name: "Pendentes", value: statusCounts.pendente || 0, color: "#f59e0b" },
          { name: "Canceladas", value: statusCounts.cancelado || 0, color: "#ef4444" }
        ];

        // Priority distribution
        const priorityCounts = services.reduce((acc, service) => {
          acc[service.priority] = (acc[service.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const barChartData = [
          { name: "Baixa", value: priorityCounts.baixa || 0, color: "#6b7280" },
          { name: "Média", value: priorityCounts.media || 0, color: "#3b82f6" },
          { name: "Alta", value: priorityCounts.alta || 0, color: "#f59e0b" },
          { name: "Urgente", value: priorityCounts.urgente || 0, color: "#ef4444" }
        ];

        // Team performance
        const techPerformance = services.reduce((acc, service) => {
          if (service.technicians?.[0]?.id) {
            acc[service.technicians[0].id] = (acc[service.technicians[0].id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const teamPerformance = Object.entries(techPerformance)
          .map(([techId, count]) => {
            const tech = teamMembers.find(m => m.id === techId);
            return {
              name: tech?.name || 'Desconhecido',
              completed: count
            };
          })
          .sort((a, b) => b.completed - a.completed)
          .slice(0, 5);

        // Service types
        const typeCounts = services.reduce((acc, service) => {
          const type = service.serviceType || 'Outros';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const serviceTypes = Object.entries(typeCounts)
          .map(([type, count]) => ({
            name: type,
            percentage: Math.round((count / services.length) * 100)
          }))
          .sort((a, b) => b.percentage - a.percentage);

        setChartData({
          pieChartData,
          barChartData,
          teamPerformance,
          serviceTypes
        });
      } catch (error) {
        console.error('Error loading chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [selectedPeriod, selectedTechnician, selectedServiceType]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div className="min-h-screen stats-page bg-gradient-to-br from-background via-background to-secondary/20">
      <motion.div 
        className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 sm:space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <Link 
            to="/" 
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Estatísticas
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 text-left-force">Análise completa do desempenho em tempo real</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <CardTitle className="text-base sm:text-lg text-left-force">Filtros Avançados</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground text-left-force">Período</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="bg-background/50 text-compact">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground text-left-force">Técnico</label>
                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger className="bg-background/50 text-compact">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os técnicos</SelectItem>
                      <SelectItem value="tech1">João Silva</SelectItem>
                      <SelectItem value="tech2">Maria Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground text-left-force">Tipo de Serviço</label>
                  <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                    <SelectTrigger className="bg-background/50 text-compact">
                      <Activity className="h-4 w-4 mr-2 text-primary" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="Vistoria">Vistoria</SelectItem>
                      <SelectItem value="Instalação">Instalação</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants}>
          <RealTimeStatsCards />
        </motion.div>

        {/* Charts Section */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-background/50">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-compact">
                <BarChart3 size={16} />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-2 text-compact">
                <PieChart size={16} />
                Detalhada
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-left-force">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Status das Demandas
                    </CardTitle>
                    <CardDescription className="text-left-force">Distribuição por status atual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="h-[220px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <AnimatedPieChart data={chartData.pieChartData} />
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-left-force">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Prioridades
                    </CardTitle>
                    <CardDescription className="text-left-force">Demandas por nível de prioridade</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="h-[220px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <AnimatedBarChart data={chartData.barChartData} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-left-force">
                      <Users className="h-4 w-4 text-primary" />
                      Performance da Equipe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {chartData.teamPerformance.map((member, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-left-force text-no-wrap">{member.name}</span>
                          <Badge variant="secondary" className="text-compact">{member.completed} concluídas</Badge>
                        </div>
                      ))}
                      {chartData.teamPerformance.length === 0 && !loading && (
                        <p className="text-sm text-muted-foreground text-center">Nenhum dado disponível</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-left-force">
                      <Activity className="h-4 w-4 text-primary" />
                      Tipos de Serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {chartData.serviceTypes.map((type, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-left-force text-no-wrap">{type.name}</span>
                          <Badge className="text-compact">{type.percentage}%</Badge>
                        </div>
                      ))}
                      {chartData.serviceTypes.length === 0 && !loading && (
                        <p className="text-sm text-muted-foreground text-center">Nenhum dado disponível</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-left-force">
                      <Calendar className="h-4 w-4 text-primary" />
                      Métricas em Tempo Real
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Atualizações</span>
                        <Badge variant="default" className="text-compact animate-pulse">Em tempo real</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Última atualização</span>
                        <Badge variant="secondary" className="text-compact">{new Date().toLocaleTimeString()}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Status do sistema</span>
                        <Badge variant="default" className="text-compact bg-green-500">Online</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Estatisticas;
