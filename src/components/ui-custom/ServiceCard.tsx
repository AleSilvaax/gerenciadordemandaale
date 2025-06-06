
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { TeamMemberAvatar } from './TeamMemberAvatar';
import { StatusBadge } from './StatusBadge';
import { ServiceCardProps } from '@/types/serviceTypes';
import { DeadlineManager } from './DeadlineManager';

export const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  onDelete, 
  compact = false, 
  onClick 
}) => {
  const { id, title, status, location, technician, priority, dueDate, creationDate } = service;

  const completed = status === 'concluido';
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      await onDelete(id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const CardWrapper = onClick ? 'div' : Link;
  const cardProps = onClick ? { onClick: handleClick, className: "block cursor-pointer" } : { to: `/demandas/${id}`, className: "block" };

  return (
    <CardWrapper {...cardProps}>
      <Card className={`transition-all duration-300 hover:border-primary/30 ${completed ? 'bg-muted/30' : ''} ${compact ? 'p-2' : ''}`}>
        <CardContent className={`${compact ? 'pt-2 px-3' : 'pt-4'}`}>
          <div className="flex justify-between items-start gap-2 mb-3">
            <div>
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
              
              {onDelete && (
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
    </CardWrapper>
  );
};
