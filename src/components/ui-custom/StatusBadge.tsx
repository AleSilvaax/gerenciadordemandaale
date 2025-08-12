
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { ServiceStatus } from '@/types/serviceTypes';

interface StatusBadgeProps {
  status: ServiceStatus;
  small?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, small = false }) => {
  const iconSize = small ? 12 : 14;
  
  switch (status) {
    case 'concluido':
      return (
        <Badge className="bg-success/15 text-success hover:bg-success/20 border border-success/30 dark:bg-success/20">
          <CheckCircle className="mr-1" width={iconSize} height={iconSize} />
          {small ? 'OK' : 'Concluído'}
        </Badge>
      );
    case 'pendente':
      return (
        <Badge className="bg-warning/15 text-warning hover:bg-warning/20 border border-warning/30 dark:bg-warning/20">
          <Clock className="mr-1" width={iconSize} height={iconSize} />
          {small ? 'Pend.' : 'Pendente'}
        </Badge>
      );
    case 'cancelado':
      return (
        <Badge className="bg-danger/15 text-danger hover:bg-danger/20 border border-danger/30 dark:bg-danger/20">
          <XCircle className="mr-1" width={iconSize} height={iconSize} />
          {small ? 'Canc.' : 'Cancelado'}
        </Badge>
      );
    default:
      return null;
  }
};
