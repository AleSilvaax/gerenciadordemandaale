
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock, 
  Calendar, 
  User, 
  ArrowRight,
  MapPin,
  Wrench,
  AlertTriangle
} from "lucide-react";
import { Service } from "@/types/serviceTypes";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    const daysUntilDeadline = Math.ceil(diff / (1000 * 3600 * 24));
    return daysUntilDeadline <= 7;
  };

  const handleViewDetails = () => {
    navigate(`/demanda/${service.id}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'urgente': return 'bg-red-700/10 text-red-700 border-red-700/20';
      case 'media': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-600 border-green-500/20';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-card-foreground line-clamp-2 mb-2">
              {service.title}
            </CardTitle>
            {service.number && (
              <div className="text-xs text-muted-foreground mb-2">
                #{service.number}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={service.status} />
            {service.priority && (
              <Badge className={`${getPriorityColor(service.priority)} border text-xs`}>
                {service.priority === 'urgente' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {service.priority}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}
        
        {/* Service Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {service.serviceType && (
            <div className="flex items-center gap-2 p-2 bg-background/30 rounded-md border border-border/30">
              <Wrench className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium truncate">{service.serviceType}</p>
              </div>
            </div>
          )}
          
          {service.location && (
            <div className="flex items-center gap-2 p-2 bg-background/30 rounded-md border border-border/30">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Local</p>
                <p className="text-sm font-medium truncate">{service.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-background/30 rounded-md border border-border/30">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Criado</p>
              <p className="text-sm">{service.creationDate ? formatDate(service.creationDate) : 'N/A'}</p>
            </div>
          </div>
          
          {service.dueDate && (
            <div className={`flex items-center gap-2 p-2 rounded-md border border-border/30 ${
              isDeadlineNear(service.dueDate) 
                ? 'bg-red-50 dark:bg-red-950/20' 
                : 'bg-background/30'
            }`}>
              <Clock className={`w-4 h-4 shrink-0 ${
                isDeadlineNear(service.dueDate) ? 'text-red-500' : 'text-muted-foreground'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Prazo</p>
                <p className={`text-sm ${isDeadlineNear(service.dueDate) ? "text-red-600 font-medium" : ""}`}>
                  {formatDate(service.dueDate)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Technician */}
        <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-border/30">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <User className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Técnico Responsável</p>
              <p className="text-sm font-medium truncate">
                {service.technicians?.[0]?.name || "Não atribuído"}
              </p>
            </div>
          </div>
          
          {/* Technician Avatar */}
          {service.technicians?.[0] && (
            <Avatar className="w-8 h-8 border-2 border-primary/20">
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

        {/* Action Button */}
        <div className="pt-2">
          <Button 
            onClick={handleViewDetails}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
            size="sm"
          >
            Ver Detalhes
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
