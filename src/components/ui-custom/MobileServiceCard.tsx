import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Calendar, User, MapPin, Wrench, AlertTriangle, Building2, Users } from "lucide-react";
import { Service } from "@/types/serviceTypes";
import { StatusBadge } from "./StatusBadge";
import { useNavigate } from "react-router-dom";

interface MobileServiceCardProps {
  service: Service;
  onClick?: () => void;
}

export const MobileServiceCard: React.FC<MobileServiceCardProps> = ({ 
  service, 
  onClick 
}) => {
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
      className="hover:shadow-lg transition-all duration-300 border border-border/50 bg-gradient-to-br from-card/90 to-card backdrop-blur-sm cursor-pointer active:scale-[0.98] hover:border-primary/30"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-card-foreground line-clamp-2 mb-2">
              {service.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {service.number && (
                <Badge variant="outline" className="text-xs font-mono">
                  #{service.number}
                </Badge>
              )}
              {service.creationDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(service.creationDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={service.status} />
            {service.priority && (
              <Badge className={`${getPriorityColor(service.priority)} border text-xs font-medium`}>
                {service.priority === 'urgente' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {service.priority}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cliente */}
        {service.client && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-primary/80 uppercase tracking-wide">Cliente</p>
              <p className="text-sm font-semibold">{service.client}</p>
              {(service.address || service.city) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {[service.address, service.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded-md">
            {service.description}
          </p>
        )}
        
        {/* Service Type e Location */}
        <div className="space-y-2">
          {service.serviceType && (
            <div className="flex items-center gap-3 p-2 bg-background/50 rounded-md">
              <div className="p-1 bg-primary/10 rounded">
                <Wrench className="w-3 h-3 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Tipo de Serviço</p>
                <p className="text-sm font-medium truncate">{service.serviceType}</p>
              </div>
            </div>
          )}
          
          {service.location && (
            <div className="flex items-center gap-3 p-2 bg-background/50 rounded-md">
              <div className="p-1 bg-primary/10 rounded">
                <MapPin className="w-3 h-3 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Localização</p>
                <p className="text-sm font-medium truncate">{service.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Prazo */}
        {service.dueDate && (
          <div className={`flex items-center gap-3 p-3 rounded-md transition-all ${
            isDeadlineNear(service.dueDate) 
              ? 'bg-destructive/5 border border-destructive/20' 
              : 'bg-background/50'
          }`}>
            <div className={`p-1 rounded ${
              isDeadlineNear(service.dueDate) ? 'bg-destructive/10' : 'bg-primary/10'
            }`}>
              <Clock className={`w-3 h-3 ${
                isDeadlineNear(service.dueDate) ? 'text-destructive' : 'text-primary'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {isDeadlineNear(service.dueDate) ? 'Prazo Próximo!' : 'Prazo'}
              </p>
              <p className={`text-sm font-medium ${
                isDeadlineNear(service.dueDate) ? 'text-destructive' : ''
              }`}>
                {formatDate(service.dueDate)}
              </p>
            </div>
            {isDeadlineNear(service.dueDate) && (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            )}
          </div>
        )}

        {/* Técnicos */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-background/50 to-muted/30 rounded-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1 bg-primary/10 rounded">
              {service.technicians && service.technicians.length > 1 ? (
                <Users className="w-3 h-3 text-primary" />
              ) : (
                <User className="w-3 h-3 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {service.technicians && service.technicians.length > 1 ? 'Técnicos' : 'Técnico'}
              </p>
              <p className="text-sm font-medium truncate">
                {service.technicians && service.technicians.length > 0
                  ? service.technicians.length > 1
                    ? `${service.technicians[0].name} +${service.technicians.length - 1}`
                    : service.technicians[0].name
                  : "Não atribuído"
                }
              </p>
            </div>
          </div>
          
          {/* Avatares dos Técnicos */}
          {service.technicians && service.technicians.length > 0 && (
            <div className="flex -space-x-1">
              {service.technicians.slice(0, 2).map((technician, index) => (
                <Avatar key={technician.id} className="w-8 h-8 border-2 border-background">
                  <AvatarImage 
                    src={technician.avatar} 
                    alt={technician.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {technician.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {service.technicians.length > 2 && (
                <div className="w-8 h-8 bg-muted border-2 border-background rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{service.technicians.length - 2}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};