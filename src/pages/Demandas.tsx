
import React, { useState, useEffect } from "react";
import { Search, Plus, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { Button } from "@/components/ui/button";
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
import { Service, ServiceStatus, currentUser } from "@/data/mockData";
import { getServices, deleteService } from "@/services/api";

const Demandas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ServiceStatus | "todos">("todos");
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if there's a selected tab in localStorage from the Index page
    const savedTab = localStorage.getItem("demandasTab");
    if (savedTab && (savedTab === "pendente" || savedTab === "concluido" || savedTab === "cancelado")) {
      setActiveTab(savedTab as ServiceStatus);
      localStorage.removeItem("demandasTab");
    }
    
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await getServices();
      setServicesList(data);
    } catch (error) {
      console.error("Erro ao carregar demandas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as demandas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredServices = servicesList.filter(service => {
    if (activeTab === "todos") return true;
    return service.status === activeTab;
  });
  
  const handleDelete = (id: string) => {
    setDeleteId(id);
  };
  
  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const success = await deleteService(deleteId);
        
        if (success) {
          setServicesList(servicesList.filter(service => service.id !== deleteId));
          
          toast({
            title: "Demanda excluída",
            description: `A demanda #${deleteId} foi excluída com sucesso.`,
          });
        } else {
          throw new Error("Falha ao excluir o serviço");
        }
      } catch (error) {
        console.error("Erro ao excluir demanda:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a demanda. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleSearch = () => {
    navigate('/search');
  };
  
  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TeamMemberAvatar 
            src={currentUser.avatar} 
            name={currentUser.name} 
            size="md" 
          />
          <div>
            <p className="text-xs text-muted-foreground">Bem vindo de volta</p>
            <h1 className="text-lg font-bold">MINHAS INSTALAÇÕES</h1>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link to="/demandas/new">
            <Button size="icon" variant="default" className="rounded-full">
              <Plus size={18} />
            </Button>
          </Link>
          <button 
            className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10"
            onClick={handleSearch}
          >
            <Search size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex space-x-2 mb-4 overflow-x-auto scrollbar-none">
        <button 
          className={`nav-tab ${activeTab === "todos" ? "active" : ""}`}
          onClick={() => setActiveTab("todos")}
        >
          Todos
        </button>
        <button 
          className={`nav-tab ${activeTab === "pendente" ? "active" : ""}`}
          onClick={() => setActiveTab("pendente")}
        >
          Pendentes
        </button>
        <button 
          className={`nav-tab ${activeTab === "concluido" ? "active" : ""}`}
          onClick={() => setActiveTab("concluido")}
        >
          Concluídos
        </button>
        <button 
          className={`nav-tab ${activeTab === "cancelado" ? "active" : ""}`}
          onClick={() => setActiveTab("cancelado")}
        >
          Cancelados
        </button>
      </div>
      
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-lg glass-card">
            <p className="text-center text-muted-foreground">Carregando demandas...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <ServiceCard
              key={service.id}
              id={service.id}
              title={service.title}
              status={service.status}
              location={service.location}
              technician={service.technician || { id: "", name: "Sem técnico", avatar: "" }}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 rounded-lg glass-card">
            <AlertCircle size={48} className="text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">
              Nenhuma demanda encontrada para o filtro selecionado.
            </p>
            <Link to="/demandas/new" className="mt-4">
              <Button variant="outline" size="sm">
                <Plus size={16} className="mr-2" />
                Criar nova demanda
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir demanda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Demandas;
