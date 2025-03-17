
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ServiceStatus } from '@/types/service';

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let color = '';
  let label = '';

  switch (status) {
    case 'pendente':
      color = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      label = 'Pendente';
      break;
    case 'concluido':
      color = 'bg-green-500/20 text-green-500 border-green-500/50';
      label = 'Concluído';
      break;
    case 'cancelado':
      color = 'bg-red-500/20 text-red-500 border-red-500/50';
      label = 'Cancelado';
      break;
  }

  return (
    <Badge variant="outline" className={cn(color, className)}>
      {label}
    </Badge>
  );
};

// Adicionar export default
export default StatusBadge;
