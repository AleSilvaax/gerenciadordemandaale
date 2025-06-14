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
          <div className="flex justify-between items-start gap-2 mb-3">
            <div>
              {/* Exibir número da demanda */}
              {number && (
                <span className="block text-xs text-muted-foreground mb-1">
                  Nº {number}
                </span>
              )}
              <h3 className={`font-medium line-clamp-1 ${compact ? 'text-sm' : 'text-base'}`}>{title}</h3>
              <p className={`text-muted-foreground line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>{location}</p>
            </div>
            <StatusBadge status={status} small={compact} />
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
                <span className="text-sm">{technician?.name}</span>
              </div>
              
              {onDelete && canDelete && (
                <button 
                  onClick={handleDelete}
                  className="text-xs text-destructive hover:underline"
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
