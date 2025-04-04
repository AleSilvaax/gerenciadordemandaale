
import React from "react";
import { Clock, Calendar, MapPin, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Service } from "@/types/serviceTypes";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { DeadlineManager } from "./DeadlineManager";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  compact?: boolean;
}

export const ServiceCard = ({ service, compact = false }: ServiceCardProps) => {
  const formattedDate = service.date
    ? format(new Date(service.date), "dd 'de' MMMM", { locale: ptBR })
    : "Data não informada";

  // Determine service type display name
  const serviceTypeDisplay = () => {
    switch(service.serviceType) {
      case 'inspection':
        return 'Vistoria';
      case 'installation':
        return 'Instalação';
      default:
        return service.serviceType || 'Serviço';
    }
  };

  // Determine priority badge styling
  const getPriorityBadge = () => {
    if (!service.priority) return null;
    
    const priorityColors = {
      baixa: "bg-blue-500/20 text-blue-500",
      media: "bg-yellow-500/20 text-yellow-500",
      alta: "bg-orange-500/20 text-orange-500",
      urgente: "bg-red-500/20 text-red-500",
    };
    
    const priorityLabels = {
      baixa: "Baixa",
      media: "Média",
      alta: "Alta",
      urgente: "Urgente",
    };
    
    return (
      <span className={cn("text-xs px-2 py-1 rounded-full", priorityColors[service.priority])}>
        {priorityLabels[service.priority]}
      </span>
    );
  };

  return (
    <Link
      to={`/demandas/${service.id}`}
      className="block transition-all hover:translate-y-[-2px]"
    >
      <div className="bg-card hover:bg-card/80 rounded-lg p-4 border border-white/10 shadow-sm transition-all">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-muted-foreground">
              {serviceTypeDisplay()} #{service.id.split('-')[0]}
            </span>
            <h3 className="font-medium text-foreground mt-1">{service.title}</h3>
          </div>
          <StatusBadge status={service.status} />
        </div>

        {!compact && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {formattedDate}
              
              {getPriorityBadge() && (
                <span className="mx-2">•</span>
              )}
              {getPriorityBadge()}
            </div>

            {service.dueDate && (
              <DeadlineManager 
                dueDate={service.dueDate}
                creationDate={service.date}
                priority={service.priority}
                completed={service.status === 'concluido'}
                className="mt-2"
              />
            )}

            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {service.location}
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center">
                <TeamMemberAvatar
                  src={service.technician.avatar}
                  name={service.technician.name}
                  size="sm"
                />
                <span className="ml-2 text-sm">{service.technician.name}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};
