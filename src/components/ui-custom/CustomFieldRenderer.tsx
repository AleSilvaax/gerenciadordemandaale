
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomField } from './CustomFieldManager';
import { Card, CardContent } from '@/components/ui/card';

interface CustomFieldRendererProps {
  fields: CustomField[];
  onFieldChange?: (fieldId: string, value: string | number | boolean) => void;
  disabled?: boolean;
}

export const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  fields,
  onFieldChange = () => {}, // Add default empty function
  disabled = false
}) => {
  if (!fields || fields.length === 0) {
    return <div className="text-sm text-muted-foreground">Nenhum campo personalizado configurado</div>;
  }

  // Handle field changes only if the callback is provided
  const handleFieldChange = (fieldId: string, value: string | number | boolean) => {
    if (onFieldChange) {
      onFieldChange(fieldId, value);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-6 space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <Label htmlFor={field.id}>{field.label}</Label>
            
            {field.type === 'text' && (
              <Input
                id={field.id}
                value={field.value as string}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                disabled={disabled}
                className="mt-1"
                readOnly={!onFieldChange}
              />
            )}
            
            {field.type === 'number' && (
              <Input
                id={field.id}
                type="number"
                value={field.value as number}
                onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="mt-1"
                readOnly={!onFieldChange}
              />
            )}
            
            {field.type === 'textarea' && (
              <Textarea
                id={field.id}
                value={field.value as string}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                rows={3}
                disabled={disabled}
                className="mt-1"
                readOnly={!onFieldChange}
              />
            )}
            
            {field.type === 'boolean' && (
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id={field.id}
                  checked={field.value as boolean}
                  onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                  disabled={disabled || !onFieldChange}
                />
                <Label htmlFor={field.id} className="cursor-pointer">
                  {field.value ? 'Sim' : 'Não'}
                </Label>
              </div>
            )}
            
            {field.type === 'select' && field.options && (
              <Select
                value={field.value as string}
                onValueChange={(value) => handleFieldChange(field.id, value)}
                disabled={disabled || !onFieldChange}
              >
                <SelectTrigger id={field.id} className="mt-1">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
