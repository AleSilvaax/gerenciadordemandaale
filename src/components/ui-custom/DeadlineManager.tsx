
import React from 'react';
import { CalendarIcon, Clock } from 'lucide-react';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DeadlineManagerProps {
  dueDate?: string;
  creationDate?: string;
  priority?: 'baixa' | 'media' | 'alta' | 'urgente';
  completed?: boolean;
  className?: string;
}

export const DeadlineManager: React.FC<DeadlineManagerProps> = ({
  dueDate,
  creationDate,
  priority = 'media',
  completed = false,
  className,
}) => {
  if (!dueDate) return null;
  
  const dueDateObj = new Date(dueDate);
  const now = new Date();
  const isOverdue = isBefore(dueDateObj, now) && !completed;
  const isToday = differenceInDays(dueDateObj, now) === 0;
  const daysLeft = differenceInDays(dueDateObj, now);
  
  const getPriorityColor = () => {
    if (completed) return "bg-green-500/20 text-green-500";
    if (isOverdue) return "bg-red-500/20 text-red-500";
    
    switch(priority) {
      case 'baixa':
        return "bg-blue-500/20 text-blue-500";
      case 'media':
        return "bg-yellow-500/20 text-yellow-500";
      case 'alta':
        return "bg-orange-500/20 text-orange-500";
      case 'urgente':
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };
  
  const getStatusText = () => {
    if (completed) return "Concluído";
    if (isOverdue) return "Atrasado";
    if (isToday) return "Vence hoje";
    return `${daysLeft} dias restantes`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center", getPriorityColor())}>
        <Clock className="w-3 h-3 mr-1" />
        {getStatusText()}
      </div>
      
      <div className="text-xs text-muted-foreground">
        <CalendarIcon className="w-3 h-3 inline mr-1" />
        {format(dueDateObj, "dd/MM/yyyy", { locale: ptBR })}
      </div>
    </div>
  );
};
