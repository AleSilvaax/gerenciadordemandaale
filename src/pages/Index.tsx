
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar
} from "lucide-react";
import { useConsolidatedServices } from "@/hooks/useConsolidatedServices";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function Index() {
  const { services, isLoading, statistics } = useConsolidatedServices();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const recentServices = services.slice(0, 6);

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

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>  
          <TabsTrigger value="recent">Recentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Resumo Executivo</CardTitle>
                <CardDescription>
                  Visão geral da performance atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Taxa de Conclusão</span>
                    <span className="font-bold text-green-600">
                      {statistics.completionRate}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Serviços Ativos</span>
                    <span className="font-bold">{statistics.pending}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alta Prioridade</span>
                    <span className="font-bold text-red-600">
                      {statistics.byPriority.high}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Serviço</CardTitle>
                <CardDescription>
                  Distribuição atual
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
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Recentes</CardTitle>
              <CardDescription>
                Últimos serviços cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentServices.map((service) => (
                  <ServiceCard 
                    key={service.id} 
                    service={service}
                  />
                ))}
              </div>
              
              {services.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum serviço encontrado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
