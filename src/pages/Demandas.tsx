
import React, { useState } from "react";
import { Search } from "lucide-react";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { ServiceCard } from "@/components/ui-custom/ServiceCard";
import { currentUser, ServiceStatus, services } from "@/data/mockData";

const Demandas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ServiceStatus | "todos">("todos");
  
  const filteredServices = services.filter(service => {
    if (activeTab === "todos") return true;
    return service.status === activeTab;
  });
  
  return (
    <div className="min-h-screen p-4 page-transition">
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
        <button className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10">
          <Search size={18} />
        </button>
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
        {filteredServices.map(service => (
          <ServiceCard
            key={service.id}
            id={service.id}
            title={service.title}
            status={service.status}
            location={service.location}
            technician={service.technician}
          />
        ))}
      </div>
    </div>
  );
};

export default Demandas;
