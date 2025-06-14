
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TechnicalField } from "@/types/serviceTypes";

interface Props {
  editingField: TechnicalField;
  isNewField: boolean;
  onChange: (field: TechnicalField) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export const TechnicalFieldForm: React.FC<Props> = ({
  editingField,
  isNewField,
  onChange,
  onCancel,
  onSave,
  isSaving,
}) => (
  <div className="p-3 border rounded-md">
    <h4 className="font-medium mb-3">
      {isNewField ? "Novo Campo" : "Editar Campo"}
    </h4>
    <div className="space-y-3">
      <div>
        <Label htmlFor="field-name">Nome do Campo</Label>
        <Input
          id="field-name"
          value={editingField.name}
          onChange={(e) => onChange({ ...editingField, name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="field-type">Tipo</Label>
        <select
          id="field-type"
          value={editingField.type}
          onChange={(e) =>
            onChange({
              ...editingField,
              type: e.target.value as TechnicalField["type"],
            })
          }
          className="w-full p-2 border rounded-md bg-background"
        >
          <option value="text">Texto</option>
          <option value="number">Número</option>
          <option value="select">Seleção</option>
          <option value="boolean">Sim/Não</option>
          <option value="date">Data</option>
          <option value="textarea">Área de Texto</option>
        </select>
      </div>
      {editingField.type === "select" && (
        <div>
          <Label htmlFor="field-options">Opções (separadas por vírgula)</Label>
          <Input
            id="field-options"
            value={editingField.options?.join(",") || ""}
            onChange={(e) =>
              onChange({
                ...editingField,
                options: e.target.value.split(",").map((o) => o.trim()),
              })
            }
          />
        </div>
      )}
      <div className="flex items-center space-x-2">
        <Switch
          id="field-required"
          checked={editingField.required}
          onCheckedChange={(checked) =>
            onChange({ ...editingField, required: checked })
          }
        />
        <Label htmlFor="field-required">Campo Obrigatório</Label>
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          Salvar Campo
        </Button>
      </div>
    </div>
  </div>
);

