
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { ServiceTypeConfig } from "@/types/serviceTypes";

interface Props {
  serviceTypes: ServiceTypeConfig[];
  selectedType: ServiceTypeConfig | null;
  onSelectType: (type: ServiceTypeConfig) => void;
  onCreateNewType: () => void;
}

export const ServiceTypeList: React.FC<Props> = ({
  serviceTypes,
  selectedType,
  onSelectType,
  onCreateNewType,
}) => (
  <div className="lg:col-span-2 border rounded-lg p-3 max-h-56 lg:h-[500px] lg:max-h-none flex flex-col">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium">Tipos de Serviço</h3>
      <Button size="sm" variant="ghost" onClick={onCreateNewType}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
    <Separator className="my-2" />
    <ScrollArea className="flex-grow">
      <div className="space-y-1 pr-3">
        {serviceTypes.map((type) => (
          <Button
            variant={selectedType?.id === type.id ? 'default' : 'ghost'}
            key={type.id}
            onClick={() => onSelectType(type)}
            className="w-full h-auto justify-start text-left px-3 py-2 whitespace-normal text-sm"
          >
            <span>{type.name}<span className="block text-xs opacity-80">{type.checklistSteps?.length ? `${type.checklistSteps.length} etapas · ${type.photoSlots?.length || 0} fotos` : 'Campos simples'}</span></span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  </div>
);

