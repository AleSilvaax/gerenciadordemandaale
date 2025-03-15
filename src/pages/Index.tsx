
import React from "react";
import { Search, CheckCircle, ClipboardList, XCircle, BarChart } from "lucide-react";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { StatCard } from "@/components/ui-custom/StatCard";
import { currentUser, stats, teamMembers } from "@/data/mockData";

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
            <p className="text-xs text-muted-foreground">{currentUser.role}</p>
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
      
      <div className="flex space-x-2 mt-6 overflow-x-auto scrollbar-none pb-2">
        <button className="nav-tab active">Geral</button>
        <button className="nav-tab">Pendentes</button>
        <button className="nav-tab">Concluídos</button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <StatCard 
          title="Vistorias totais" 
          value={stats.total} 
          icon={<BarChart size={24} className="text-white" />}
          className="bg-gradient-to-br from-secondary to-secondary/70"
        />
        
        <StatCard 
          title="Vistorias concluídas" 
          value={stats.completed} 
          icon={<CheckCircle size={24} className="text-white" />}
          className="bg-gradient-to-br from-green-600 to-green-700"
        />
        
        <StatCard 
          title="Vistorias pendentes" 
          value={stats.pending} 
          icon={<ClipboardList size={24} className="text-white" />}
          className="bg-gradient-to-br from-orange-600 to-orange-700"
        />
        
        <StatCard 
          title="Vistorias canceladas" 
          value={stats.cancelled} 
          icon={<XCircle size={24} className="text-white" />}
          className="bg-gradient-to-br from-red-600 to-red-700"
        />
      </div>
    </div>
  );
};

export default Index;
