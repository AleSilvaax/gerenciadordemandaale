
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Save } from "lucide-react";
import { ServiceTypeConfig } from "@/types/serviceTypes";

interface Props {
  selectedType: ServiceTypeConfig;
  onUpdateType: () => void;
  onChange: (type: ServiceTypeConfig) => void;
  onDeleteType: () => void;
  isSaving: boolean;
}

export const ServiceTypeForm: React.FC<Props> = ({
  selectedType,
  onChange,
  onUpdateType,
  onDeleteType,
  isSaving
}) => (
  <>
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-1 flex-grow">
        <Label htmlFor="type-name">Nome do Tipo de Serviço</Label>
        <Input
          id="type-name"
          value={selectedType.name}
          onChange={(e) => onChange({ ...selectedType, name: e.target.value })}
        />
      </div>
      <div className="flex ml-2 space-x-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={onDeleteType}
          disabled={isSaving}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
    <div className="space-y-4 mb-4">
      <div>
        <Label htmlFor="type-description">Descrição</Label>
        <Textarea
          id="type-description"
          value={selectedType.description}
          onChange={(e) => onChange({ ...selectedType, description: e.target.value })}
          rows={2}
        />
      </div>
    </div>
    <div className="mt-4 flex justify-end">
      <Button onClick={onUpdateType} disabled={isSaving}>
        <Save className="h-4 w-4 mr-2" />
        Salvar Alterações
      </Button>
    </div>
  </>
);

