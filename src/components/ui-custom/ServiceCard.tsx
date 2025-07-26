import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Calendar, 
  User, 
  ArrowRight,
  MapPin,
  Wrench
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

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-card-foreground line-clamp-2">
            {service.title}
          </CardTitle>
          <StatusBadge status={service.status} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {service.description}
        </p>
        
        {/* Service Info */}
        <div className="space-y-2">
          {service.serviceType && (
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tipo:</span>
              <Badge variant="secondary" className="text-xs">
                {service.serviceType}
              </Badge>
            </div>
          )}
          
          {service.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Local:</span>
              <span className="font-medium">{service.location}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Criado:</span>
            <span>{formatDate(service.createdAt)}</span>
          </div>
          
          {service.deadline && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Prazo:</span>
              <span className={isDeadlineNear(service.deadline) ? "text-red-600 font-medium" : ""}>
                {formatDate(service.deadline)}
              </span>
            </div>
          )}
        </div>

        {/* Technician */}
        {service.assignedTechnician && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Técnico:</span>
            <span className="font-medium">{service.assignedTechnician}</span>
          </div>
        )}

        {/* Priority */}
        {service.priority && (
          <div className="flex items-center gap-2">
            <Badge 
              variant={service.priority === 'alta' ? 'destructive' : 
                     service.priority === 'media' ? 'default' : 'secondary'}
              className="text-xs"
            >
              Prioridade: {service.priority}
            </Badge>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button 
            onClick={handleViewDetails}
            className="w-full flex items-center justify-center gap-2"
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
