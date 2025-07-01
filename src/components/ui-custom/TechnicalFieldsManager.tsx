
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
import { CheckCircle, Circle, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
        
        const currentType = types.find(type => type.name === serviceType);
        if (currentType && currentType.fields.length > 0) {
          const technicalFields: CustomField[] = currentType.fields.map(field => {
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
    if (field.type === 'boolean') return true;
    if (field.type === 'number') return (field.value as number) > 0;
    return String(field.value).trim().length > 0;
  };

  const handleFieldChange = (fieldId: string, value: string | number | boolean) => {
    const updatedFields = fields.map(field => 
      field.id === fieldId ? { ...field, value } : field
    );
    setFields(updatedFields);

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
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            placeholder="Digite aqui..."
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={field.value as number}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            placeholder="0"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={field.value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            rows={3}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
            placeholder="Digite suas observações..."
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border border-border/50">
            <Checkbox
              checked={field.value as boolean}
              onCheckedChange={(checked) => handleFieldChange(field.id, !!checked)}
              disabled={disabled}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className={`text-sm font-medium ${field.value ? 'text-primary' : 'text-muted-foreground'}`}>
              {field.value ? 'Sim' : 'Não'}
            </span>
          </div>
        );

      case 'select':
        return (
          <Select
            value={field.value as string}
            onValueChange={(value) => handleFieldChange(field.id, value)}
            disabled={disabled}
          >
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        );

      default:
        return (
          <Input
            value={field.value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            placeholder="Digite aqui..."
          />
        );
    }
  };

  if (!fields || fields.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
        <CardContent className="py-12 text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">Nenhum campo técnico configurado</p>
          <p className="text-sm text-muted-foreground mt-2">Configure os campos técnicos para este tipo de serviço</p>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = Math.round((completedFields.size / fields.length) * 100);

  return (
    <Card className="bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Checklist Técnico</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha todos os campos obrigatórios
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-sm px-3 py-1">
              {completedFields.size}/{fields.length} concluídos
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {completionPercentage}%
              </div>
              <div className="text-xs text-muted-foreground">
                Concluído
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full bg-secondary/50 rounded-full h-3 mt-4">
          <div 
            className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {fields.map((field) => {
            const isCompleted = completedFields.has(field.id);
            
            return (
              <div key={field.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={field.id} className="text-base font-medium">
                      {field.label}
                    </Label>
                    {field.type === 'boolean' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Marque se aplicável
                      </p>
                    )}
                  </div>
                  {isCompleted && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      Completo
                    </Badge>
                  )}
                </div>
                
                <div className="ml-9">
                  {renderField(field)}
                </div>
              </div>
            );
          })}
        </div>
        
        {!disabled && (
          <div className="pt-6 border-t border-border/50">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? "Salvando..." : "Salvar Campos Técnicos"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
