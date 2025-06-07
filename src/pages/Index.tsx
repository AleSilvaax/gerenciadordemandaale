
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui-custom/StatCard";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { ChartCircle } from "@/components/ui-custom/ChartCircle";
import { ChartLine } from "@/components/ui-custom/ChartLine";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  MapPin,
  Plus,
  Database
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services/api/serviceApi";
import { getTeamMembers } from "@/services/api/teamApi";
import { getServiceStats } from "@/services/database/statsService";
import { createSampleData } from "@/services/sampleDataService";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Index: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [creatingData, setCreatingData] = useState(false);

  // Queries para carregar dados
  const { data: services = [], isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices(),
    enabled: !!user
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: getTeamMembers,
    enabled: !!user
  });

  const { data: stats = { total: 0, completed: 0, pending: 0, cancelled: 0 } } = useQuery({
    queryKey: ['serviceStats'],
    queryFn: () => getServiceStats(),
    enabled: !!user
  });

  // Calcular métricas
  const recentServices = services.slice(0, 3);
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  
  // Dados para o gráfico de linha (últimos 6 meses)
  const monthlyData = [
    { name: "Jul", value: 12 },
    { name: "Ago", value: 19 },
    { name: "Set", value: 15 },
    { name: "Out", value: 27 },
    { name: "Nov", value: 23 },
    { name: "Dez", value: stats.total || 31 }
  ];

  // Função para criar dados de exemplo
  const handleCreateSampleData = async () => {
    setCreatingData(true);
    try {
      const success = await createSampleData();
      if (success) {
        // Recarregar os dados
        refetchServices();
      }
    } catch (error) {
      console.error('Erro ao criar dados de exemplo:', error);
    } finally {
      setCreatingData(false);
    }
  };

  if (servicesLoading || teamLoading) {
    return (
      <div className="container mx-auto p-4 pb-24">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta, {user?.name || 'Usuário'}
          </p>
        </div>
        <div className="flex gap-2">
          {services.length === 0 && (
            <Button 
              onClick={handleCreateSampleData} 
              variant="outline"
              disabled={creatingData}
              className="flex items-center gap-2"
            >
              <Database size={20} />
              {creatingData ? 'Criando...' : 'Criar Dados de Exemplo'}
            </Button>
          )}
          <Button onClick={() => navigate('/nova-demanda')} className="flex items-center gap-2">
            <Plus size={20} />
            Nova Demanda
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Demandas"
          value={stats.total.toString()}
          icon={<Wrench className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Concluídas"
          value={stats.completed.toString()}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Pendentes"
          value={stats.pending.toString()}
          icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Equipe"
          value={teamMembers.length.toString()}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Gráficos e Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Conclusão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartCircle value={completionRate} />
          </CardContent>
        </Card>

        {/* Atividade Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2" size={20} />
              Atividade Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartLine data={monthlyData} activeMonth="Dez" />
          </CardContent>
        </Card>

        {/* Equipe Ativa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2" size={20} />
              Equipe Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.length > 0 ? (
                <>
                  {teamMembers.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  ))}
                  {teamMembers.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{teamMembers.length - 4} outros membros
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Nenhum membro de equipe encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demandas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2" size={20} />
            Demandas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentServices.map((service) => (
                <ServiceCard 
                  key={service.id} 
                  service={service}
                  onClick={() => navigate(`/demandas/${service.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhuma demanda encontrada</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/nova-demanda')}>
                  Criar primeira demanda
                </Button>
                <Button onClick={handleCreateSampleData} variant="outline" disabled={creatingData}>
                  {creatingData ? 'Criando...' : 'Dados de exemplo'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
