
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { TeamMemberAvatar } from './TeamMemberAvatar';
import { StatusBadge } from './StatusBadge';
import { ServiceCardProps } from '@/types/serviceTypes';
import { DeadlineManager } from './DeadlineManager';
import { useAuth } from '@/context/AuthContext';

export const ServiceCard: React.FC<ServiceCardProps & { variant?: 'card' | 'list' }> = ({ service, onDelete, compact = false, variant = 'card' }) => {
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
    <Link to={`/servico/${id}`} className="block">
      <Card
        className={`
          transition-all duration-300 hover:border-primary/30 hover:shadow-lg
          ${completed ? 'bg-muted/30' : ''}
          ${compact ? 'p-2' : ''}
          w-full
          max-w-full
          mx-auto
          rounded-xl
          shadow-md
        `}
        style={{ wordBreak: 'break-word' }}
      >
        <CardContent className={`${compact ? 'pt-2 px-3' : 'pt-4'} px-4 sm:px-6`}>
          <div>
            <div className="flex justify-between items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                {/* Número da demanda */}
                {number && (
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                      Nº {number}
                    </span>
                  </div>
                )}
                {/* Título alinhado à esquerda */}
                <h3
                  className={`
                    font-medium text-left leading-tight mb-1 break-words
                    ${compact ? 'text-sm' : 'text-base'}
                    text-wrap
                  `}
                  style={{ minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  {title}
                </h3>
                {/* Localização alinhada à esquerda */}
                <p
                  className={`
                    text-muted-foreground text-left leading-tight
                    ${compact ? 'text-xs' : 'text-sm'}
                    truncate whitespace-pre-line break-words
                    max-w-full
                  `}
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}
                >
                  {location}
                </p>
              </div>
              <div className="flex-shrink-0 py-1 pl-1">
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
          </div>
        </CardContent>

        {!compact && (
          <CardFooter className="border-t pt-3 pb-3 px-4 sm:px-6">
            <div className="flex items-center justify-between w-full gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <TeamMemberAvatar
                  src={technician?.avatar}
                  name={technician?.name}
                  size="sm"
                />
                <span className="text-sm text-left truncate max-w-[100px] sm:max-w-[160px] min-w-0">{technician?.name || "Não atribuído"}</span>
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
