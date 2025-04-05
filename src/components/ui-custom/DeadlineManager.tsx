
import React from 'react';
import { format, differenceInDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CalendarRange, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ServicePriority } from '@/types/serviceTypes';

interface DeadlineManagerProps {
  dueDate?: string;
  creationDate?: string;
  priority?: ServicePriority;
  completed: boolean;
  compact?: boolean;
}

export const DeadlineManager: React.FC<DeadlineManagerProps> = ({ 
  dueDate, 
  creationDate, 
  priority = 'media',
  completed,
  compact = false
}) => {
  // If there's no due date or creation date, we can't calculate progress
  if (!dueDate || !creationDate) {
    return null;
  }
  
  const today = new Date();
  const startDate = new Date(creationDate);
  const endDate = new Date(dueDate);
  
  // Calculate days difference
  const totalDays = differenceInDays(endDate, startDate) || 1; // At least 1 day
  const daysPassed = differenceInDays(today, startDate);
  const daysRemaining = differenceInDays(endDate, today);
  
  // Calculate progress percentage
  let progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  if (completed) progress = 100;

  // Determine if the deadline is passed
  const isOverdue = !completed && isBefore(endDate, today);
  
  // Determine color based on priority and status
  const getProgressColor = (): string => {
    if (completed) return 'bg-green-500';
    if (isOverdue) return 'bg-red-500';
    
    switch(priority) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-blue-500';
      default: return 'bg-blue-500';
    }
  };
  
  return (
    <div className="space-y-2">
      {compact ? (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{format(endDate, 'dd/MM/yy', { locale: ptBR })}</span>
          </div>
          {isOverdue && !completed && (
            <div className="flex items-center text-red-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Atrasado</span>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center text-muted-foreground">
              <CalendarRange className="h-4 w-4 mr-1" />
              <span>
                {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            {isOverdue && !completed ? (
              <div className="flex items-center text-red-500">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>Atrasado</span>
              </div>
            ) : (
              <div className="text-muted-foreground">
                {completed ? 'Concluído' : `${daysRemaining} dias restantes`}
              </div>
            )}
          </div>
        </>
      )}
      
      <Progress 
        value={progress} 
        className={`h-1.5 ${compact ? 'mt-1' : 'mt-2'}`}
        indicatorClassName={getProgressColor()}
      />
    </div>
  );
};
