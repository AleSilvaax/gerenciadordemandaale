
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
  AlertTriangle,
  Users,
  Building2
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
    <Card className="group hover:shadow-xl transition-all duration-300 border border-border/50 bg-gradient-to-br from-card/80 to-card backdrop-blur-sm hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-card-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
              {service.title}
            </CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
          <div className="flex flex-col items-end gap-2">
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
      
      <CardContent className="space-y-5">
        {/* Cliente e Descrição */}
        <div className="space-y-3">
          {service.client && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Building2 className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-primary/80 uppercase tracking-wide">Cliente</p>
                <p className="text-sm font-semibold text-card-foreground">{service.client}</p>
                {(service.address || service.city) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {[service.address, service.city].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/30 p-3 rounded-lg border border-border/30">
              {service.description}
            </p>
          )}
        </div>
        
        {/* Informações do Serviço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {service.serviceType && (
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/40">
              <div className="p-2 bg-primary/10 rounded-full">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo de Serviço</p>
                <p className="text-sm font-semibold truncate">{service.serviceType}</p>
              </div>
            </div>
          )}
          
          {service.location && (
            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/40">
              <div className="p-2 bg-primary/10 rounded-full">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Localização</p>
                <p className="text-sm font-semibold truncate">{service.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Prazos */}
        {service.dueDate && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
            isDeadlineNear(service.dueDate) 
              ? 'bg-destructive/5 border-destructive/20 ring-1 ring-destructive/10' 
              : 'bg-background/50 border-border/40'
          }`}>
            <div className={`p-2 rounded-full ${
              isDeadlineNear(service.dueDate) ? 'bg-destructive/10' : 'bg-primary/10'
            }`}>
              <Clock className={`w-4 h-4 ${
                isDeadlineNear(service.dueDate) ? 'text-destructive' : 'text-primary'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isDeadlineNear(service.dueDate) ? 'Prazo Próximo!' : 'Prazo'}
              </p>
              <p className={`text-sm font-semibold ${
                isDeadlineNear(service.dueDate) ? 'text-destructive' : 'text-card-foreground'
              }`}>
                {formatDate(service.dueDate)}
              </p>
            </div>
            {isDeadlineNear(service.dueDate) && (
              <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
            )}
          </div>
        )}

        {/* Técnicos */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-background/50 to-muted/30 rounded-lg border border-border/40">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-primary/10 rounded-full">
              {service.technicians && service.technicians.length > 1 ? (
                <Users className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {service.technicians && service.technicians.length > 1 ? 'Técnicos' : 'Técnico Responsável'}
              </p>
              <p className="text-sm font-semibold truncate">
                {service.technicians && service.technicians.length > 0
                  ? service.technicians.length > 1
                    ? `${service.technicians[0].name} + ${service.technicians.length - 1} outros`
                    : service.technicians[0].name
                  : "Não atribuído"
                }
              </p>
            </div>
          </div>
          
          {/* Avatares dos Técnicos */}
          {service.technicians && service.technicians.length > 0 && (
            <div className="flex -space-x-2">
              {service.technicians.slice(0, 3).map((technician, index) => (
                <Avatar key={technician.id} className="w-10 h-10 border-2 border-background ring-2 ring-primary/20">
                  <AvatarImage 
                    src={technician.avatar} 
                    alt={technician.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {technician.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {service.technicians.length > 3 && (
                <div className="w-10 h-10 bg-muted border-2 border-background rounded-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  +{service.technicians.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão de Ação */}
        <div className="pt-2">
          <Button 
            onClick={handleViewDetails}
            className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold transition-all duration-200 group-hover:shadow-lg"
          >
            Ver Detalhes Completos
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
