import React, { useState, useEffect } from "react";
import { ArrowLeft, BellDot, Filter, Download, Calendar, Clock, BarChart2, CalendarDays, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCircle } from "@/components/ui-custom/ChartCircle";
import { getServices, getTeamMembers } from "@/services/api";
import { Service, TeamMember } from "@/types/serviceTypes";
import { StatisticsCards } from "@/components/ui-custom/StatisticsCards";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    // Filtro extra para debug (log após filtrar)
    let result = [...services];
    if (timeFilter !== "all") {
      const cutoffDate = getDateFromFilter(timeFilter);
      result = result.filter(service => {
        // Corrige para aceitar criação, data customizada, etc
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
        return new Date(today.getFullYear(), 0, 1); // First day of current year
      default:
        return new Date(0); // Beginning of time
    }
  };
  
  // Calculate statistics
  const calculateStatistics = () => {
    // Total services statistics
    const totalServices = filteredServices.length;
    const completedServices = filteredServices.filter(s => s.status === "concluido").length;
    const pendingServices = filteredServices.filter(s => s.status === "pendente").length;
    const cancelledServices = filteredServices.filter(s => s.status === "cancelado").length;
    
    // Completion rate
    const completionRate = totalServices > 0 
      ? Math.round((completedServices / totalServices) * 100) 
      : 0;
    
    // Overdue services
    const overdue = filteredServices.filter(service => {
      if (service.status !== "pendente" || !service.dueDate) return false;
      return new Date(service.dueDate) < new Date();
    }).length;
    
    // Average completion time (in days)
    const completedWithDates = filteredServices.filter(s => 
      s.status === "concluido" && s.date
    );
    
    let avgCompletionTime = 0;
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, service) => {
        const startDate = new Date(service.date!);
        // If there's a last updated date use that, otherwise use current date
        const endDate = new Date(); // In a real app this would be the completion date
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      
      avgCompletionTime = Math.round(totalDays / completedWithDates.length);
    }
    
    // Priority distribution
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
  
  // Handle report export
  const handleExportReport = (format: 'pdf' | 'excel') => {
    const message = format === 'pdf' ? 'Exportando estatísticas em PDF...' : 'Exportando estatísticas em Excel...';
    toast(message);
    // Implementation would connect to actual export functionality
  };
  
  // Calculate technician productivity
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
      <div className="min-h-screen p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Mostrar aviso especial se não houver dados
  if (!services.length) {
    return (
      <div className="min-h-screen p-4 flex flex-col items-center">
        <h2 className="text-center text-lg mb-2">Sem dados de estatísticas</h2>
        <p className="text-center text-sm text-muted-foreground mb-4">
          Nenhuma demanda foi registrada no sistema ainda. Crie uma nova demanda para visualizar estatísticas.
        </p>
        <Link to="/novademanda">
          <Button>Nova Demanda</Button>
        </Link>
      </div>
    );
  }
  
  // Reorganizamos o layout
  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Estatísticas</h1>
        <button className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10">
          <BellDot size={18} />
        </button>
      </motion.div>

      {/* Filtros */}
      <motion.div
        className="mb-6 bg-card rounded-lg border border-white/10 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Select
              value={timeFilter}
              onValueChange={setTimeFilter}
            >
              <SelectTrigger className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
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
          
          <div>
            <Select
              value={selectedTechnician}
              onValueChange={setSelectedTechnician}
            >
              <SelectTrigger className="w-full">
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
          
          <div>
            <Select
              value={selectedServiceType}
              onValueChange={setSelectedServiceType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="inspection">Vistoria</SelectItem>
                <SelectItem value="installation">Instalação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Cards de estatísticas principais com efeito count-up */}
      <MotionContainer className="">
        <DashboardStatsCards
          stats={[
            { label: "Total de Demandas", value: stats.totalServices, color: "text-white" },
            { label: "Concluídas", value: stats.completedServices, color: "text-green-500" },
            { label: "Pendentes", value: stats.pendingServices, color: "text-yellow-500" },
            { label: "Atrasadas", value: stats.overdue, color: "text-red-500" }
          ]}
        />
      </MotionContainer>

      {/* Gráficos principais animados */}
      <MotionContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div>
          <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm mb-4">
            <h3 className="text-lg font-medium mb-4">Status das Demandas</h3>
            <AnimatedPieChart
              data={[
                { name: "Pendentes", value: stats.pendingServices, color: "#f59e0b" },
                { name: "Concluídas", value: stats.completedServices, color: "#10b981" },
                { name: "Canceladas", value: stats.cancelledServices, color: "#ef4444" }
              ]}
            />
          </div>
        </motion.div>
        <motion.div>
          <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm mb-4">
            <h3 className="text-lg font-medium mb-4">Distribuição por Prioridade</h3>
            <AnimatedBarChart
              data={[
                { name: "Baixa", value: stats.priorities.baixa, color: "#3b82f6" },
                { name: "Média", value: stats.priorities.media, color: "#f59e0b" },
                { name: "Alta", value: stats.priorities.alta, color: "#f97316" },
                { name: "Urgente", value: stats.priorities.urgente, color: "#ef4444" },
              ]}
            />
          </div>
        </motion.div>
      </MotionContainer>

      {/* Outro gráfico exemplo: por tipo de serviço */}
      <MotionContainer className="mb-8">
        <motion.div>
          <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm mb-4">
            <h3 className="text-lg font-medium mb-4">Tipos de Serviço</h3>
            <AnimatedBarChart
              data={
                Object.entries(filteredServices.reduce((acc, cur) => {
                  const type = cur.serviceType || (cur as any).service_type || "outro";
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([type, count]) => ({
                  name: type.charAt(0).toUpperCase() + type.slice(1),
                  value: count,
                  color: type === "inspection" ? "#8b5cf6" : type === "installation" ? "#ec4899" : "#64748b"
                }))
              }
            />
          </div>
        </motion.div>
      </MotionContainer>
      
      {/* Desempenho por técnico (original poderia ser live/expandido em outro gráfico) */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg">Desempenho da Equipe</h2>
          <Link to="/equipe" className="text-sm text-primary">Ver equipe completa</Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtividade por Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {technicianProductivity.map(tech => (
                <div key={tech.id} className="flex items-center">
                  <TeamMemberAvatar
                    src={tech.avatar}
                    name={tech.name}
                    size="sm"
                    className="mr-3"
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{tech.name}</span>
                      <span>{tech.productivity}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${tech.productivity}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{tech.completed} concluídos</span>
                      <span>{tech.total} total</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Estatisticas;
