
import React from 'react';
import { AlarmClock, AlertTriangle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow, parseISO, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServicePriority } from '@/types/serviceTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DeadlineManagerProps {
  dueDate?: string | null;
  creationDate?: string | null;
  priority?: ServicePriority;
  completed?: boolean;
  compact?: boolean;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
}

export const DeadlineManager: React.FC<DeadlineManagerProps> = ({ 
  dueDate, 
  creationDate, 
  priority = 'media',
  completed = false,
  compact = false,
  value,
  onChange
}) => {
  // Se onChange estiver presente, considere que esse é o modo de edição
  const isEditMode = !!onChange;
  
  // Se estiver no modo de edição, renderize o seletor de data
  if (isEditMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prazo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label>Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  {value ? format(value, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value || undefined}
                  onSelect={onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {value && (
              <Button 
                variant="ghost" 
                className="mt-2" 
                onClick={() => onChange && onChange(null)}
              >
                Remover prazo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Se não houver due date ou se estiver completo, mostre um status simples
  if (!dueDate || completed) {
    return (
      <div className={`flex items-center mt-2 text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
        <Clock className={`mr-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
        {!dueDate ? 'Sem prazo definido' : (
          <>Concluído {dueDate && `· Prazo: ${format(parseISO(dueDate), 'dd/MM/yyyy')}`}</>
        )}
      </div>
    );
  }

  // Resto do código existente para mostrar o status de prazo
  try {
    const dueDateTime = parseISO(dueDate);
    const today = new Date();
    const daysLeft = differenceInDays(dueDateTime, today);
    const isOverdue = daysLeft < 0;
    const creationDateTime = creationDate ? parseISO(creationDate) : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // Default to 3 days ago if no creation date
    const totalDuration = differenceInDays(dueDateTime, creationDateTime);
    const elapsedDuration = differenceInDays(today, creationDateTime);
    
    let progressValue = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
    
    // Priority colors
    const priorityColors = {
      baixa: 'text-blue-600',
      media: 'text-yellow-600',
      alta: 'text-orange-600',
      urgente: 'text-red-600'
    };
    
    // Status based on days left and priority
    let status = '';
    let statusIcon = null;
    let statusColor = '';
    
    if (isOverdue) {
      status = `Atrasado por ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'dia' : 'dias'}`;
      statusIcon = <AlertTriangle className={`mr-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />;
      statusColor = 'text-red-600';
    } else if (daysLeft === 0) {
      status = 'Vence hoje';
      statusIcon = <AlarmClock className={`mr-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />;
      statusColor = 'text-orange-600';
    } else if (daysLeft <= 2) {
      status = `Vence em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`;
      statusIcon = priority === 'urgente' || priority === 'alta' ? 
        <AlertTriangle className={`mr-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} /> :
        <Clock className={`mr-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />;
      statusColor = priority === 'urgente' || priority === 'alta' ? 'text-orange-600' : 'text-yellow-600';
    } else {
      status = `Vence em ${daysLeft} dias`;
      statusIcon = <Clock className={`mr-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />;
      statusColor = priorityColors[priority];
    }
    
    // Adjust progress bar color
    let progressColor = 'bg-blue-600';
    if (isOverdue) {
      progressColor = 'bg-red-600';
    } else if (progressValue > 75) {
      progressColor = 'bg-orange-600';
    } else if (progressValue > 50) {
      progressColor = 'bg-yellow-600';
    }
    
    return (
      <div className="mt-2 space-y-1">
        <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'}`}>
          <div className={`flex items-center ${statusColor}`}>
            {statusIcon}
            <span>{status}</span>
          </div>
          
          <div className={`text-xs font-medium ${priorityColors[priority]}`}>
            {priority === 'baixa' && 'Baixa Prioridade'}
            {priority === 'media' && 'Média Prioridade'}
            {priority === 'alta' && 'Alta Prioridade'}
            {priority === 'urgente' && 'Urgente'}
          </div>
        </div>
        
        <Progress 
          value={progressValue} 
          className={`h-1.5 ${isOverdue ? 'bg-red-200' : 'bg-muted'}`}
          indicatorClassName={progressColor}
        />
      </div>
    );
  } catch (error) {
    console.error('Error in DeadlineManager:', error);
    return (
      <div className={`flex items-center mt-2 text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
        <Clock className={`mr-1 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
        {dueDate ? `Prazo: ${dueDate}` : 'Data inválida'}
      </div>
    );
  }
};
