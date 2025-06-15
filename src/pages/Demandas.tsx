import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { getServices, deleteService } from "@/services/servicesDataService";
import { Service, ServiceStatus } from "@/types/serviceTypes";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Search as SearchIcon, Filter, X, Plus, Zap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { useTechnicianServices } from "@/hooks/useTechnicianServices";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const Demandas: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const { user, hasPermission, canAccessRoute } = useAuth();

  // Adicionar hook para buscar demandas do técnico (caso seja técnico)
  const { data: technicianServices, isLoading: techLoading, error: techError } = useTechnicianServices();
  
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Se for técnico, usa o hook específico
    if (user.role === "tecnico") {
      setLoading(techLoading);
      if (techError) {
        toast.error("Erro ao carregar demandas do técnico");
        setServices([]);
      } else if (technicianServices) {
        setServices(technicianServices);
        console.log("[Demandas] Serviços carregados para técnico:", technicianServices.map(s => s.id));
      }
      return;
    }

    // Para admin/gestor, busca normalmente
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Erro ao carregar demandas", {
          description: "Não foi possível carregar as demandas. Tente novamente mais tarde.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [user, technicianServices, techLoading, techError]);

  const handleDelete = async (id: string) => {
    if (!hasPermission('delete_services')) {
      toast.error("Você não tem permissão para excluir demandas");
      return;
    }
    setServiceToDelete(id);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService(serviceToDelete);
      setServices(services.filter((service) => service.id !== serviceToDelete));
      toast.success("Demanda excluída", {
        description: "A demanda foi excluída com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Erro ao excluir demanda", {
        description: "Não foi possível excluir a demanda. Tente novamente mais tarde.",
      });
    } finally {
      setServiceToDelete(null);
    }
  };

  const filteredServices = services
    .filter((service) => {
      if (statusFilter !== "all" && service.status !== statusFilter) {
        return false;
      }
      
      const searchLower = searchTerm.toLowerCase();
      return (
        service.id.toLowerCase().includes(searchLower) ||
        service.title.toLowerCase().includes(searchLower) ||
        service.location.toLowerCase().includes(searchLower) ||
        service.technician.name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort by date if available, newest first
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });

  // Group services by status
  const pendingServices = services.filter((service) => service.status === "pendente");
  const completedServices = services.filter((service) => service.status === "concluido");
  const canceledServices = services.filter((service) => service.status === "cancelado");

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

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Gerenciar Demandas
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Visualize e gerencie todas as demandas do sistema
            </p>
          </div>
          {canAccessRoute && canAccessRoute('/nova-demanda') && (
            <Button onClick={() => navigate("/nova-demanda")} size="lg" className="px-8">
              <Plus className="mr-2 h-5 w-5" />
              Nova Demanda
            </Button>
          )}
        </motion.div>

        {/* Filters Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por ID, título, local ou técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ServiceStatus | "all")}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <div className="flex items-center">
                    <Filter size={16} className="mr-2" />
                    <SelectValue placeholder="Filtrar por status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || statusFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters} className="bg-background/50">
                <X size={16} className="mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{services.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{pendingServices.length}</div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{completedServices.length}</div>
            <div className="text-sm text-muted-foreground">Concluídas</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{canceledServices.length}</div>
            <div className="text-sm text-muted-foreground">Canceladas</div>
          </div>
        </motion.div>

        {/* Services Content */}
        <motion.div variants={itemVariants}>
          {isMobile ? (
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
              <Tabs defaultValue="all" className="w-full">
                <div className="mb-6">
                  <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-background/50">
                    <TabsTrigger value="all" className="py-3 text-xs">Todos</TabsTrigger>
                    <TabsTrigger value="pending" className="py-3 text-xs">Pendentes</TabsTrigger>
                    <TabsTrigger value="completed" className="py-3 text-xs">Concluídos</TabsTrigger>
                    <TabsTrigger value="canceled" className="py-3 text-xs">Cancelados</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="mt-0 space-y-4">
                  {loading ? (
                    <div className="flex justify-center p-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredServices.length > 0 ? (
                    <div className="space-y-4">
                      {filteredServices.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <ServiceCard
                            service={service}
                            onDelete={handleDelete}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Zap className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">Nenhuma demanda encontrada</h3>
                      <p className="text-muted-foreground">
                        Não foram encontradas demandas com os filtros atuais.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="pending" className="mt-6 space-y-4">
                  {pendingServices.length > 0 ? (
                    <div className="space-y-4">
                      {pendingServices
                        .filter((service) => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            service.id.toLowerCase().includes(searchLower) ||
                            service.title.toLowerCase().includes(searchLower) ||
                            service.location.toLowerCase().includes(searchLower) ||
                            service.technician.name.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onDelete={handleDelete}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Não há demandas pendentes.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="mt-6 space-y-4">
                  {completedServices.length > 0 ? (
                    <div className="space-y-4">
                      {completedServices
                        .filter((service) => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            service.id.toLowerCase().includes(searchLower) ||
                            service.title.toLowerCase().includes(searchLower) ||
                            service.location.toLowerCase().includes(searchLower) ||
                            service.technician.name.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onDelete={handleDelete}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Não há demandas concluídas.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="canceled" className="mt-6 space-y-4">
                  {canceledServices.length > 0 ? (
                    <div className="space-y-4">
                      {canceledServices
                        .filter((service) => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            service.id.toLowerCase().includes(searchLower) ||
                            service.title.toLowerCase().includes(searchLower) ||
                            service.location.toLowerCase().includes(searchLower) ||
                            service.technician.name.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onDelete={handleDelete}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Não há demandas canceladas.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-background/50">
                  <TabsTrigger value="all">Todos ({services.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pendentes ({pendingServices.length})</TabsTrigger>
                  <TabsTrigger value="completed">Concluídos ({completedServices.length})</TabsTrigger>
                  <TabsTrigger value="canceled">Cancelados ({canceledServices.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-6 space-y-4">
                  {loading ? (
                    <div className="flex justify-center p-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredServices.length > 0 ? (
                    <div className="space-y-4">
                      {filteredServices.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <ServiceCard
                            service={service}
                            onDelete={handleDelete}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Zap className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">Nenhuma demanda encontrada</h3>
                      <p className="text-muted-foreground">
                        Não foram encontradas demandas com os filtros atuais.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="pending" className="mt-6 space-y-4">
                  {pendingServices.length > 0 ? (
                    <div className="space-y-4">
                      {pendingServices
                        .filter((service) => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            service.id.toLowerCase().includes(searchLower) ||
                            service.title.toLowerCase().includes(searchLower) ||
                            service.location.toLowerCase().includes(searchLower) ||
                            service.technician.name.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onDelete={handleDelete}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Não há demandas pendentes.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="mt-6 space-y-4">
                  {completedServices.length > 0 ? (
                    <div className="space-y-4">
                      {completedServices
                        .filter((service) => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            service.id.toLowerCase().includes(searchLower) ||
                            service.title.toLowerCase().includes(searchLower) ||
                            service.location.toLowerCase().includes(searchLower) ||
                            service.technician.name.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onDelete={handleDelete}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Não há demandas concluídas.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="canceled" className="mt-6 space-y-4">
                  {canceledServices.length > 0 ? (
                    <div className="space-y-4">
                      {canceledServices
                        .filter((service) => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            service.id.toLowerCase().includes(searchLower) ||
                            service.title.toLowerCase().includes(searchLower) ||
                            service.location.toLowerCase().includes(searchLower) ||
                            service.technician.name.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onDelete={handleDelete}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Não há demandas canceladas.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-md border border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Demandas;
