import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Calendar, AlertTriangle, ChevronRight } from "lucide-react";
import { Service } from "@/types/serviceTypes";
import { useNavigate } from "react-router-dom";

interface CompactMobileServiceCardProps {
  service: Service;
  onClick?: () => void;
}

export const CompactMobileServiceCard: React.FC<CompactMobileServiceCardProps> = ({ 
  service, 
  onClick 
}) => {
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-success/20 text-success border-success/30';
      case 'cancelado': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'em_andamento': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-warning/20 text-warning border-warning/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      case 'em_andamento': return 'Em Andamento';
      default: return 'Pendente';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'text-destructive';
      case 'urgente': return 'text-destructive';
      case 'media': return 'text-warning';
      default: return 'text-success';
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
      className="hover:shadow-md transition-all duration-200 border border-border/60 bg-card cursor-pointer active:scale-[0.98]"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Linha Superior: Técnico, Nome e Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {service.technicians && service.technicians.length > 0 ? (
              <Avatar className="w-8 h-8 border-2 border-background">
                <AvatarImage 
                  src={service.technicians[0].avatar} 
                  alt={service.technicians[0].name}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {service.technicians[0].name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-8 h-8 bg-muted/50 rounded-full flex items-center justify-center">
                <span className="text-xs text-muted-foreground">?</span>
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {service.technicians && service.technicians.length > 0
                  ? service.technicians[0].name
                  : "Não atribuído"
                }
              </p>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 font-medium border ${getStatusColor(service.status)}`}
          >
            {getStatusLabel(service.status)}
          </Badge>
        </div>

        {/* Linha do Título */}
        <h3 className="font-semibold text-base leading-tight mb-3 line-clamp-2">
          {service.title}
        </h3>

        {/* Linha de Metadados */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {service.number && (
              <span className="font-mono bg-muted/50 px-2 py-1 rounded">
                #{service.number}
              </span>
            )}
            
            {service.priority && (
              <span className={`flex items-center gap-1 ${getPriorityColor(service.priority)}`}>
                {(service.priority === 'alta' || service.priority === 'urgente') && (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {service.priority}
              </span>
            )}
            
            {service.creationDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(service.creationDate)}
              </span>
            )}
          </div>
          
          {service.dueDate && (
            <div className={`flex items-center gap-1 ${
              isDeadlineNear(service.dueDate) ? 'text-destructive font-medium' : ''
            }`}>
              <Clock className="w-3 h-3" />
              <span>{formatDate(service.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Localização e Cliente (se tiver espaço) */}
        {(service.client || service.location) && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground truncate">
              {[service.client, service.location].filter(Boolean).join(' • ')}
            </p>
          </div>
        )}

        {/* Indicador de navegação */}
        <div className="flex justify-end mt-2">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};