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
        return service.date && new Date(service.date) >= cutoffDate;
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
  
  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Estatísticas</h1>
        <button className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10">
          <BellDot size={18} />
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg">Visualização de dados</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportReport('excel')}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportReport('pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      {/* Filter section */}
      <div className="mb-6 bg-card rounded-lg border border-white/10 p-4">
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
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">Total de Demandas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.completedServices}</div>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-500">{stats.pendingServices}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Atrasadas</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <StatisticsCards 
        services={filteredServices} 
        teamMembers={teamMembers}
        className="mb-6" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Completion Rate */}
        <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-4">Taxa de Conclusão</h3>
          <div className="flex flex-col items-center">
            <ChartCircle 
              value={stats.completionRate} 
              size={160} 
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">Tempo médio de conclusão</p>
              <div className="text-2xl font-bold">{stats.avgCompletionTime} dias</div>
            </div>
          </div>
        </div>
        
        {/* Priority Distribution */}
        <div className="bg-card rounded-xl border border-white/10 p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-4">Distribuição por Prioridade</h3>
          <div className="space-y-4">
            {/* Baixa priority */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  Baixa
                </span>
                <span>{stats.priorities.baixa}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalServices > 0 ? (stats.priorities.baixa / stats.totalServices * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            {/* Media priority */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                  Média
                </span>
                <span>{stats.priorities.media}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalServices > 0 ? (stats.priorities.media / stats.totalServices * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            {/* Alta priority */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                  Alta
                </span>
                <span>{stats.priorities.alta}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalServices > 0 ? (stats.priorities.alta / stats.totalServices * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            {/* Urgente priority */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  Urgente
                </span>
                <span>{stats.priorities.urgente}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${stats.totalServices > 0 ? (stats.priorities.urgente / stats.totalServices * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
