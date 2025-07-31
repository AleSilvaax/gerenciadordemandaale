
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Calendar, User, MapPin, Wrench, AlertTriangle } from "lucide-react";
import { Service } from "@/types/serviceTypes";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface MobileServiceCardProps {
  service: Service;
  onClick?: () => void;
}

export const MobileServiceCard: React.FC<MobileServiceCardProps> = ({ 
  service, 
  onClick 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'urgente': return 'bg-red-700/10 text-red-700 border-red-700/20';
      case 'media': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-600 border-green-500/20';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/demanda/${service.id}`);
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 cursor-pointer bg-card/50 backdrop-blur-sm border border-border/50"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 mr-2">
            <h3 className="font-semibold text-sm text-card-foreground line-clamp-2 mb-1">
              {service.title}
            </h3>
            {service.number && (
              <p className="text-xs text-muted-foreground">#{service.number}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={service.status} />
            {service.priority && (
              <Badge className={`${getPriorityColor(service.priority)} border text-xs`}>
                {service.priority === 'urgente' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {service.priority}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {service.description}
          </p>
        )}

        {/* Service Info */}
        <div className="space-y-2 mb-3">
          {service.serviceType && (
            <div className="flex items-center gap-2 p-2 bg-background/30 rounded-md border border-border/30">
              <Wrench className="w-3 h-3 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-xs font-medium truncate">{service.serviceType}</p>
              </div>
            </div>
          )}
          
          {service.location && (
            <div className="flex items-center gap-2 p-2 bg-background/30 rounded-md border border-border/30">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Local</p>
                <p className="text-xs font-medium truncate">{service.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1 p-2 bg-background/30 rounded-md border border-border/30">
            <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Criado</p>
              <p className="text-xs">{service.creationDate ? formatDate(service.creationDate) : 'N/A'}</p>
            </div>
          </div>
          
          {service.dueDate && (
            <div className={`flex items-center gap-1 p-2 rounded-md border border-border/30 ${
              isDeadlineNear(service.dueDate) 
                ? 'bg-red-50 dark:bg-red-950/20' 
                : 'bg-background/30'
            }`}>
              <Clock className={`w-3 h-3 shrink-0 ${
                isDeadlineNear(service.dueDate) ? 'text-red-500' : 'text-muted-foreground'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Prazo</p>
                <p className={`text-xs ${isDeadlineNear(service.dueDate) ? "text-red-600 font-medium" : ""}`}>
                  {formatDate(service.dueDate)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Technician */}
        <div className="flex items-center justify-between p-2 bg-background/30 rounded-md border border-border/30">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="w-3 h-3 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Técnico</p>
              <p className="text-xs font-medium truncate">
                {service.technicians?.[0]?.name || "Não atribuído"}
              </p>
            </div>
          </div>
          
          {/* Technician Avatar */}
          {service.technicians?.[0] && (
            <Avatar className="w-6 h-6 border border-primary/20">
              <AvatarImage 
                src={service.technicians[0].avatar} 
                alt={service.technicians[0].name}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {service.technicians[0].name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
