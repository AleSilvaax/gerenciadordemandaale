
import React from 'react';
import { ServiceStatus } from '@/types/service';
import StatusBadge from '@/components/ui-custom/StatusBadge';

interface ServiceStatusProps {
  status: ServiceStatus;
}

const ServiceStatusBadge: React.FC<ServiceStatusProps> = ({ status }) => {
  return (
    <div className="flex items-center mt-1">
      <span className="text-sm text-muted-foreground mr-2">Status:</span>
      <React.Suspense fallback={<span className="text-sm">Carregando...</span>}>
        <StatusBadge status={status} />
      </React.Suspense>
    </div>
  );
};

export default ServiceStatusBadge;
