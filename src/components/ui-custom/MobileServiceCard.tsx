import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, User, MapPin, Wrench } from "lucide-react";
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

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/demanda/${service.id}`);
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-sm text-card-foreground line-clamp-2 flex-1 mr-2">
            {service.title}
          </h3>
          <StatusBadge status={service.status} />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {service.description}
        </p>

        {/* Service Info */}
        <div className="space-y-2 mb-3">
          {service.serviceType && (
            <div className="flex items-center gap-2">
              <Wrench className="w-3 h-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {service.serviceType}
              </Badge>
            </div>
          )}
          
          {service.location && (
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{service.location}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-1 text-xs mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Criado: {formatDate(service.createdAt)}</span>
          </div>
          
          {service.deadline && (
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className={`text-muted-foreground ${isDeadlineNear(service.deadline) ? "text-red-600 font-medium" : ""}`}>
                Prazo: {formatDate(service.deadline)}
              </span>
            </div>
          )}
        </div>

        {/* Technician */}
        {service.assignedTechnician && (
          <div className="flex items-center gap-2 text-xs mb-2">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{service.assignedTechnician}</span>
          </div>
        )}

        {/* Priority */}
        {service.priority && (
          <Badge 
            variant={service.priority === 'alta' ? 'destructive' : 
                   service.priority === 'media' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {service.priority}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
