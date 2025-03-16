
import React from "react";
import { Search, CheckCircle, ClipboardList, XCircle, BarChart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { StatCard } from "@/components/ui-custom/StatCard";
import { currentUser, stats, teamMembers } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen p-4 page-transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <TeamMemberAvatar 
            src={currentUser.avatar} 
            name={currentUser.name} 
            size="lg" 
          />
          <div>
            <h2 className="text-lg font-bold">Olá {currentUser.name.split(" ")[0]}</h2>
            <p className="text-xs text-muted-foreground">{currentUser.role === "gestor" ? "Coordenador de projetos" : currentUser.role}</p>
          </div>
        </div>
        <button className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10">
          <Search size={18} />
        </button>
      </div>
      
      <h1 className="text-2xl font-bold mt-6">Minha equipe</h1>
      
      <div className="flex space-x-3 mt-4 overflow-x-auto scrollbar-none pb-2">
        {teamMembers.map(member => (
          <div key={member.id} className="flex flex-col items-center space-y-1">
            <TeamMemberAvatar src={member.avatar} name={member.name} />
            <span className="text-xs whitespace-nowrap">{member.name}</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <h2 className="text-xl font-bold">Resumo</h2>
        <Link to="/estatisticas">
          <Button variant="link" className="text-sm text-primary p-0 h-auto">
            Ver estatísticas
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </Link>
      </div>
      
      <div className="flex space-x-2 mt-4 overflow-x-auto scrollbar-none pb-2">
        <Link to="/demandas" className="nav-tab active">Geral</Link>
        <Link to="/demandas" onClick={() => localStorage.setItem("demandasTab", "pendente")} className="nav-tab">Pendentes</Link>
        <Link to="/demandas" onClick={() => localStorage.setItem("demandasTab", "concluido")} className="nav-tab">Concluídos</Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Link to="/demandas">
          <StatCard 
            title="Vistorias totais" 
            value={stats.total} 
            icon={<BarChart size={24} className="text-white" />}
            className="bg-gradient-to-br from-secondary to-secondary/70"
          />
        </Link>
        
        <Link to="/demandas" onClick={() => localStorage.setItem("demandasTab", "concluido")}>
          <StatCard 
            title="Vistorias concluídas" 
            value={stats.completed} 
            icon={<CheckCircle size={24} className="text-white" />}
            className="bg-gradient-to-br from-green-600 to-green-700"
          />
        </Link>
        
        <Link to="/demandas" onClick={() => localStorage.setItem("demandasTab", "pendente")}>
          <StatCard 
            title="Vistorias pendentes" 
            value={stats.pending} 
            icon={<ClipboardList size={24} className="text-white" />}
            className="bg-gradient-to-br from-orange-600 to-orange-700"
          />
        </Link>
        
        <Link to="/demandas" onClick={() => localStorage.setItem("demandasTab", "cancelado")}>
          <StatCard 
            title="Vistorias canceladas" 
            value={stats.cancelled} 
            icon={<XCircle size={24} className="text-white" />}
            className="bg-gradient-to-br from-red-600 to-red-700"
          />
        </Link>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Demandas recentes</h2>
          <Link to="/demandas">
            <Button variant="link" className="text-sm text-primary p-0 h-auto">
              Ver todas
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="mt-4 space-y-4">
          {/* Display some recent demands as cards with links to the detail page */}
          <Link to="/demandas/6430" className="block">
            <div className="p-4 rounded-lg glass-card">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Vistoria Pedro Penacchione</h3>
                <span className="text-sm font-medium text-primary">#6430</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Status: </span>
                <span className="status-badge status-concluido ml-1">Concluído</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-muted-foreground">
                  Av. Airton Pretini
                </div>
                <div className="flex items-center">
                  <TeamMemberAvatar 
                    src={teamMembers[0].avatar} 
                    name={teamMembers[0].name} 
                    size="sm" 
                  />
                </div>
              </div>
            </div>
          </Link>
          
          <Link to="/demandas/6431" className="block">
            <div className="p-4 rounded-lg glass-card">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Vistoria Pedro Penacchione</h3>
                <span className="text-sm font-medium text-primary">#6431</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>Status: </span>
                <span className="status-badge status-pendente ml-1">Pendente</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-muted-foreground">
                  Av. Airton Pretini
                </div>
                <div className="flex items-center">
                  <TeamMemberAvatar 
                    src={teamMembers[0].avatar} 
                    name={teamMembers[0].name} 
                    size="sm" 
                  />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
