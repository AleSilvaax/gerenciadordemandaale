
import React from "react";
import { motion } from "framer-motion";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Calendar, Award, TrendingUp } from "lucide-react";
import { TeamMember } from "@/types/serviceTypes";

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
  onEdit?: (member: TeamMember) => void;
  stats?: {
    completedServices: number;
    pendingServices: number;
    avgRating: number;
    joinDate: string;
  };
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  member, 
  index, 
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
      case "administrador": return "Administrador";
      case "gestor": return "Gestor";
      case "requisitor": return "Requisitor";
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "administrador": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "gestor": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "tecnico": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "requisitor": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusColor = () => {
    const isOnline = Math.random() > 0.3; // 70% chance of being online
    return isOnline 
      ? "bg-green-500 animate-pulse" 
      : "bg-gray-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header with Avatar and Basic Info */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <TeamMemberAvatar 
                src={member.avatar} 
                name={member.name} 
                size="lg"
                className="ring-2 ring-border/20 group-hover:ring-primary/30 transition-all duration-200"
              />
              <div 
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor()}`}
                title="Status online"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{member.name}</h3>
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getRoleColor(member.role)}`}>
                {getRoleDisplayName(member.role)}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span className="truncate">{member.email || `${member.name.toLowerCase().replace(' ', '.')}@empresa.com`}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span>{member.phone || `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`}</span>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-lg font-bold text-green-500">{stats.completedServices}</span>
              </div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-orange-500" />
                <span className="text-lg font-bold text-orange-500">{stats.pendingServices}</span>
              </div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>

          {/* Rating and Join Date */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-yellow-500" />
              <span className="font-medium">{stats.avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground">avaliação</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Desde {stats.joinDate}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <button 
              className="flex-1 text-xs py-2 px-3 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
              onClick={() => onEdit?.(member)}
            >
              Ver Perfil
            </button>
            <button className="flex-1 text-xs py-2 px-3 bg-muted hover:bg-muted/80 rounded-md transition-colors">
              Mensagem
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
