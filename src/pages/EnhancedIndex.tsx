import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditedServices } from "@/hooks/useAuditedServices";
import { CalendarDays, CheckCircle, Clock, Users } from "lucide-react";

export default function EnhancedIndex() {
  const { services, isLoading } = useAuditedServices();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.client?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: services.length,
    pending: services.filter(s => s.status === 'pendente').length,
    completed: services.filter(s => s.status === 'concluido').length,
    highPriority: services.filter(s => s.priority === 'alta' || s.priority === 'urgente').length
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Avançado</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Demandas"
          value={stats.total}
          description="Todas as demandas no sistema"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          title="Pendentes"
          value={stats.pending}
          description="Aguardando atendimento"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Concluídas"
          value={stats.completed}
          description="Finalizadas com sucesso"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Alta Prioridade"
          value={stats.highPriority}
          description="Demandam atenção urgente"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recentes</TabsTrigger>
          <TabsTrigger value="priority">Alta Prioridade</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Demandas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredServices.slice(0, 5).map((service) => (
                  <ServiceCard 
                    key={service.id} 
                    service={service}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority">
          <Card>
            <CardHeader>
              <CardTitle>Alta Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services
                  .filter(s => s.priority === 'alta' || s.priority === 'urgente')
                  .slice(0, 5)
                  .map((service) => (
                    <ServiceCard 
                      key={service.id} 
                      service={service}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Demandas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services
                  .filter(s => s.status === 'pendente')
                  .slice(0, 5)
                  .map((service) => (
                    <ServiceCard 
                      key={service.id} 
                      service={service}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
