
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, MapPin, User, Clock } from 'lucide-react';
import { Service } from '@/types/serviceTypes';
import { StatusBadge } from './StatusBadge';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MobileServiceCardProps {
  service: Service;
  onDelete?: (id: string) => Promise<void>; // Adicionado
  onClick?: () => void; // Adicionado
}

export const MobileServiceCard: React.FC<MobileServiceCardProps> = ({ service, onClick }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getServiceDate = () => {
    return service.creationDate || service.date || new Date().toISOString();
  };

  return (
    <Card className="w-full mb-3" onClick={onClick}> {/* Adicionado onClick no Card */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header - Title and Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {service.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                #{service.number}
              </p>
            </div>
            <StatusBadge status={service.status} small />
          </div>

          {/* Client and Location */}
          <div className="space-y-2">
            {service.client && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{service.client}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{service.location}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDate(getServiceDate())}</span>
            </div>
            
            {service.priority && (
              <Badge 
                variant={service.priority === 'alta' ? 'destructive' : 'secondary'}
                className="text-xs px-2 py-0.5 h-auto"
              >
                {service.priority}
              </Badge>
            )}
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onClick} // Alterado para usar a prop onClick
            className="w-full h-8 text-xs"
          >
            <Eye className="w-3 h-3 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
