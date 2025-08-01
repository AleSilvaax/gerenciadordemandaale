
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  Search,
  Filter,
  X,
  Activity,
  Target,
  TrendingUp,
  RefreshCcw,
  Download
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/context/AuthContext";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { MobileServiceCard } from "@/components/ui-custom/MobileServiceCard";
import { CompactServiceCard } from "@/components/ui-custom/CompactServiceCard";
import { CompactMobileServiceCard } from "@/components/ui-custom/CompactMobileServiceCard";
import { ServiceFilters } from "@/components/filters/ServiceFilters";
import { MobileServiceFilters } from "@/components/filters/MobileServiceFilters";
import { useIsMobile } from "@/hooks/use-mobile";

const Demandas = () => {
  const { services, isLoading, refreshServices } = useServices();
  const { teamMembers } = useTeamMembers();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<"detailed" | "compact">("detailed");

  // Filtering logic and statistics calculations

  const filteredServices = useMemo(() => {
    if (!services) return [];

    return services.filter(service => {
      const matchesSearch = !searchTerm || 
        service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || service.status === statusFilter;
      const matchesTechnician = technicianFilter === "all" || 
        service.technicians?.some(tech => tech.id === technicianFilter);
      const matchesServiceType = serviceTypeFilter === "all" || service.serviceType === serviceTypeFilter;
      const matchesPriority = priorityFilter === "all" || service.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesTechnician && matchesServiceType && matchesPriority;
    });
  }, [services, searchTerm, statusFilter, technicianFilter, serviceTypeFilter, priorityFilter]);

  const stats = useMemo(() => {
    const total = filteredServices.length;
    const pending = filteredServices.filter(s => s.status === 'pendente').length;
    const completed = filteredServices.filter(s => s.status === 'concluido').length;
    const highPriority = filteredServices.filter(s => s.priority === 'alta').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, completed, highPriority, completionRate };
  }, [filteredServices]);

  const serviceTypes = useMemo(() => {
    const types = new Set(services?.map(s => s.serviceType).filter(Boolean));
    return Array.from(types);
  }, [services]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTechnicianFilter("all");
    setServiceTypeFilter("all");
    setPriorityFilter("all");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || 
    technicianFilter !== "all" || serviceTypeFilter !== "all" || priorityFilter !== "all";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando demandas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Demandas
              </h1>
              <p className="text-muted-foreground mt-1">Gerencie e acompanhe todas as demandas de serviço</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className={showSearch ? "bg-primary/10 text-primary border-primary/20" : ""}
            >
              <Search className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Buscar</span>}
            </Button>

            {/* Refresh Button */}
            <Button variant="outline" size="sm" onClick={() => refreshServices()}>
              <RefreshCcw className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Atualizar</span>}
            </Button>

            {/* Export Button */}
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Exportar</span>}
            </Button>

            {/* New Service Button */}
            {user && ['super_admin', 'owner', 'administrador', 'gestor'].includes(user.role) && (
              <Link to="/nova-demanda">
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Nova Demanda</span>
                  <span className="ml-2 sm:hidden">Nova</span>
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Search Bar */}
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, cliente, local ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowSearch(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Statistics Cards */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Alta Prioridade</p>
                  <p className="text-2xl font-bold">{stats.highPriority}</p>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filtros e Busca</span>
            <Badge variant="secondary" className="ml-2">
              {filteredServices.length} resultado{filteredServices.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Filtros</span>
            </Button>
          </div>
        </motion.div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isMobile ? (
              <MobileServiceFilters
                filters={{
                  search: searchTerm,
                  status: statusFilter === "all" ? "todos" : statusFilter as any,
                  serviceType: serviceTypeFilter,
                  technicianId: technicianFilter,
                  dateRange: { from: null, to: null }
                }}
                onFilterChange={(key, value) => {
                  if (key === 'search') setSearchTerm(value);
                  if (key === 'status') setStatusFilter(value === "todos" ? "all" : value);
                  if (key === 'serviceType') setServiceTypeFilter(value);
                  if (key === 'technicianId') setTechnicianFilter(value);
                }}
                onClearFilters={clearFilters}
                serviceTypes={serviceTypes}
                totalResults={filteredServices.length}
              />
            ) : (
              <ServiceFilters
                filters={{
                  search: searchTerm,
                  status: statusFilter === "all" ? "todos" : statusFilter as any,
                  serviceType: serviceTypeFilter,
                  technicianId: technicianFilter,
                  dateRange: { from: null, to: null }
                }}
                onFilterChange={(key, value) => {
                  if (key === 'search') setSearchTerm(value);
                  if (key === 'status') setStatusFilter(value === "todos" ? "all" : value);
                  if (key === 'serviceType') setServiceTypeFilter(value);
                  if (key === 'technicianId') setTechnicianFilter(value);
                }}
                onClearFilters={clearFilters}
                technicians={teamMembers}
                serviceTypes={serviceTypes}
                totalResults={filteredServices.length}
              />
            )}
          </motion.div>
        )}

        {/* Services List */}
        <motion.div 
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {filteredServices.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma demanda encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? "Tente ajustar os filtros para encontrar as demandas desejadas."
                    : "Ainda não há demandas cadastradas no sistema."
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => {
                if (isMobile) {
                  return viewMode === "detailed" ? (
                    <MobileServiceCard key={service.id} service={service} />
                  ) : (
                    <CompactMobileServiceCard key={service.id} service={service} />
                  );
                } else {
                  return viewMode === "detailed" ? (
                    <ServiceCard key={service.id} service={service} />
                  ) : (
                    <CompactServiceCard key={service.id} service={service} />
                  );
                }
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Demandas;
