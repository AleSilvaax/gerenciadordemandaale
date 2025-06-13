
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { getServices, deleteService } from "@/services/api";
import { Service, ServiceStatus } from "@/types/serviceTypes";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Search as SearchIcon, Filter, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";

const Demandas: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasPermission, canAccessRoute } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="container py-4 space-y-6 pb-24 md:pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Gerenciar Demandas</h1>
        {canAccessRoute && canAccessRoute('/nova-demanda') && (
          <Button onClick={() => navigate("/nova-demanda")}>Nova demanda</Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar demandas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ServiceStatus | "all")}
          >
            <SelectTrigger className="w-full">
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
      </div>

      {isMobile ? (
        <div className="overflow-x-auto pb-4">
          <Tabs defaultValue="all" className="w-full">
            <div className="mb-4">
              <TabsList className="w-full grid grid-cols-4 h-auto p-1">
                <TabsTrigger value="all" className="py-2 text-xs">Todos ({services.length})</TabsTrigger>
                <TabsTrigger value="pending" className="py-2 text-xs">Pendentes ({pendingServices.length})</TabsTrigger>
                <TabsTrigger value="completed" className="py-2 text-xs">Concluídos ({completedServices.length})</TabsTrigger>
                <TabsTrigger value="canceled" className="py-2 text-xs">Cancelados ({canceledServices.length})</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-2 space-y-4">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="space-y-4">
                  {filteredServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Nenhuma demanda encontrada</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Não foram encontradas demandas com os filtros atuais.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="mt-2 space-y-4">
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
            
            <TabsContent value="completed" className="mt-2 space-y-4">
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
            
            <TabsContent value="canceled" className="mt-2 space-y-4">
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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos ({services.length})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({pendingServices.length})</TabsTrigger>
            <TabsTrigger value="completed">Concluídos ({completedServices.length})</TabsTrigger>
            <TabsTrigger value="canceled">Cancelados ({canceledServices.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6 space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="space-y-4 overflow-x-auto pb-4">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Nenhuma demanda encontrada</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Não foram encontradas demandas com os filtros atuais.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingServices.length > 0 ? (
              <div className="space-y-4 overflow-x-auto pb-4">
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
              <div className="space-y-4 overflow-x-auto pb-4">
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
              <div className="space-y-4 overflow-x-auto pb-4">
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
      )}

      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
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
