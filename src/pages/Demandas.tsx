
import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Download, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { AdvancedSearch } from "@/components/search/AdvancedSearch";
import { StatisticsCards } from "@/components/ui-custom/StatisticsCards";
import { useOptimizedServices } from "@/hooks/useOptimizedServices";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LocalSearchFilters {
  status: string;
  priority: string;
  serviceType: string;
  client: string;
  location: string;
  searchTerm: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  technician: string;
}

const Demandas = () => {
  const navigate = useNavigate();
  const {
    services,
    isLoading,
    error,
    filters,
    serviceStats,
    filterOptions,
    actions
  } = useOptimizedServices();

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<LocalSearchFilters>({
    status: 'all',
    priority: 'all',
    serviceType: 'all',
    client: '',
    location: '',
    searchTerm: '',
    dateFrom: null,
    dateTo: null,
    technician: 'all'
  });

  // Handler otimizado para busca
  const handleSearch = useCallback((term: string) => {
    actions.setSearchTerm(term);
  }, [actions]);

  // Handler otimizado para filtros
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    switch (filterType) {
      case 'status':
        actions.setStatusFilter(value);
        break;
      case 'priority':
        actions.setPriorityFilter(value);
        break;
      case 'serviceType':
        actions.setServiceTypeFilter(value);
        break;
    }
  }, [actions]);

  // Handler para refresh manual
  const handleRefresh = useCallback(async () => {
    try {
      await actions.loadServices();
      toast.success("Demandas atualizadas!");
    } catch (error) {
      toast.error("Erro ao atualizar demandas");
    }
  }, [actions]);

  // Export handler com menu
  const handleExport = useCallback((format: 'csv' | 'excel' | 'statistics') => {
    const { exportToCSV, exportToExcel, exportStatistics } = require('@/utils/exportUtils');
    
    switch (format) {
      case 'csv':
        exportToCSV(services, 'demandas');
        break;
      case 'excel':
        exportToExcel(services, 'demandas');
        break;
      case 'statistics':
        exportStatistics(services, 'estatisticas');
        break;
    }
  }, [services]);

  // Handler para filtros avançados
  const handleAdvancedFiltersChange = useCallback((newFilters: LocalSearchFilters) => {
    setSearchFilters(newFilters);
  }, []);

  const handleClearAdvancedFilters = useCallback(() => {
    setSearchFilters({
      status: 'all',
      priority: 'all',
      serviceType: 'all',
      client: '',
      location: '',
      searchTerm: '',
      dateFrom: null,
      dateTo: null,
      technician: 'all'
    });
    actions.clearFilters();
  }, [actions]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Erro ao carregar demandas</h2>
          <p className="text-muted-foreground mb-4">Ocorreu um erro ao buscar as demandas.</p>
          <Button onClick={handleRefresh}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Demandas
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e acompanhe todas as demandas de serviço
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('statistics')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Estatísticas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              onClick={() => navigate("/nova-demanda")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Demanda
            </Button>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatisticsCards {...serviceStats} />
        </motion.div>

        {/* Filtros rápidos */}
        <motion.div 
          className="flex flex-col lg:flex-row gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar demandas..."
              value={filters.searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.serviceType} onValueChange={(value) => handleFilterChange('serviceType', value)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {filterOptions.serviceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </motion.div>

        {/* Busca avançada */}
        {showAdvancedSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdvancedSearch
              filters={searchFilters}
              onFiltersChange={handleAdvancedFiltersChange}
              onClearFilters={handleClearAdvancedFilters}
              serviceTypes={filterOptions.serviceTypes}
              technicians={[]}
            />
          </motion.div>
        )}

        {/* Lista de demandas em cards verticais */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded w-16"></div>
                        <div className="h-6 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-lg font-medium mb-2">Nenhuma demanda encontrada</p>
                <p className="text-muted-foreground mb-4">
                  {filters.searchTerm || filters.status !== 'all' || filters.priority !== 'all' || filters.serviceType !== 'all' 
                    ? "Tente ajustar os filtros de busca" 
                    : "Crie sua primeira demanda para começar"
                  }
                </p>
                <Button onClick={() => navigate("/nova-demanda")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Demanda
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Informações de resultados */}
        {!isLoading && services.length > 0 && (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Badge variant="outline" className="px-4 py-2">
              Mostrando {services.length} de {serviceStats.total} demandas
            </Badge>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Demandas;
