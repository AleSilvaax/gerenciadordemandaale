import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, BarChart2, Users, Download, Calendar, AlertTriangle } from "lucide-react";
import { getServices, getTeamMembers } from "@/services/servicesDataService";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/ui-custom/StatCard";
import { Service } from "@/types/serviceTypes";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { TeamMember } from "@/types/serviceTypes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useTechnicianServices } from "@/hooks/useTechnicianServices";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { user, hasPermission, canAccessRoute } = useAuth();

  // Novo: useTechnicianServices
  const { data: technicianServices, isLoading: techLoading, error: techError } = useTechnicianServices();

  useEffect(() => {
    if (user?.role === "tecnico") {
      setIsLoading(techLoading);
      if (techError) {
        toast.error("Erro ao carregar demandas do técnico");
        setServices([]);
      } else if (technicianServices) {
        setServices(technicianServices);
      }
      // Não chama fetchData
      return;
    }

    // Para admin/gestor continua o fetch padrão
    const fetchData = async () => {
      try {
        console.log('Fetching dashboard data...');
        const [servicesData, teamData] = await Promise.all([
          getServices(),
          getTeamMembers()
        ]);
        console.log('Dashboard data loaded:', { services: servicesData.length, team: teamData.length });
        setServices(servicesData);
        setTeamMembers(teamData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user, technicianServices, techLoading, techError]);
  
  // Calculate statistics
  const pendingServices = services.filter(
    (service) => service.status === "pendente"
  ).length;
  
  const completedServices = services.filter(
    (service) => service.status === "concluido"
  ).length;
  
  const technicians = [...new Set(services.map((service) => service.technician.id))].length;
  
  // Get overdue services
  const overdueServices = services.filter(service => {
    if (service.status !== "pendente" || !service.dueDate) return false;
    return new Date(service.dueDate) < new Date();
  }).length;
  
  // Get 3 most recent services
  const recentServices = [...services]
    .sort((a, b) => {
      const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
      const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  // Remover definição duplicada de technicianServices aqui!
  // const technicianServices = user && user.role === 'tecnico'
  //   ? services.filter(service => service.technician.id === user.id)
  //   : [];
  
  const upcomingDueServices = user && user.role === 'tecnico'
    ? services
        .filter(service => 
          service.status === 'pendente' && 
          service.dueDate && 
          new Date(service.dueDate) >= new Date() &&
          new Date(service.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        )
        .sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateA - dateB;
        })
    : [];

  // Handle report export (placeholder)
  const handleExportReport = (format: 'pdf' | 'excel') => {
    const message = format === 'pdf' ? 'Exportando relatório em PDF...' : 'Exportando relatório em Excel...';
    toast(message);
  };

  if (!user) {
    return (
      <div className="container py-4 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Sistema de Gestão de Demandas</h1>
          <p className="text-muted-foreground mb-6">Faça login para acessar o sistema</p>
          <Button onClick={() => navigate("/login")}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 space-y-6 pb-24">
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user.name.split(' ')[0]}!
        </h1>
        
        {canAccessRoute && canAccessRoute('/nova-demanda') && (
          <Button onClick={() => navigate("/nova-demanda")}>Nova demanda</Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
        
        <StatCard
          title="Demandas Atrasadas"
          value={overdueServices}
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Demandas com prazo vencido"
          className="border-red-600/20 bg-gradient-to-br from-red-500/20 to-red-600/20"
        />
      </div>
      
      {hasPermission('view_stats') && (
        <>
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
        </>
      )}
      
      {/* Technician upcoming deadlines section */}
      {user?.role === 'tecnico' && upcomingDueServices.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Prazos Próximos
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingDueServices.map((service) => (
              <ServiceCard key={service.id} service={service} compact={true} />
            ))}
          </div>
          
          <Separator className="my-6" />
        </div>
      )}

      {/* Equipe section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Equipe</h2>
          {hasPermission('manage_team') && (
            <Button variant="outline" onClick={() => navigate("/equipe")}>
              Ver todos
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {teamMembers.slice(0, 5).map((member) => (
            <div 
              key={member.id} 
              className="flex flex-col items-center p-2 min-w-[100px] text-center"
              onClick={() => hasPermission('manage_team') && navigate(`/equipe#${member.id}`)}
            >
              <TeamMemberAvatar 
                src={member.avatar} 
                name={member.name} 
                size="lg"
                className={`mb-2 ${hasPermission('manage_team') ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
              />
              <span className="text-sm font-medium line-clamp-1">{member.name}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">
                {member.role === 'tecnico' ? 'Técnico' : member.role === 'administrador' ? 'Administrador' : 'Gestor'}
              </span>
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
