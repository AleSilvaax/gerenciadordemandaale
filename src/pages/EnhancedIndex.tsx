
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  BarChart3
} from "lucide-react";
import { useConsolidatedServices } from "@/hooks/useConsolidatedServices";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function EnhancedIndex() {
  const { services, isLoading, statistics } = useConsolidatedServices();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const recentServices = services.slice(0, 5);
  const urgentServices = services.filter(s => s.priority === 'alta' && s.status === 'pendente');

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Calendar className="mr-2 h-4 w-4" />
            Hoje
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Serviços"
          value={statistics.total}
          description="Serviços cadastrados"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Concluídos"
          value={statistics.completed}
          description="Serviços finalizados"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Pendentes"
          value={statistics.pending}
          description="Aguardando execução"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Em Atraso"
          value={statistics.overdue}
          description="Serviços atrasados"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="urgent">Urgentes</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Serviços Recentes</CardTitle>
                <CardDescription>
                  Últimos 5 serviços cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentServices.map((service) => (
                    <ServiceCard 
                      key={service.id} 
                      service={service}
                      compact={true}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Estatísticas Rápidas</CardTitle>
                <CardDescription>
                  Resumo da performance atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Taxa de Conclusão</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {statistics.completionRate}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Técnicos Ativos</span>
                    </div>
                    <span className="font-bold">8</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Média Diária</span>
                    </div>
                    <span className="font-bold">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="urgent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Serviços Urgentes
              </CardTitle>
              <CardDescription>
                Serviços com alta prioridade que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {urgentServices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum serviço urgente no momento
                  </p>
                ) : (
                  urgentServices.map((service) => (
                    <ServiceCard 
                      key={service.id} 
                      service={service}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Serviços por Tipo</CardTitle>
                <CardDescription>
                  Distribuição dos tipos de serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Prioridade</CardTitle>
                <CardDescription>
                  Prioridades dos serviços ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alta Prioridade</span>
                    <Badge variant="destructive">{statistics.byPriority.high}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Média Prioridade</span>
                    <Badge variant="outline">{statistics.byPriority.medium}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Baixa Prioridade</span>
                    <Badge variant="secondary">{statistics.byPriority.low}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
