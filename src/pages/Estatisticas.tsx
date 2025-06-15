
import React, { useState, useEffect } from "react";
import { ArrowLeft, Filter, TrendingUp, Calendar, Users, Activity, BarChart3, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { AnimatedBarChart } from "@/components/dashboard/AnimatedBarChart";
import { AnimatedPieChart } from "@/components/dashboard/AnimatedPieChart";

const Estatisticas: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedTechnician, setSelectedTechnician] = useState("all");
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [loading, setLoading] = useState(false);

  // Mock data for charts
  const pieChartData = [
    { name: "Concluídas", value: 1, color: "#10b981" },
    { name: "Pendentes", value: 14, color: "#f59e0b" },
    { name: "Canceladas", value: 0, color: "#ef4444" }
  ];

  const barChartData = [
    { name: "Baixa", value: 3, color: "#6b7280" },
    { name: "Média", value: 8, color: "#3b82f6" },
    { name: "Alta", value: 3, color: "#f59e0b" },
    { name: "Urgente", value: 1, color: "#ef4444" }
  ];

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
            <p className="text-sm sm:text-base text-muted-foreground mt-1 text-left-force">Análise completa do desempenho</p>
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
                      <SelectItem value="inspection">Inspeção</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="repair">Reparo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants}>
          <DashboardStatsCards />
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
                    <AnimatedPieChart data={pieChartData} />
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
                    <AnimatedBarChart data={barChartData} />
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
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">João Silva</span>
                        <Badge variant="secondary" className="text-compact">8 concluídas</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Maria Santos</span>
                        <Badge variant="secondary" className="text-compact">6 concluídas</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Pedro Costa</span>
                        <Badge variant="secondary" className="text-compact">4 concluídas</Badge>
                      </div>
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
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Inspeção</span>
                        <Badge className="text-compact">45%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Manutenção</span>
                        <Badge className="text-compact">35%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Reparo</span>
                        <Badge className="text-compact">20%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2 text-left-force">
                      <Calendar className="h-4 w-4 text-primary" />
                      Tendências
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Esta semana</span>
                        <Badge variant="default" className="text-compact">+12%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Este mês</span>
                        <Badge variant="default" className="text-compact">+8%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-left-force text-no-wrap">Média conclusão</span>
                        <Badge variant="secondary" className="text-compact">2.3 dias</Badge>
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
