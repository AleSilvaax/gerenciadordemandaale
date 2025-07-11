
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
import { MobileServiceCard } from "@/components/ui-custom/MobileServiceCard";
import { ServiceFilters } from "@/components/filters/ServiceFilters";
import { MobileServiceFilters } from "@/components/filters/MobileServiceFilters";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { StatisticsCards } from "@/components/ui-custom/StatisticsCards";
import { useServiceFilters } from "@/hooks/useServiceFilters";
import { useServices } from "@/hooks/useServices";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Demandas = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { services, isLoading, error, refreshServices } = useServices();
  const { teamMembers } = useTeamMembers();
  const { serviceTypes } = useServiceTypes();
  
  const {
    filters,
    filteredServices,
    updateFilter,
    clearFilters
  } = useServiceFilters(services);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Estatísticas calculadas
  const serviceStats = useMemo(() => {
    const total = services.length;
    const pending = services.filter(s => s.status === 'pendente').length;
    const completed = services.filter(s => s.status === 'concluido').length;
    const cancelled = services.filter(s => s.status === 'cancelado').length;
    const highPriority = services.filter(s => s.priority === 'alta').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress: pending,
      completed,
      highPriority,
      completionRate,
    };
  }, [services]);

  // Lista de tipos de serviço únicos
  const uniqueServiceTypes = useMemo(() => {
    const types = [...new Set(services.map(s => s.serviceType).filter(Boolean))];
    return types.filter(type => type.trim() !== '');
  }, [services]);

  // Handler para refresh manual
  const handleRefresh = useCallback(async () => {
    try {
      await refreshServices();
      toast.success("Demandas atualizadas!");
    } catch (error) {
      toast.error("Erro ao atualizar demandas");
    }
  }, [refreshServices]);

  // Export handler com menu
  const handleExport = useCallback((format: 'csv' | 'excel' | 'statistics') => {
    try {
      const { exportToCSV, exportToExcel, exportStatistics } = require('@/utils/exportUtils');
      
      switch (format) {
        case 'csv':
          exportToCSV(filteredServices, 'demandas');
          break;
        case 'excel':
          exportToExcel(filteredServices, 'demandas');
          break;
        case 'statistics':
          exportStatistics(filteredServices, 'estatisticas');
          break;
      }
      toast.success(`Dados exportados em ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  }, [filteredServices]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
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
      {/* Mobile Header */}
      <MobileHeader
        title="Demandas"
        subtitle="Gerencie todas as demandas"
        rightAction={
          <Button
            size="sm"
            onClick={() => navigate("/nova-demanda")}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        }
      />

      <motion.div 
        className={`container mx-auto p-4 space-y-4 ${isMobile ? 'pt-2' : 'p-6 space-y-6'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Desktop Header */}
        {!isMobile && (
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
        )}

        {/* Estatísticas */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatisticsCards {...serviceStats} />
        </motion.div>

        {/* Sistema de Filtros */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isMobile ? (
            <MobileServiceFilters
              filters={filters}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
              serviceTypes={uniqueServiceTypes}
              totalResults={filteredServices.length}
            />
          ) : (
            <ServiceFilters
              filters={filters}
              onFilterChange={updateFilter}
              onClearFilters={clearFilters}
              onExport={() => handleExport('csv')}
              technicians={teamMembers}
              serviceTypes={uniqueServiceTypes}
              totalResults={filteredServices.length}
            />
          )}
        </motion.div>

        {/* Lista de demandas */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={isMobile ? 'pb-20' : ''}
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
          ) : filteredServices.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-lg font-medium mb-2">Nenhuma demanda encontrada</p>
                <p className="text-muted-foreground mb-4">
                  {filters.search || filters.status !== 'todos' || filters.serviceType !== 'all' 
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
            <div className={`space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {isMobile ? (
                    <MobileServiceCard service={service} />
                  ) : (
                    <ServiceCard service={service} />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Informações de resultados */}
        {!isLoading && filteredServices.length > 0 && !isMobile && (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Badge variant="outline" className="px-4 py-2">
              Mostrando {filteredServices.length} de {serviceStats.total} demandas
            </Badge>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Demandas;
