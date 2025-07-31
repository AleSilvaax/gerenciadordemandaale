import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeamMemberAvatar } from '@/components/ui-custom/TeamMemberAvatar';
import { Service } from '@/types/serviceTypes';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, User, AlertTriangle, ChevronRight } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompactServiceCardProps {
  service: Service;
}

export const CompactServiceCard: React.FC<CompactServiceCardProps> = ({ service }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/demanda/${service.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-500/15 text-green-700 border-green-500/30';
      case 'cancelado':
        return 'bg-red-500/15 text-red-700 border-red-500/30';
      case 'em_andamento':
        return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
      default:
        return 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-500/15 text-red-700 border-red-500/30';
      case 'media':
        return 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';
      case 'baixa':
        return 'bg-green-500/15 text-green-700 border-green-500/30';
      default:
        return 'bg-gray-500/15 text-gray-700 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      case 'em_andamento':
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  const isDeadlineNear = (dueDate: string) => {
    if (!dueDate) return false;
    const days = differenceInDays(parseISO(dueDate), new Date());
    return days <= 3 && days >= 0;
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const days = differenceInDays(parseISO(dueDate), new Date());
    return days < 0;
  };

  const formatDueDate = (dueDate: string) => {
    if (!dueDate) return null;
    return format(parseISO(dueDate), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <Card 
      className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Informações principais */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm truncate">{service.title}</h3>
              {service.priority === 'alta' && (
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {service.client && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{service.client}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{service.location}</span>
              </div>
              
              {service.dueDate && (
                <div className={`flex items-center gap-1 ${
                  isOverdue(service.dueDate) 
                    ? 'text-red-600' 
                    : isDeadlineNear(service.dueDate) 
                    ? 'text-orange-600' 
                    : ''
                }`}>
                  <Calendar className="w-3 h-3" />
                  <span>{formatDueDate(service.dueDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status e Técnico */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex flex-col items-end gap-1">
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-1 ${getStatusColor(service.status)}`}
              >
                {getStatusLabel(service.status)}
              </Badge>
              
              {service.priority && (
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-1 ${getPriorityColor(service.priority)}`}
                >
                  {service.priority.charAt(0).toUpperCase() + service.priority.slice(1)}
                </Badge>
              )}
            </div>

            {/* Técnico */}
            <div className="flex items-center gap-2">
              {service.technicians && service.technicians.length > 0 ? (
                <div className="flex items-center gap-1">
                  <TeamMemberAvatar
                    src={service.technicians[0].avatar || ''}
                    name={service.technicians[0].name}
                    size="sm"
                  />
                  <span className="text-xs text-muted-foreground max-w-[80px] truncate">
                    {service.technicians[0].name}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Não atribuído</span>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};