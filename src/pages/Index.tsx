import React, { useState, useEffect } from "react";
import { Settings, Search, Filter, Calendar, ChevronRight, TrendingUp, Users, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { CompactServiceCard } from "@/components/ui-custom/CompactServiceCard";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getServices } from "@/services/servicesDataService";
import { Service } from "@/types/serviceTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { AdvancedSearch, SearchFilters } from "@/components/search/AdvancedSearch";
import { RealtimeMetrics } from "@/components/dashboard/RealtimeMetrics";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const Index: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
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

  // Ativar notificações em tempo real
  const { isConnected } = useRealtimeNotifications();

  useEffect(() => {
    const loadServices = async () => {
      try {
        const fetchedServices = await getServices();
        setServices(fetchedServices);
      } catch (error) {
        console.error("Error loading services:", error);
      }
    };

    loadServices();
  }, []);

  const applyFilters = (services: Service[]): Service[] => {
    return services.filter(service => {
      // Filtro de texto geral
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          service.title.toLowerCase().includes(searchLower) ||
          service.client?.toLowerCase().includes(searchLower) ||
          service.location.toLowerCase().includes(searchLower) ||
          service.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro de status
      if (filters.status !== 'all' && service.status !== filters.status) {
        return false;
      }

      // Filtro de prioridade
      if (filters.priority !== 'all' && service.priority !== filters.priority) {
        return false;
      }

      // Filtro de tipo de serviço
      if (filters.serviceType !== 'all' && service.serviceType !== filters.serviceType) {
        return false;
      }

      // Filtro de cliente
      if (filters.client && !service.client?.toLowerCase().includes(filters.client.toLowerCase())) {
        return false;
      }

      // Filtro de local
      if (filters.location) {
        const locationMatch = 
          service.location.toLowerCase().includes(filters.location.toLowerCase()) ||
          service.city?.toLowerCase().includes(filters.location.toLowerCase());
        
        if (!locationMatch) return false;
      }

      // Filtro de data
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <motion.div
        className="container mx-auto p-2 sm:p-4 pb-24 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
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
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 text-left-force">
              Bem-vindo ao sistema de gerenciamento
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/settings">
              <Button variant="outline" size="sm" className="card-enhanced">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Configurações</span>
              </Button>
            </Link>
            {/* O BOTÃO "NOVA DEMANDA" FOI REMOVIDO DESTA SEÇÃO */}
          </div>
        </motion.div>

        {/* Cards de Estatísticas Principais - Simplificados */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 border-blue-200/50 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  Total de Demandas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-1">{services.length}</div>
                <p className="text-sm text-muted-foreground">Demandas no sistema</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50/50 to-green-100/30 border-green-200/50 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-1">{services.filter(s => s.status === 'concluido').length}</div>
                <p className="text-sm text-muted-foreground">Demandas finalizadas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50/50 to-orange-100/30 border-orange-200/50 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-1">{services.filter(s => s.status === 'pendente').length}</div>
                <p className="text-sm text-muted-foreground">Aguardando execução</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50/50 to-red-100/30 border-red-200/50 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Clock className="h-4 w-4 text-red-600" />
                  </div>
                  Alta Prioridade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-1">{services.filter(s => s.priority === 'alta').length}</div>
                <p className="text-sm text-muted-foreground">Demandas urgentes</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Busca Avançada - Simplificada */}
        <motion.div variants={itemVariants}>
          <AdvancedSearch
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            className="w-full max-w-full !px-0"
          />
        </motion.div>

        {/* Conteúdo Principal - Simplificado */}
        <motion.div variants={itemVariants}>
          <div className="space-y-6">
            {/* Demandas Recentes */}
            <Card className="bg-gradient-to-br from-background/95 via-background/90 to-primary/5 backdrop-blur-xl border border-border/30 shadow-xl">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    Demandas {filteredServices.length !== services.length ? 'Filtradas' : 'Recentes'}
                    {filteredServices.length !== services.length && (
                      <Badge variant="secondary" className="ml-2">
                        {filteredServices.length} de {services.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Link to="/demandas">
                      <Button variant="outline" size="sm" className="gap-2">
                        Ver Todas
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {recentServices.length > 0 ? (
                  <div className="space-y-4">
                    {recentServices.map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CompactServiceCard service={service} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-muted/20 rounded-2xl w-fit mx-auto mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhuma demanda encontrada</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                      {filters.searchTerm || filters.status !== 'all' || filters.priority !== 'all'
                        ? 'Tente ajustar os filtros de busca para encontrar demandas.'
                        : 'Não há demandas no sistema. Que tal criar a primeira?'}
                    </p>
                    <Link to="/nova-demanda">
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nova Demanda
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <Link to="/estatisticas" className="block">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Relatórios</h3>
                        <p className="text-sm text-muted-foreground">Estatísticas detalhadas</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="bg-gradient-to-br from-green-50/50 to-green-100/30 border-green-200/50 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <Link to="/equipe" className="block">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Equipe</h3>
                        <p className="text-sm text-muted-foreground">Gerenciar membros</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 border-blue-200/50 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <Link to="/calendar" className="block">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Calendário</h3>
                        <p className="text-sm text-muted-foreground">Agenda completa</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
