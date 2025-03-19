
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { Service, ServiceStatus } from "@/types/service";
import { getAllServices, deleteService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Demandas: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const savedTab = localStorage.getItem("demandasTab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
    
    fetchServices();
  }, []);
  
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const data = await getAllServices();
      setServices(data);
      filterServices(data, activeTab, searchTerm);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterServices = (
    serviceList: Service[],
    tab: string,
    search: string
  ) => {
    let filtered = [...serviceList];
    
    // Filter by tab
    if (tab !== "all") {
      filtered = filtered.filter((service) => service.status === tab);
    }
    
    // Filter by search term
    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(searchLower) ||
          service.location.toLowerCase().includes(searchLower) ||
          service.technicians.some((tech) =>
            tech.name.toLowerCase().includes(searchLower)
          )
      );
    }
    
    setFilteredServices(filtered);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterServices(services, activeTab, value);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("demandasTab", value);
    filterServices(services, value, searchTerm);
  };
  
  const clearSearch = () => {
    setSearchTerm("");
    filterServices(services, activeTab, "");
  };
  
  const handleDeleteService = (id: string) => {
    setServiceToDelete(id);
  };
  
  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteService(serviceToDelete);
      
      if (success) {
        setServices(services.filter((service) => service.id !== serviceToDelete));
        filterServices(
          services.filter((service) => service.id !== serviceToDelete),
          activeTab,
          searchTerm
        );
        
        toast({
          description: "Demanda excluída com sucesso",
        });
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    } finally {
      setIsDeleting(false);
      setServiceToDelete(null);
    }
  };
  
  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold mb-4">Demandas</h1>
        <Button onClick={() => navigate("/demandas/new")} className="rounded-full w-10 h-10 p-0">
          <PlusCircle size={20} />
        </Button>
      </div>
      
      <div className="mb-4 relative">
        <div className="relative">
          <Search size={20} className="absolute left-2 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Buscar demandas..."
            className="pl-8 pr-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-2.5 text-muted-foreground"
              onClick={clearSearch}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="concluido">Concluídas</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  title={service.title}
                  status={service.status}
                  location={service.location}
                  technician={service.technicians}
                  onDelete={handleDeleteService}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground bg-secondary/20 rounded-lg">
              <p>Nenhuma demanda encontrada</p>
              <Button 
                variant="link" 
                onClick={() => navigate("/demandas/new")}
                className="mt-2"
              >
                Criar nova demanda
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={!!serviceToDelete} onOpenChange={() => !isDeleting && setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir demanda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Demandas;
