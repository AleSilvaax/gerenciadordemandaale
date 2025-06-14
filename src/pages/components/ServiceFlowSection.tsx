
import React from "react";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";

interface ServiceFlowSectionProps {
  service: any;
  statusUpdating: boolean;
  onConvertToInstallation: () => void;
  onFinalize: () => void;
}

const ServiceFlowSection: React.FC<ServiceFlowSectionProps> = ({
  service,
  statusUpdating,
  onConvertToInstallation,
  onFinalize,
}) => (
  <div>
    <h3 className="text-lg font-medium mb-4">Fluxo da Demanda</h3>
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
      <div className="flex-1">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Status atual: <span className="font-semibold">
            {service.status === 'concluido'
              ? 'Concluído'
              : service.status === 'cancelado'
              ? 'Cancelado'
              : 'Pendente'}
          </span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Tipo de serviço: <span className="font-semibold">
            {service.serviceType === 'Instalação' ? 'Instalação' : 'Vistoria'}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {service.serviceType === 'Vistoria' && service.status === 'pendente' && (
          <Button
            onClick={onConvertToInstallation}
            disabled={statusUpdating}
            variant="outline"
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Converter para Instalação
          </Button>
        )}

        {service.status === 'pendente' && (
          <Button
            onClick={onFinalize}
            disabled={statusUpdating}
            variant="default"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Finalizar Demanda
          </Button>
        )}
      </div>
    </div>
  </div>
);

export default ServiceFlowSection;
