
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, BarChart2, Users, Download, Calendar, AlertTriangle, TrendingUp, Clock, CheckCircle } from "lucide-react";
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
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { user, hasPermission, canAccessRoute } = useAuth();

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
      return;
    }

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
  
  const overdueServices = services.filter(service => {
    if (service.status !== "pendente" || !service.dueDate) return false;
    return new Date(service.dueDate) < new Date();
  }).length;
  
  const recentServices = [...services]
    .sort((a, b) => {
      const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
      const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);
  
  const upcomingDueServices = user && user.role === 'tecnico'
    ? services
        .filter(service => 
          service.status === 'pendente' && 
          service.dueDate && 
          new Date(service.dueDate) >= new Date() &&
          new Date(service.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
        .sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateA - dateB;
        })
    : [];

  const handleExportReport = (format: 'pdf' | 'excel') => {
    const message = format === 'pdf' ? 'Exportando relatório em PDF...' : 'Exportando relatório em Excel...';
    toast(message);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Sistema de Gestão de Demandas
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">Faça login para acessar o sistema</p>
          <Button onClick={() => navigate("/login")} size="lg" className="px-8">
            Fazer Login
          </Button>
        </motion.div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'}`}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Olá, {user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Bem-vindo de volta ao seu painel de controle
            </p>
          </div>
          
          {canAccessRoute && canAccessRoute('/nova-demanda') && (
            <Button onClick={() => navigate("/nova-demanda")} size="lg" className="px-8">
              <FileText className="mr-2 h-5 w-5" />
              Nova Demanda
            </Button>
          )}
        </motion.div>
        
        {/* Stats Cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <StatCard
              title="Demandas Pendentes"
              value={pendingServices}
              icon={<Clock className="h-6 w-6" />}
              description="Aguardando conclusão"
              className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/20 hover:border-amber-500/30"
            />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <StatCard
              title="Demandas Concluídas"
              value={completedServices}
              icon={<CheckCircle className="h-6 w-6" />}
              description="Finalizadas com sucesso"
              className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20 hover:border-green-500/30"
            />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <StatCard
              title="Técnicos Ativos"
              value={technicians}
              icon={<Users className="h-6 w-6" />}
              description="Membros da equipe"
              className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20 hover:border-blue-500/30"
            />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <StatCard
              title="Demandas Atrasadas"
              value={overdueServices}
              icon={<AlertTriangle className="h-6 w-6" />}
              description="Prazo vencido"
              className="bg-gradient-to-br from-red-500/10 to-pink-600/10 border-red-500/20 hover:border-red-500/30"
            />
          </motion.div>
        </motion.div>
        
        {/* Export Reports Section */}
        {hasPermission('view_stats') && (
          <motion.div 
            variants={itemVariants}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Exportar Relatórios</h2>
                <p className="text-muted-foreground">Gere relatórios detalhados das demandas</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExportReport('excel')}
                  className="bg-background/50 hover:bg-background/80"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExportReport('pdf')}
                  className="bg-background/50 hover:bg-background/80"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Technician upcoming deadlines section */}
        {user?.role === 'tecnico' && upcomingDueServices.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Calendar className="mr-3 h-6 w-6 text-primary" />
                    Prazos Próximos
                  </h2>
                  <p className="text-muted-foreground mt-1">Demandas com vencimento nos próximos 7 dias</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingDueServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ServiceCard service={service} compact={true} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Team Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Nossa Equipe</h2>
                <p className="text-muted-foreground mt-1">Membros ativos da equipe</p>
              </div>
              {hasPermission('manage_team') && (
                <Button variant="outline" onClick={() => navigate("/equipe")} className="bg-background/50">
                  Ver todos
                </Button>
              )}
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {teamMembers.slice(0, 5).map((member, index) => (
                <motion.div 
                  key={member.id} 
                  className="flex flex-col items-center p-4 min-w-[120px] text-center rounded-xl bg-background/30 border border-border/30 hover:bg-background/50 transition-all duration-200 cursor-pointer group"
                  onClick={() => hasPermission('manage_team') && navigate(`/equipe#${member.id}`)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <TeamMemberAvatar 
                    src={member.avatar} 
                    name={member.name} 
                    size="lg"
                    className="mb-3 ring-2 ring-border/20 group-hover:ring-primary/30 transition-all duration-200"
                  />
                  <span className="text-sm font-medium line-clamp-1">{member.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {member.role === 'tecnico' ? 'Técnico' : member.role === 'administrador' ? 'Administrador' : 'Gestor'}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Recent Services */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Demandas Recentes</h2>
                <p className="text-muted-foreground mt-1">Últimas demandas criadas</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/demandas")} className="bg-background/50">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver todas
              </Button>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentServices.length > 0 ? (
                recentServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ServiceCard service={service} />
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma demanda encontrada</h3>
                  <p className="text-muted-foreground">Crie sua primeira demanda para começar</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
