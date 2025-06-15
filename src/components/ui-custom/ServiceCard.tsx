
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { TeamMemberAvatar } from './TeamMemberAvatar';
import { StatusBadge } from './StatusBadge';
import { ServiceCardProps } from '@/types/serviceTypes';
import { DeadlineManager } from './DeadlineManager';
import { useAuth } from '@/context/AuthContext';

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onDelete, compact = false }) => {
  const { id, title, status, location, number, technician, priority, dueDate, creationDate } = service;
  const { hasPermission } = useAuth();

  const completed = status === 'concluido';
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      await onDelete(id);
    }
  };

  const canDelete = hasPermission('delete_services');

  return (
    <Link to={`/demandas/${id}`} className="block">
      <Card className={`transition-all duration-300 hover:border-primary/30 ${completed ? 'bg-muted/30' : ''} ${compact ? 'p-2' : ''}`}>
        <CardContent className={`${compact ? 'pt-2 px-3' : 'pt-4'}`}>
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {/* Número da demanda com estilo mais harmonioso */}
              {number && (
                <div className="flex items-center mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    Nº {number}
                  </span>
                </div>
              )}
              {/* Título alinhado à esquerda com quebra de linha controlada */}
              <h3 className={`font-medium text-left leading-tight mb-1 ${compact ? 'text-sm' : 'text-base'}`}>
                {title}
              </h3>
              {/* Localização alinhada à esquerda */}
              <p className={`text-muted-foreground text-left leading-tight ${compact ? 'text-xs' : 'text-sm'}`}>
                {location}
              </p>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={status} small={compact} />
            </div>
          </div>
          
          <DeadlineManager 
            dueDate={dueDate} 
            creationDate={creationDate}
            priority={priority}
            completed={completed} 
            compact={compact}
          />
        </CardContent>
        
        {!compact && (
          <CardFooter className="border-t pt-3 pb-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TeamMemberAvatar 
                  src={technician?.avatar} 
                  name={technician?.name}
                  size="sm"
                />
                <span className="text-sm text-left">{technician?.name}</span>
              </div>
              
              {onDelete && canDelete && (
                <button 
                  onClick={handleDelete}
                  className="text-xs text-destructive hover:underline flex-shrink-0"
                >
                  Excluir
                </button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
};
