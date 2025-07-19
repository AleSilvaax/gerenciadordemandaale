
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { StatisticsCards } from "@/components/ui-custom/StatisticsCards";
import { useAuditedServices } from "@/hooks/useAuditedServices";
import { Plus, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";

export default function Demandas() {
  const { services, isLoading } = useAuditedServices();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.client?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || service.status === statusFilter;
    const matchesPriority = priorityFilter === "todas" || service.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: services.length,
    pending: services.filter(s => s.status === 'pendente').length,
    inProgress: services.filter(s => s.status === 'em_andamento').length,
    completed: services.filter(s => s.status === 'concluido').length,
    highPriority: services.filter(s => s.priority === 'alta' || s.priority === 'urgente').length,
    completionRate: services.length > 0 ? Math.round((services.filter(s => s.status === 'concluido').length / services.length) * 100) : 0
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando demandas...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciar Demandas</h1>
        <Link to="/nova-demanda">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Demanda
          </Button>
        </Link>
      </div>

      <StatisticsCards 
        data={{
          totalServices: stats.total,
          completedServices: stats.completed,
          pendingServices: stats.pending,
          overdue: 0,
          activeUsers: 0
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar demandas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("todos");
                setPriorityFilter("todas");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "todos" || priorityFilter !== "todas"
                  ? "Nenhuma demanda encontrada com os filtros aplicados."
                  : "Nenhuma demanda cadastrada ainda."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
