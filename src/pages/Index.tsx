
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, BarChart2, Users, Download } from "lucide-react";
import { getServices } from "@/services/api";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/ui-custom/StatCard";
import { Service } from "@/types/serviceTypes";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { getTeamMembers } from "@/services/api";
import { TeamMember } from "@/types/serviceTypes";
import { useIsMobile } from "@/hooks/use-mobile";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const servicesData = await getServices();
        const teamData = await getTeamMembers();
        setServices(servicesData);
        setTeamMembers(teamData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate statistics
  const pendingServices = services.filter(
    (service) => service.status === "pendente"
  ).length;
  
  const completedServices = services.filter(
    (service) => service.status === "concluido"
  ).length;
  
  const technicians = [...new Set(services.map((service) => service.technician.id))].length;
  
  // Get 3 most recent services
  const recentServices = [...services]
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  // Handle report export (placeholder)
  const handleExportReport = (format: 'pdf' | 'excel') => {
    const message = format === 'pdf' ? 'Exportando relatório em PDF...' : 'Exportando relatório em Excel...';
    alert(message); // Replace with actual export functionality
  };

  return (
    <div className="container py-4 space-y-6 pb-24">
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Button onClick={() => navigate("/nova-demanda")}>Nova demanda</Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Demandas Pendentes"
          value={pendingServices}
          icon={<FileText className="h-5 w-5" />}
          description="Total de demandas aguardando conclusão"
          className="border-yellow-600/20 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20"
        />
        
        <StatCard
          title="Demandas Concluídas"
          value={completedServices}
          icon={<BarChart2 className="h-5 w-5" />}
          description="Total de demandas finalizadas"
          className="border-green-600/20 bg-gradient-to-br from-green-500/20 to-green-600/20"
        />
        
        <StatCard
          title="Técnicos"
          value={technicians}
          icon={<Users className="h-5 w-5" />}
          description="Total de técnicos ativos"
          className="border-blue-600/20 bg-gradient-to-br from-blue-500/20 to-blue-600/20"
        />
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Exportar Relatórios</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleExportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      <Separator className="my-6" />

      {/* Equipe section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Equipe</h2>
          <Button variant="outline" onClick={() => navigate("/equipe")}>
            Ver todos
          </Button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {teamMembers.slice(0, 5).map((member) => (
            <div 
              key={member.id} 
              className="flex flex-col items-center p-2 min-w-[100px] text-center"
              onClick={() => navigate(`/equipe#${member.id}`)}
            >
              <TeamMemberAvatar 
                src={member.avatar} 
                name={member.name} 
                size="lg"
                className="mb-2 cursor-pointer hover:scale-105 transition-transform"
              />
              <span className="text-sm font-medium line-clamp-1">{member.name}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">{member.role || 'Técnico'}</span>
            </div>
          ))}
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Demandas Recentes</h2>
          <Button variant="outline" onClick={() => navigate("/demandas")}>
            Ver todas
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <p>Carregando demandas...</p>
          ) : recentServices.length > 0 ? (
            recentServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
          ) : (
            <p>Nenhuma demanda encontrada.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
