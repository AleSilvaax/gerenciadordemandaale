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
      className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Linha 1: Título, Status e Número */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                {service.priority === 'alta' && (
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{service.serviceType || 'Serviço Geral'}</p>
            </div>
            
            <div className="flex items-start gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-1 font-medium ${getStatusColor(service.status)}`}
                >
                  {getStatusLabel(service.status)}
                </Badge>
                
                {service.priority && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 font-medium ${getPriorityColor(service.priority)}`}
                  >
                    {service.priority.charAt(0).toUpperCase() + service.priority.slice(1)}
                  </Badge>
                )}
              </div>
              
              {service.number && (
                <div className="flex items-center justify-center min-w-[2.5rem] h-8 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-xs font-bold text-primary">#{service.number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Linha 2: Informações do Cliente e Local */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {service.client && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{service.client}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[180px]">{service.location}</span>
            </div>
            
            {service.dueDate && (
              <div className={`flex items-center gap-2 ${
                isOverdue(service.dueDate) 
                  ? 'text-red-600 font-medium' 
                  : isDeadlineNear(service.dueDate) 
                  ? 'text-orange-600 font-medium' 
                  : ''
              }`}>
                <Calendar className="w-4 h-4" />
                <span>{formatDueDate(service.dueDate)}</span>
              </div>
            )}
          </div>

          {/* Linha 3: Técnicos e Ação */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-3">
              {service.technicians && service.technicians.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {service.technicians.slice(0, 2).map((technician, index) => (
                      <TeamMemberAvatar
                        key={technician.id}
                        src={technician.avatar || ''}
                        name={technician.name}
                        size="md"
                        className={`border-2 border-background ${index > 0 ? 'z-10' : 'z-20'}`}
                      />
                    ))}
                    {service.technicians.length > 2 && (
                      <div className="w-10 h-10 bg-muted border-2 border-background rounded-full flex items-center justify-center text-xs font-semibold text-muted-foreground z-30">
                        +{service.technicians.length - 2}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {service.technicians.length === 1 
                        ? service.technicians[0].name 
                        : `${service.technicians[0].name} + ${service.technicians.length - 1} outros`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.technicians.length > 1 ? 'Múltiplos técnicos' : 'Técnico responsável'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Não atribuído</p>
                    <p className="text-xs text-muted-foreground">Aguardando designação</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ver detalhes</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};