
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Plus, SortDesc, Calendar, MapPin, User, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteConfirmationDialog } from "@/components/ui-custom/DeleteConfirmationDialog";
import { AdvancedSearch, SearchFilters } from "@/components/search/AdvancedSearch";
import { getServices, deleteService, getTeamMembers } from "@/services/servicesDataService";
import { Service, TeamMember } from "@/types/serviceTypes";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Demandas: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({
    searchTerm: "",
    status: "all",
    priority: "all",
    serviceType: "all",
    client: "",
    location: "",
    dateFrom: null,
    dateTo: null,
    technician: "all"
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[Demandas] Carregando dados...');
        const [fetchedServices, fetchedTechnicians] = await Promise.all([
          getServices(),
          getTeamMembers()
        ]);
        
        console.log('[Demandas] Serviços carregados:', fetchedServices.length);
        console.log('[Demandas] Técnicos carregados:', fetchedTechnicians.length);
        
        setServices(fetchedServices);
        setTechnicians(fetchedTechnicians);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDeleteService = async (serviceId: string): Promise<void> => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setServiceToDelete(service);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteService(serviceToDelete.id);
      if (success) {
        setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
        toast.success("Demanda excluída com sucesso!");
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      } else {
        toast.error("Erro ao excluir demanda");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Erro ao excluir demanda");
    } finally {
      setIsDeleting(false);
    }
  };

  const applyFilters = (service: Service, filters: SearchFilters, basicSearch: string, basicStatus: string) => {
    // Busca básica ou avançada
    const searchQuery = showAdvancedSearch ? filters.searchTerm : basicSearch;
    const statusQuery = showAdvancedSearch ? filters.status : basicStatus;
    
    // Filtro de busca por texto
    if (searchQuery) {
      const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
    }
    
    // Filtro de status
    if (statusQuery !== "all" && service.status !== statusQuery) {
      return false;
    }
    
    // Filtros avançados (apenas quando busca avançada está ativa)
    if (showAdvancedSearch) {
      // Filtro de prioridade
      if (filters.priority !== "all" && service.priority !== filters.priority) {
        return false;
      }
      
      // Filtro de tipo de serviço
      if (filters.serviceType !== "all" && service.serviceType !== filters.serviceType) {
        return false;
      }
      
      // Filtro de cliente
      if (filters.client && !service.client?.toLowerCase().includes(filters.client.toLowerCase())) {
        return false;
      }
      
      // Filtro de localização
      if (filters.location && !service.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      
      // Filtro de técnico
      if (filters.technician !== "all" && service.technician?.id !== filters.technician) {
        return false;
      }
      
      // Filtro de data
      if (filters.dateFrom || filters.dateTo) {
        const serviceDate = new Date(service.creationDate || service.date || '');
        
        if (filters.dateFrom && serviceDate < filters.dateFrom) {
          return false;
        }
        
        if (filters.dateTo && serviceDate > filters.dateTo) {
          return false;
        }
      }
    }
    
    return true;
  };

  const filteredAndSortedServices = services
    .filter(service => applyFilters(service, advancedFilters, searchTerm, statusFilter))
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "status":
          return a.status.localeCompare(b.status);
        case "oldest":
          return new Date(a.creationDate || a.date || '').getTime() - new Date(b.creationDate || b.date || '').getTime();
        default: // "recent"
          return new Date(b.creationDate || b.date || '').getTime() - new Date(a.creationDate || a.date || '').getTime();
      }
    });

  const getStatusCount = (status: string) => {
    if (status === "all") return services.length;
    return services.filter(service => service.status === status).length;
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      searchTerm: "",
      status: "all",
      priority: "all",
      serviceType: "all",
      client: "",
      location: "",
      dateFrom: null,
      dateTo: null,
      technician: "all"
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

  // Obter tipos de serviço únicos dos dados
  const serviceTypes = [...new Set(services.map(s => s.serviceType).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <motion.div 
        className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 sm:space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <Link 
            to="/" 
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent text-left-force">
              Todas as Demandas
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 text-left-force">
              Gerencie todas as solicitações de serviço
            </p>
          </div>
          <Link to="/nova-demanda">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Demanda
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="card-enhanced hover:shadow-lg transition-all duration-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <FileText className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                <div className="text-lg sm:text-xl font-bold text-left-force">{getStatusCount("all")}</div>
                <p className="text-xs text-muted-foreground text-left-force text-no-wrap">Total</p>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced hover:shadow-lg transition-all duration-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                <div className="text-lg sm:text-xl font-bold text-left-force">{getStatusCount("pendente")}</div>
                <p className="text-xs text-muted-foreground text-left-force text-no-wrap">Pendentes</p>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced hover:shadow-lg transition-all duration-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <User className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <div className="text-lg sm:text-xl font-bold text-left-force">{getStatusCount("concluido")}</div>
                <p className="text-xs text-muted-foreground text-left-force text-no-wrap">Concluídas</p>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced hover:shadow-lg transition-all duration-300">
              <CardContent className="p-3 sm:p-4 text-center">
                <MapPin className="h-5 w-5 mx-auto mb-2 text-red-500" />
                <div className="text-lg sm:text-xl font-bold text-left-force">{getStatusCount("cancelado")}</div>
                <p className="text-xs text-muted-foreground text-left-force text-no-wrap">Canceladas</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Search Toggle */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Filtros</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvancedSearch ? 'Busca Simples' : 'Busca Avançada'}
            </Button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={itemVariants}>
          {showAdvancedSearch ? (
            <AdvancedSearch
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              onClearFilters={clearAdvancedFilters}
              serviceTypes={serviceTypes}
              technicians={technicians.map(t => ({ id: t.id, name: t.name }))}
            />
          ) : (
            <Card className="card-enhanced">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-left-force">
                  <Filter className="h-4 w-4 text-primary" />
                  Filtros Básicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por título, cliente ou localização..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background/60 border-border/50"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-background/60 border-border/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="concluido">Concluídas</SelectItem>
                      <SelectItem value="cancelado">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48 bg-background/60 border-border/50">
                      <SortDesc className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais Recentes</SelectItem>
                      <SelectItem value="oldest">Mais Antigas</SelectItem>
                      <SelectItem value="title">Por Título</SelectItem>
                      <SelectItem value="status">Por Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Services List */}
        <motion.div variants={itemVariants}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAndSortedServices.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ServiceCard service={service} onDelete={handleDeleteService} />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="card-enhanced">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2 text-left-force">Nenhuma demanda encontrada</h3>
                <p className="text-muted-foreground mb-4 text-left-force">
                  {searchTerm || statusFilter !== "all" || showAdvancedSearch
                    ? "Tente ajustar os filtros de busca" 
                    : "Comece criando sua primeira demanda"
                  }
                </p>
                <Link to="/nova-demanda">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Demanda
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir Demanda"
        description={
          serviceToDelete 
            ? `Tem certeza que deseja excluir a demanda "${serviceToDelete.title}"? Esta ação não pode ser desfeita.`
            : ""
        }
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Demandas;
