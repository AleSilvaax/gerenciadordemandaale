
import React, { useState, useEffect } from "react";
import { ArrowLeft, BellDot, BarChart2, Calendar, Filter, CalendarDays, MapPin, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine } from "@/components/ui-custom/ChartLine";
import { ChartCircle } from "@/components/ui-custom/ChartCircle";
import { getServices } from "@/services/api";
import { Service } from "@/types/serviceTypes";

interface ChartData {
  name: string;
  value: number;
}

const Estatisticas: React.FC = () => {
  const [activeMonth, setActiveMonth] = useState("Mai");
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [chartType, setChartType] = useState("time");
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<ChartData[]>([]);
  const [regionData, setRegionData] = useState<ChartData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<{name: string; color: string; services: number}[]>([]);
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
        
        // Generate Chart Data
        generateChartData(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServices();
  }, []);
  
  const generateChartData = (services: Service[]) => {
    // Generate monthly data
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthCounts = Array(12).fill(0);
    
    // Generate weekly data
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const dayCounts = Array(7).fill(0);
    
    // Service type counters
    const serviceTypes = new Map<string, number>();
    
    // Region counters
    const regions = new Map<string, number>();
    
    services.forEach(service => {
      if (service.date) {
        const date = new Date(service.date);
        // Count by month
        monthCounts[date.getMonth()]++;
        
        // Count by day of week
        dayCounts[date.getDay()]++;
      }
      
      // Count by service type
      const type = service.serviceType || "outros";
      serviceTypes.set(type, (serviceTypes.get(type) || 0) + 1);
      
      // Count by region/city
      const region = service.city || service.location || "outros";
      regions.set(region, (regions.get(region) || 0) + 1);
    });
    
    // Create chart data arrays
    const monthlyChartData = months.map((name, index) => ({
      name,
      value: monthCounts[index]
    }));
    
    const weeklyChartData = days.map((name, index) => ({
      name,
      value: dayCounts[index]
    }));
    
    const serviceTypeChartData = Array.from(serviceTypes.entries()).map(([name, value]) => ({
      name: name === "inspection" ? "Vistoria" : 
            name === "installation" ? "Instalação" : 
            name === "outros" ? "Outros" : name,
      value
    }));
    
    const regionChartData = Array.from(regions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) // Take top 6 regions
      .map(([name, value]) => ({
        name,
        value
      }));
    
    // Create team performance data
    const colors = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];
    
    const technicianPerformance = 
      services.reduce((performance, service) => {
        const techId = service.technician.id;
        const techName = service.technician.name;
        
        if (!performance[techId]) {
          performance[techId] = {
            id: techId,
            name: techName,
            services: 0,
            color: ""
          };
        }
        
        performance[techId].services++;
        return performance;
      }, {} as Record<string, {id: string; name: string; services: number; color: string}>);
    
    const teamData = Object.values(technicianPerformance)
      .sort((a, b) => b.services - a.services)
      .map((tech, index) => ({
        ...tech,
        color: colors[index % colors.length]
      }));
    
    setMonthlyData(monthlyChartData);
    setWeeklyData(weeklyChartData);
    setServiceTypeData(serviceTypeChartData);
    setRegionData(regionChartData);
    setTeamPerformance(teamData);
  };
  
  // Get the appropriate data based on the selected filters
  const getChartData = () => {
    if (chartType === "time") {
      return timeFilter === "monthly" ? monthlyData : weeklyData;
    } else if (chartType === "type") {
      return serviceTypeData;
    } else if (chartType === "region") {
      return regionData;
    }
    return monthlyData;
  };
  
  // Handle report export
  const handleExportReport = (format: 'pdf' | 'excel') => {
    const message = format === 'pdf' ? 'Exportando estatísticas em PDF...' : 'Exportando estatísticas em Excel...';
    alert(message); // Replace with actual export functionality
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
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
      
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-2">
        <Button 
          variant={chartType === "time" ? "default" : "outline"}
          size="sm" 
          className="rounded-full flex-shrink-0"
          onClick={() => setChartType("time")}
        >
          <Calendar size={16} className="mr-2" />
          Tempo
        </Button>
        <Button 
          variant={chartType === "type" ? "default" : "outline"}
          size="sm" 
          className="rounded-full flex-shrink-0"
          onClick={() => setChartType("type")}
        >
          <BarChart2 size={16} className="mr-2" />
          Tipo
        </Button>
        <Button 
          variant={chartType === "region" ? "default" : "outline"}
          size="sm" 
          className="rounded-full flex-shrink-0"
          onClick={() => setChartType("region")}
        >
          <MapPin size={16} className="mr-2" />
          Região
        </Button>
      </div>
      
      {chartType === "time" && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm text-muted-foreground">Período</h3>
          <Select
            value={timeFilter}
            onValueChange={(value) => setTimeFilter(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="mt-2">
        <h2 className="text-lg text-muted-foreground">
          {chartType === "time" 
            ? `Atendimento de chamados ${timeFilter === "monthly" ? "mensais" : "semanais"}`
            : chartType === "type" 
              ? "Distribuição por tipo de serviço"
              : "Distribuição por região"}
        </h2>
        <div className="text-2xl font-bold">
          {chartType === "time" 
            ? `${services.length} demandas`
            : chartType === "type"
              ? "Serviços realizados"
              : "Distribuição geográfica"}
        </div>
        
        <ChartLine data={getChartData()} activeMonth={activeMonth} />
        
        {chartType === "time" && timeFilter === "monthly" && (
          <div className="flex justify-between mt-2 overflow-x-auto scrollbar-none pb-1">
            {monthlyData.map(month => (
              <button
                key={month.name}
                className={`px-2 py-1 rounded-full text-sm transition-all ${
                  activeMonth === month.name 
                    ? "bg-primary text-white" 
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveMonth(month.name)}
              >
                {month.name}
              </button>
            ))}
          </div>
        )}
        
        {chartType === "time" && timeFilter === "weekly" && (
          <div className="flex justify-between mt-2">
            {weeklyData.map(day => (
              <button
                key={day.name}
                className={`px-2 py-1 rounded-full text-sm text-muted-foreground`}
              >
                {day.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-lg">Acompanhamento da equipe</h2>
          <button className="text-sm text-primary">Mais detalhes</button>
        </div>
        
        <Tabs defaultValue="performance" className="mt-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance">
            <div className="flex justify-center mt-4">
              <ChartCircle 
                value={services.filter(s => s.status === "concluido").length / Math.max(services.length, 1) * 100} 
                size={160} 
              />
            </div>
            
            <div className="mt-6 space-y-2">
              {teamPerformance.map((member, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: member.color }}
                    />
                    <span>{member.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {member.services} serviços
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="productivity">
            <div className="grid grid-cols-2 gap-4">
              {teamPerformance.map((member, index) => {
                // Calculate productivity percentage based on completed services vs assigned
                const memberServices = services.filter(s => s.technician.id === member.id);
                const completedServices = memberServices.filter(s => s.status === "concluido");
                const productivityPercentage = memberServices.length > 0 
                  ? (completedServices.length / memberServices.length) * 100 
                  : 0;
                
                // Calculate average completion time in days
                const completionTimes = completedServices
                  .filter(s => s.date) // Only services with date
                  .map(s => {
                    const startDate = new Date(s.date!);
                    const endDate = new Date(); // Assume completed today if no completion date
                    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert ms to days
                  });
                
                const avgCompletionTime = completionTimes.length > 0
                  ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
                  : 0;
                
                return (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg glass-card flex flex-col items-center"
                  >
                    <div 
                      className="w-full h-1 mb-4 rounded-full"
                      style={{ backgroundColor: member.color }}
                    />
                    <h3 className="text-sm font-medium">{member.name}</h3>
                    <div className="text-xl font-bold mt-2">
                      {Math.round(productivityPercentage)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(avgCompletionTime)} dias de média
                    </p>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Estatisticas;
