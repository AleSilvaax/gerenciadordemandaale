
import React, { useState, useEffect } from "react";
import { ArrowLeft, BellDot, Filter, Calendar, TrendingUp, Users, BarChart3, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServices, getTeamMembers } from "@/services/servicesDataService";
import { Service, TeamMember } from "@/types/serviceTypes";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { MotionContainer } from "@/components/dashboard/MotionContainer";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { AnimatedBarChart } from "@/components/dashboard/AnimatedBarChart";
import { AnimatedPieChart } from "@/components/dashboard/AnimatedPieChart";
import { motion, AnimatePresence } from "framer-motion";

const Estatisticas: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState("30days");
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, teamData] = await Promise.all([
          getServices(),
          getTeamMembers()
        ]);
        console.log("Serviços recebidos (Estatisticas):", servicesData);
        console.log("Membros da equipe recebidos:", teamData);
        setServices(servicesData ?? []);
        setTeamMembers(teamData ?? []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast("Erro ao carregar dados estatísticos");
        setServices([]);
        setTeamMembers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    let result = [...services];
    if (timeFilter !== "all") {
      const cutoffDate = getDateFromFilter(timeFilter);
      result = result.filter(service => {
        const dataServico = service.date || service.creationDate || (service as any).created_at;
        return dataServico && new Date(dataServico) >= cutoffDate;
      });
    }
    if (selectedTechnician !== "all") {
      result = result.filter(service => service.technician && service.technician.id === selectedTechnician);
    }
    if (selectedServiceType !== "all") {
      result = result.filter(service => service.serviceType === selectedServiceType);
    }
    console.log("Demanda pós-filtro (Estatisticas):", result);
    setFilteredServices(result);
  }, [services, timeFilter, selectedTechnician, selectedServiceType]);
  
  const getDateFromFilter = (filter: string): Date => {
    const today = new Date();
    
    switch (filter) {
      case "7days":
        return subDays(today, 7);
      case "30days":
        return subDays(today, 30);
      case "90days":
        return subDays(today, 90);
      case "year":
        return new Date(today.getFullYear(), 0, 1);
      default:
        return new Date(0);
    }
  };
  
  const calculateStatistics = () => {
    const totalServices = filteredServices.length;
    const completedServices = filteredServices.filter(s => s.status === "concluido").length;
    const pendingServices = filteredServices.filter(s => s.status === "pendente").length;
    const cancelledServices = filteredServices.filter(s => s.status === "cancelado").length;
    
    const completionRate = totalServices > 0 
      ? Math.round((completedServices / totalServices) * 100) 
      : 0;
    
    const overdue = filteredServices.filter(service => {
      if (service.status !== "pendente" || !service.dueDate) return false;
      return new Date(service.dueDate) < new Date();
    }).length;
    
    const completedWithDates = filteredServices.filter(s => 
      s.status === "concluido" && s.date
    );
    
    let avgCompletionTime = 0;
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, service) => {
        const startDate = new Date(service.date!);
        const endDate = new Date();
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      
      avgCompletionTime = Math.round(totalDays / completedWithDates.length);
    }
    
    const priorities = {
      baixa: filteredServices.filter(s => s.priority === "baixa").length,
      media: filteredServices.filter(s => s.priority === "media").length,
      alta: filteredServices.filter(s => s.priority === "alta").length,
      urgente: filteredServices.filter(s => s.priority === "urgente").length,
    };
    
    return {
      totalServices,
      completedServices,
      pendingServices,
      cancelledServices,
      completionRate,
      overdue,
      avgCompletionTime,
      priorities
    };
  };
  
  const stats = calculateStatistics();
  
  const calculateTechnicianProductivity = () => {
    return teamMembers
      .filter(member => member.role === "tecnico")
      .map(tech => {
        const techServices = services.filter(s => s.technician.id === tech.id);
        const completed = techServices.filter(s => s.status === "concluido").length;
        const total = techServices.length;
        const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
          ...tech,
          completed,
          total,
          productivity
        };
      })
      .sort((a, b) => b.productivity - a.productivity);
  };
  
  const technicianProductivity = calculateTechnicianProductivity();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6 flex justify-center items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }
  
  if (!services.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Sem dados de estatísticas
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Nenhuma demanda foi registrada no sistema ainda. Crie uma nova demanda para visualizar estatísticas.
          </p>
          <Link to="/novademanda">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Nova Demanda
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6 pb-24">
      {/* Header moderno */}
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link 
          to="/" 
          className="w-12 h-12 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft size={20} className="text-slate-700 dark:text-slate-300" />
        </Link>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Estatísticas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Análise completa do desempenho
          </p>
        </div>
        
        <button className="w-12 h-12 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <BellDot size={20} className="text-slate-700 dark:text-slate-300" />
        </button>
      </motion.div>

      {/* Filtros modernos */}
      <motion.div
        className="mb-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center">
            <Filter className="h-5 w-5 mr-3 text-blue-600" />
            Filtros Avançados
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Período</label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="bg-white/80 dark:bg-slate-700/80 border-white/30 focus:border-blue-400">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Técnico</label>
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className="bg-white/80 dark:bg-slate-700/80 border-white/30 focus:border-blue-400">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os técnicos</SelectItem>
                {teamMembers
                  .filter(member => member.role === "tecnico")
                  .map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Serviço</label>
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger className="bg-white/80 dark:bg-slate-700/80 border-white/30 focus:border-blue-400">
                <Activity className="h-4 w-4 mr-2 text-blue-600" />
                <SelectValue placeholder="Tipo de serviço" />
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
      </motion.div>

      {/* Cards de estatísticas principais */}
      <MotionContainer className="mb-8">
        <DashboardStatsCards
          stats={[
            { 
              label: "Total de Demandas", 
              value: stats.totalServices, 
              icon: <BarChart3 className="w-6 h-6" />,
              description: "Demandas registradas no período"
            },
            { 
              label: "Concluídas", 
              value: stats.completedServices, 
              icon: <TrendingUp className="w-6 h-6" />,
              description: `${stats.completionRate}% de taxa de conclusão`
            },
            { 
              label: "Pendentes", 
              value: stats.pendingServices, 
              icon: <Activity className="w-6 h-6" />,
              description: "Aguardando execução"
            },
            { 
              label: "Atrasadas", 
              value: stats.overdue, 
              icon: <Calendar className="w-6 h-6" />,
              description: "Passaram do prazo"
            }
          ]}
        />
      </MotionContainer>

      {/* Gráficos principais */}
      <MotionContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-3"></div>
                Status das Demandas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedPieChart
                data={[
                  { name: "Pendentes", value: stats.pendingServices, color: "#f59e0b" },
                  { name: "Concluídas", value: stats.completedServices, color: "#10b981" },
                  { name: "Canceladas", value: stats.cancelledServices, color: "#ef4444" }
                ]}
                height={260}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-3"></div>
                Prioridades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedBarChart
                data={[
                  { name: "Baixa", value: stats.priorities.baixa, color: "#3b82f6" },
                  { name: "Média", value: stats.priorities.media, color: "#f59e0b" },
                  { name: "Alta", value: stats.priorities.alta, color: "#f97316" },
                  { name: "Urgente", value: stats.priorities.urgente, color: "#ef4444" },
                ]}
                height={260}
              />
            </CardContent>
          </Card>
        </motion.div>
      </MotionContainer>

      {/* Gráfico de tipos de serviço */}
      <MotionContainer className="mb-8">
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mr-3"></div>
                Distribuição por Tipo de Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedBarChart
                data={
                  Object.entries(filteredServices.reduce((acc, cur) => {
                    const type = cur.serviceType || (cur as any).service_type || "Outros";
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)).map(([type, count]) => ({
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    value: count,
                    color: type === "Vistoria" ? "#8b5cf6" : 
                           type === "Instalação" ? "#ec4899" : 
                           type === "Manutenção" ? "#06b6d4" : "#64748b"
                  }))
                }
                height={280}
              />
            </CardContent>
          </Card>
        </motion.div>
      </MotionContainer>
      
      {/* Desempenho da equipe */}
      <MotionContainer>
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mr-3"></div>
                  Desempenho da Equipe
                </CardTitle>
                <Link to="/equipe" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Ver equipe completa →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {technicianProductivity.map((tech, index) => (
                  <motion.div 
                    key={tech.id} 
                    className="flex items-center p-4 bg-white/40 dark:bg-slate-700/40 rounded-xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <TeamMemberAvatar
                      src={tech.avatar}
                      name={tech.name}
                      size="md"
                      className="mr-4"
                    />
                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{tech.name}</span>
                        <span className="text-lg font-bold text-blue-600">{tech.productivity}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden">
                        <motion.div 
                          className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${tech.productivity}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mt-2">
                        <span>{tech.completed} concluídos</span>
                        <span>{tech.total} total</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {technicianProductivity.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Nenhum técnico encontrado com demandas no período selecionado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </MotionContainer>
    </div>
  );
};

export default Estatisticas;
