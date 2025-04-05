
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
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className={`mr-1 h-${iconSize/4} w-${iconSize/4}`} />
          {small ? 'OK' : 'Concluído'}
        </Badge>
      );
    case 'pendente':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className={`mr-1 h-${iconSize/4} w-${iconSize/4}`} />
          {small ? 'Pend.' : 'Pendente'}
        </Badge>
      );
    case 'cancelado':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200">
          <XCircle className={`mr-1 h-${iconSize/4} w-${iconSize/4}`} />
          {small ? 'Canc.' : 'Cancelado'}
        </Badge>
      );
    default:
      return null;
  }
};
