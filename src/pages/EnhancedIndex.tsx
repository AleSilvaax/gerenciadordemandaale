import React, { useState, useEffect } from "react";
import { Plus, Settings, Search, Filter, Calendar, ChevronRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/types/serviceTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { AdvancedSearch, SearchFilters } from "@/components/search/AdvancedSearch";
import { RealtimeMetrics } from "@/components/dashboard/RealtimeMetrics";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useAuditedServices } from "@/hooks/useAuditedServices";
import { OptimizedImage } from "@/components/common/OptimizedImage";

const EnhancedIndex: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: 'all',
    priority: 'all',
    serviceType: 'all',
    client: '',
    location: '',
    dateFrom: null,
    dateTo: null,
    technician: 'all'
  });
  
  const { isConnected } = useRealtimeNotifications();
  
  const {
    services,
    isLoading,
    error,
    isStale,
    refresh
  } = useAuditedServices();

  const applyFilters = (services: Service[]): Service[] => {
    return services.filter(service => {
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          service.title.toLowerCase().includes(searchLower) ||
          service.client?.toLowerCase().includes(searchLower) ||
          service.location.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      if (filters.status !== 'all' && service.status !== filters.status) {
        return false;
      }

      if (filters.priority !== 'all' && service.priority !== filters.priority) {
        return false;
      }

      if (filters.serviceType !== 'all' && service.serviceType !== filters.serviceType) {
        return false;
      }

      if (filters.client && !service.client?.toLowerCase().includes(filters.client.toLowerCase())) {
        return false;
      }

      if (filters.location) {
        const locationMatch = 
          service.location.toLowerCase().includes(filters.location.toLowerCase()) ||
          service.city?.toLowerCase().includes(filters.location.toLowerCase());
        
        if (!locationMatch) return false;
      }

      if (filters.dateFrom || filters.dateTo) {
        const serviceDate = new Date(service.creationDate || service.date || new Date());
        
        if (filters.dateFrom && serviceDate < filters.dateFrom) return false;
        if (filters.dateTo && serviceDate > filters.dateTo) return false;
      }

      return true;
    });
  };

  const filteredServices = applyFilters(services);
  const recentServices = filteredServices.slice(0, 3);

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      priority: 'all',
      serviceType: 'all',
      client: '',
      location: '',
      dateFrom: null,
      dateTo: null,
      technician: 'all'
    });
  };

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

  const showStaleIndicator = isStale && services.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <motion.div
        className="container mx-auto p-2 sm:p-4 pb-24 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent text-left-force">
                Dashboard
              </h1>
              {isConnected && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  ● Tempo Real
                </Badge>
              )}
              {showStaleIndicator && (
                <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                  Atualizando...
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 text-left-force">
              Bem-vindo ao sistema de gerenciamento
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              disabled={isLoading}
              className="card-enhanced"
            >
              <Settings className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">
                {isLoading ? 'Atualizando...' : 'Atualizar'}
              </span>
            </Button>
            
            <Link to="/configuracoes">
              <Button variant="outline" size="sm" className="card-enhanced">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Configurações</span>
              </Button>
            </Link>
            
            {/* O BOTÃO "NOVA DEMANDA" FOI REMOVIDO DESTA SEÇÃO 
            */}
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants}>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Erro ao carregar dados: {error.message}</span>
                  <Button variant="outline" size="sm" onClick={refresh}>
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <RealtimeMetrics />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdvancedSearch
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            className="w-full max-w-full !px-0"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card/60 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="overview" className="text-sm">Visão Geral</TabsTrigger>
              <TabsTrigger value="recent" className="text-sm">
                Recentes 
                {filteredServices.length !== services.length && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filteredServices.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="quick-actions" className="text-sm">Ações Rápidas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="card-enhanced hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-left-force">
                      <Calendar className="h-5 w-5 text-primary" />
                      Agenda Hoje
                    </CardTitle>
                    <CardDescription className="text-left-force">Demandas agendadas para hoje</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary text-left-force">
                      {services.filter(s => s.status === 'pendente').length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-left-force">demandas pendentes</p>
                  </CardContent>
                </Card>

                <Card className="card-enhanced hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-left-force">
                      <Filter className="h-5 w-5 text-primary" />
                      Em Andamento
                    </CardTitle>
                    <CardDescription className="text-left-force">Serviços sendo executados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600 text-left-force">
                      {services.filter(s => s.status === 'pendente').length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-left-force">em progresso</p>
                  </CardContent>
                </Card>

                <Card className="card-enhanced hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-left-force">
                      <ChevronRight className="h-5 w-5 text-primary" />
                      Concluídas
                    </CardTitle>
                    <CardDescription className="text-left-force">Demandas finalizadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 text-left-force">
                      {services.filter(s => s.status === 'concluido').length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-left-force">finalizadas</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-6">
              <Card className="card-enhanced">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-left-force">
                      Demandas {filteredServices.length !== services.length ? 'Filtradas' : 'Recentes'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Link to="/demandas">
                        <Button variant="outline" size="sm" className="text-sm">
                          Ver Todas ({services.length})
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentServices.length > 0 ? (
                    <div className="space-y-3">
                      {recentServices.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ServiceCard service={service} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-left-force">
                        {filters.searchTerm || filters.status !== 'all' || filters.priority !== 'all'
                          ? 'Nenhuma demanda encontrada com os filtros aplicados'
                          : 'Nenhuma demanda encontrada'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quick-actions" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* O CARD "NOVA DEMANDA" FOI REMOVIDO DESTA SEÇÃO TAMBÉM */}

                <Card className="card-enhanced hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <Link to="/demandas" className="block">
                    <CardContent className="p-8 text-center">
                      <Search className="h-10 w-10 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                      <h3 className="font-semibold mb-2 text-left-force">Ver Demandas</h3>
                      <p className="text-sm text-muted-foreground text-left-force">Visualizar todas as demandas</p>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="card-enhanced hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <Link to="/configuracoes" className="block">
                    <CardContent className="p-8 text-center">
                      <Settings className="h-10 w-10 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                      <h3 className="font-semibold mb-2 text-left-force">Configurações</h3>
                      <p className="text-sm text-muted-foreground text-left-force">Configurar sistema e equipe</p>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EnhancedIndex;
