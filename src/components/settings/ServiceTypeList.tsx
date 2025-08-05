
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
  onCreateNewType?: () => void; // FASE 2: Opcional para controle de permissão
}

export const ServiceTypeList: React.FC<Props> = ({
  serviceTypes,
  selectedType,
  onSelectType,
  onCreateNewType,
}) => (
  <div className="lg:col-span-2 border rounded-lg p-3 h-[500px] flex flex-col">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium">Tipos de Serviço</h3>
      {onCreateNewType && (
        <Button size="sm" variant="ghost" onClick={onCreateNewType}>
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
    <Separator className="my-2" />
    <ScrollArea className="flex-grow">
      <div className="space-y-1 pr-3">
        {serviceTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelectType(type)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedType?.id === type.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>
    </ScrollArea>
  </div>
);

