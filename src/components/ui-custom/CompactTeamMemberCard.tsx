import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, TrendingUp, Calendar } from "lucide-react";
import { TeamMember } from "@/types/serviceTypes";

interface CompactTeamMemberCardProps {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  stats?: {
    completedServices: number;
    pendingServices: number;
    avgRating: number;
    joinDate: string;
  };
}

export const CompactTeamMemberCard: React.FC<CompactTeamMemberCardProps> = ({ 
  member, 
  onEdit,
  stats = {
    completedServices: Math.floor(Math.random() * 20) + 5,
    pendingServices: Math.floor(Math.random() * 10),
    avgRating: 4.2 + Math.random() * 0.8,
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
  }
}) => {
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "tecnico": return "Técnico";
      case "administrador": return "Admin";
      case "gestor": return "Gestor";
      case "requisitor": return "Requisitor";
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "administrador": return "bg-destructive/20 text-destructive border-destructive/30";
      case "gestor": return "bg-primary/20 text-primary border-primary/30";
      case "tecnico": return "bg-success/20 text-success border-success/30";
      case "requisitor": return "bg-warning/20 text-warning border-warning/30";
      default: return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 border border-border/60 bg-card cursor-pointer active:scale-[0.98]"
      onClick={() => onEdit?.(member)}
    >
      <CardContent className="p-4">
        {/* Linha Superior: Avatar, Nome e Role */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="w-10 h-10 border-2 border-background">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base truncate">{member.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {member.email || `${member.name.toLowerCase().replace(' ', '.')}@empresa.com`}
              </p>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 font-medium border ${getRoleColor(member.role)}`}
          >
            {getRoleDisplayName(member.role)}
          </Badge>
        </div>

        {/* Linha de Estatísticas */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="font-medium text-success">{stats.completedServices}</span>
              <span>concluídos</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-warning" />
              <span className="font-medium text-warning">{stats.pendingServices}</span>
              <span>pendentes</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">{stats.avgRating.toFixed(1)}</span>
            <span>★</span>
          </div>
        </div>

        {/* Indicador de navegação */}
        <div className="flex justify-end mt-2">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};