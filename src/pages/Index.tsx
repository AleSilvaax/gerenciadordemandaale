
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, BarChart2, Users, Settings } from "lucide-react";
import { getServices } from "@/services/api";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/ui-custom/StatCard";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const services = getServices();
  
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
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="container py-4 space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Button onClick={() => navigate("/nova-demanda")}>Nova demanda</Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Demandas Pendentes"
          value={pendingServices}
          icon={<FileText className="h-5 w-5" />}
          description="Total de demandas aguardando conclusão"
          className="border-yellow-600/20 bg-gradient-to-br from-yellow-900/10 to-yellow-700/10"
        />
        
        <StatCard
          title="Demandas Concluídas"
          value={completedServices}
          icon={<BarChart2 className="h-5 w-5" />}
          description="Total de demandas finalizadas"
          className="border-green-600/20 bg-gradient-to-br from-green-900/10 to-green-700/10"
        />
        
        <StatCard
          title="Técnicos"
          value={technicians}
          icon={<Users className="h-5 w-5" />}
          description="Total de técnicos ativos"
          className="border-blue-600/20 bg-gradient-to-br from-blue-900/10 to-blue-700/10"
        />
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
          {recentServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
      
      <div className="space-y-4 mt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Opções do sistema</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/demandas")}>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Demandas</h3>
                <p className="text-sm text-muted-foreground">Gerenciar demandas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/estatisticas")}>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/20">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Estatísticas</h3>
                <p className="text-sm text-muted-foreground">Visualizar relatórios</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/equipe")}>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Equipe</h3>
                <p className="text-sm text-muted-foreground">Gerenciar técnicos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/settings")}>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Configurações</h3>
                <p className="text-sm text-muted-foreground">Configurar campos personalizados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
