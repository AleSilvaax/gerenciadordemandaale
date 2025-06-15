
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getServiceTypesFromDatabase } from "@/services/servicesDataService";
import { ServiceTypeConfig, TechnicalField, CustomField } from "@/types/serviceTypes";
import { CheckCircle, Circle, Save } from "lucide-react";
import { toast } from "sonner";

interface TechnicalFieldsManagerProps {
  serviceType: string;
  currentFields: CustomField[];
  onFieldsUpdate: (fields: CustomField[]) => Promise<void>;
  disabled?: boolean;
}

export const TechnicalFieldsManager: React.FC<TechnicalFieldsManagerProps> = ({
  serviceType,
  currentFields,
  onFieldsUpdate,
  disabled = false
}) => {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const [fields, setFields] = useState<CustomField[]>(currentFields);
  const [saving, setSaving] = useState(false);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const types = await getServiceTypesFromDatabase();
        setServiceTypes(types);
        
        // Encontrar o tipo de serviço atual e seus campos
        const currentType = types.find(type => type.name === serviceType);
        if (currentType && currentType.fields.length > 0) {
          // Criar campos personalizados baseados nos campos técnicos do tipo
          const technicalFields: CustomField[] = currentType.fields.map(field => {
            // Verificar se já existe um valor salvo para este campo
            const existingField = currentFields.find(cf => cf.id === field.id);
            
            return {
              id: field.id,
              label: field.name,
              type: field.type as CustomField['type'],
              value: existingField?.value || getDefaultValue(field.type),
              options: field.options
            };
          });
          
          setFields(technicalFields);
          
          // Marcar campos que já estão preenchidos
          const completed = new Set<string>();
          technicalFields.forEach(field => {
            if (isFieldCompleted(field)) {
              completed.add(field.id);
            }
          });
          setCompletedFields(completed);
        }
      } catch (error) {
        console.error("Erro ao carregar tipos de serviço:", error);
        toast.error("Erro ao carregar campos técnicos");
      }
    };

    fetchServiceTypes();
  }, [serviceType, currentFields]);

  const getDefaultValue = (type: string): string | number | boolean => {
    switch (type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      default:
        return '';
    }
  };

  const isFieldCompleted = (field: CustomField): boolean => {
    if (field.type === 'boolean') return true; // Boolean sempre considerado completo
    if (field.type === 'number') return (field.value as number) > 0;
    return String(field.value).trim().length > 0;
  };

  const handleFieldChange = (fieldId: string, value: string | number | boolean) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId ? { ...field, value } : field
    );
    setFields(updatedFields);

    // Atualizar campos completos
    const newCompletedFields = new Set(completedFields);
    const field = updatedFields.find(f => f.id === fieldId);
    if (field && isFieldCompleted(field)) {
      newCompletedFields.add(fieldId);
    } else {
      newCompletedFields.delete(fieldId);
    }
    setCompletedFields(newCompletedFields);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onFieldsUpdate(fields);
      toast.success("Campos técnicos salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar campos:", error);
      toast.error("Erro ao salvar campos técnicos");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: CustomField) => {
    const isCompleted = completedFields.has(field.id);
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={field.value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className="bg-background/50"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={field.value as number}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className="bg-background/50"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={field.value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            rows={3}
            className="bg-background/50"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={field.value as boolean}
              onCheckedChange={(checked) => handleFieldChange(field.id, !!checked)}
              disabled={disabled}
            />
            <span className="text-sm">{field.value ? 'Sim' : 'Não'}</span>
          </div>
        );

      case 'select':
        return (
          <Select
            value={field.value as string}
            onValueChange={(value) => handleFieldChange(field.id, value)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={field.value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className="bg-background/50"
          />
        );

      default:
        return (
          <Input
            value={field.value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className="bg-background/50"
          />
        );
    }
  };

  if (!fields || fields.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Nenhum campo técnico configurado para este tipo de serviço</p>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = Math.round((completedFields.size / fields.length) * 100);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Checklist Técnico</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {completedFields.size}/{fields.length} concluídos
            </span>
            <div className="text-sm font-medium text-primary">
              {completionPercentage}%
            </div>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const isCompleted = completedFields.has(field.id);
          
          return (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <Label htmlFor={field.id} className="font-medium">
                  {field.label}
                </Label>
              </div>
              
              <div className="ml-7">
                {renderField(field)}
              </div>
            </div>
          );
        })}
        
        {!disabled && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Campos Técnicos"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
