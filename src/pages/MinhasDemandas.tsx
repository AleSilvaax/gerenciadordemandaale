
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle 
} from "lucide-react";
import { useConsolidatedServices } from "@/hooks/useConsolidatedServices";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Link } from "react-router-dom";

export default function MinhasDemandas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { services, isLoading, getFilteredServices, statistics } = useConsolidatedServices();
  const { user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Filter services based on user role and active tab
  const getTabServices = (status?: string) => {
    let filtered = services;
    
    // If user is a technician, show only their assigned services
    if (user?.role === 'tecnico') {
      filtered = services.filter(service => service.technician?.id === user.id);
    }
    
    return getFilteredServices({
      status,
      search: searchTerm
    });
  };

  const allServices = getTabServices();
  const pendingServices = getTabServices('pendente');
  const completedServices = getTabServices('concluido');
  const overdueServices = services.filter(service => {
    if (service.status !== 'pendente' || !service.dueDate) return false;
    return new Date(service.dueDate) < new Date();
  });

  const renderServicesList = (servicesList: typeof services) => (
    <div className="space-y-4">
      {servicesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma demanda encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm 
                ? "Nenhuma demanda corresponde aos critérios de busca"
                : "Você ainda não possui demandas nesta categoria"
              }
            </p>
            {user?.role !== 'tecnico' && (
              <Button asChild>
                <Link to="/new-service">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Demanda
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servicesList.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.role === 'tecnico' ? 'Minhas Demandas' : 'Todas as Demandas'}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === 'tecnico' 
              ? 'Gerencie suas demandas atribuídas'
              : 'Visualize e gerencie todas as demandas do sistema'
            }
          </p>
        </div>
        {user?.role !== 'tecnico' && (
          <Button asChild>
            <Link to="/new-service">
              <Plus className="mr-2 h-4 w-4" />
              Nova Demanda
            </Link>
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allServices.length}</div>
            <p className="text-xs text-muted-foreground">
              +{statistics.total} no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingServices.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando execução
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedServices.length}</div>
            <p className="text-xs text-muted-foreground">
              Finalizadas com sucesso
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueServices.length}</div>
            <p className="text-xs text-muted-foreground">
              Passaram do prazo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar demandas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Services Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todas
            <Badge variant="secondary" className="ml-2">
              {allServices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes
            <Badge variant="secondary" className="ml-2">
              {pendingServices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas
            <Badge variant="secondary" className="ml-2">
              {completedServices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Atrasadas
            <Badge variant="destructive" className="ml-2">
              {overdueServices.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderServicesList(allServices)}
        </TabsContent>

        <TabsContent value="pending">
          {renderServicesList(pendingServices)}
        </TabsContent>

        <TabsContent value="completed">
          {renderServicesList(completedServices)}
        </TabsContent>

        <TabsContent value="overdue">
          {renderServicesList(overdueServices)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
