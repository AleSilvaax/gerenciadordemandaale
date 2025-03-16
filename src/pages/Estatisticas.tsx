
import React, { useState } from "react";
import { ArrowLeft, BellDot, BarChart2, Calendar, Filter, CalendarDays, MapPin } from "lucide-react";
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
import { 
  monthlyData, 
  teamPerformance, 
  weeklyData, 
  serviceTypeData, 
  regionData 
} from "@/data/mockData";

const Estatisticas: React.FC = () => {
  const [activeMonth, setActiveMonth] = useState("Mai");
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [chartType, setChartType] = useState("time");
  
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
        <button className="flex items-center text-sm text-primary">
          <Filter size={16} className="mr-1" />
          Filtros
        </button>
      </div>
      
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
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
            ? `${timeFilter === "monthly" ? "74" : "54"} instalações`
            : chartType === "type"
              ? "Serviços realizados"
              : "Distribuição geográfica"}
        </div>
        
        <ChartLine data={getChartData()} activeMonth={activeMonth} />
        
        {chartType === "time" && timeFilter === "monthly" && (
          <div className="flex justify-between mt-2">
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
              <ChartCircle value={55} size={160} />
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
                    {Math.floor(Math.random() * 30) + 5} serviços
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="productivity">
            <div className="grid grid-cols-2 gap-4">
              {teamPerformance.map((member, index) => (
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
                    {Math.floor(Math.random() * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor(Math.random() * 10) + 1} dias de média
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Estatisticas;
