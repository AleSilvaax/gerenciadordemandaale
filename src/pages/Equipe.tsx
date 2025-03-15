
import React from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { currentUser, teamMembers } from "@/data/mockData";

const PermissionSection = ({ title, question }: { title: string; question: string }) => (
  <div className="mt-6">
    <h3 className="text-sm text-muted-foreground">{title}</h3>
    <p className="text-base mt-1">{question}</p>
  </div>
);

const Equipe: React.FC = () => {
  return (
    <div className="min-h-screen p-4 page-transition">
      <div className="flex items-center mb-6">
        <Link to="/" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Minha equipe</h1>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg mb-4">Gerenciar minha equipe</h2>
        
        <div className="flex space-x-4 overflow-x-auto scrollbar-none pb-2">
          <div className="flex flex-col items-center space-y-1">
            <button className="h-14 w-14 rounded-full flex items-center justify-center bg-secondary border border-white/20">
              <span className="text-xl">+</span>
            </button>
            <span className="text-xs whitespace-nowrap">Add</span>
          </div>
          
          {teamMembers.map(member => (
            <div key={member.id} className="flex flex-col items-center space-y-1">
              <TeamMemberAvatar 
                src={member.avatar} 
                name={member.name} 
                size="lg" 
              />
              <span className="text-xs whitespace-nowrap">{member.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <PermissionSection 
        title="Acessar a todos os chamados" 
        question="Quem Pode Ter Acesso?" 
      />
      
      <PermissionSection 
        title="Modificar status dos chamados" 
        question="Quem Pode Modificar?" 
      />
      
      <PermissionSection 
        title="Adicionar membros na equipe" 
        question="Quem Pode Adicionar Novos Membros?" 
      />
      
      <PermissionSection 
        title="Acessar as estatísticas" 
        question="Quem Pode Acessar As Estatísticas?" 
      />
      
      <button className="w-full bg-primary text-white py-3 rounded-lg mt-8 flex items-center justify-center">
        <Save size={18} className="mr-2" />
        Salvar
      </button>
    </div>
  );
};

export default Equipe;
