
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

  const isListView = variant === 'list';

  return (
    <Link to={`/demandas/${id}`} className="block">
      <Card
        className={`
          transition-all duration-300 hover:border-primary/30 hover:shadow-lg
          ${completed ? 'bg-muted/30' : ''}
          ${compact ? 'p-2' : ''}
          ${isListView ? 'bg-card/50 backdrop-blur-sm border border-border/50' : ''}
          w-full
          max-w-full
          mx-auto
          rounded-xl
          shadow-md
        `}
        style={{ wordBreak: 'break-word' }}
      >
        <CardContent className={`${compact ? 'pt-2 px-3' : 'pt-4'} px-4 sm:px-6`}>
          {isListView ? (
            // Layout em linha para vista de lista
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Número */}
                {number && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                    Nº {number}
                  </span>
                )}
                
                {/* Título e Localização */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-left leading-tight mb-1 break-words text-base">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-left text-sm truncate">
                    {location}
                  </p>
                </div>

                {/* Técnico */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <TeamMemberAvatar
                    src={technician?.avatar}
                    name={technician?.name}
                    size="sm"
                  />
                  <span className="text-sm hidden sm:block max-w-[120px] truncate">
                    {technician?.name || "Não atribuído"}
                  </span>
                </div>

                {/* Data de vencimento compacta */}
                <div className="flex-shrink-0">
                  <DeadlineManager
                    dueDate={dueDate}
                    creationDate={creationDate}
                    priority={priority}
                    completed={completed}
                    compact={true}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <StatusBadge status={status} small={false} />
              </div>
            </div>
          ) : (
            // Layout tradicional para cards
            <div>
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
                  {/* Título alinhado à esquerda e quebra de linha forçada */}
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
                  {/* Localização alinhada à esquerda, quebra linha e não ultrapassa card */}
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
          )}
        </CardContent>

        {!compact && !isListView && (
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
