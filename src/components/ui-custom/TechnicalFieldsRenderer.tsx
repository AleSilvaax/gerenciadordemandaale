
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TechnicalField, CustomField } from '@/types/serviceTypes';

interface TechnicalFieldsRendererProps {
  fields: TechnicalField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  disabled?: boolean;
}

export const TechnicalFieldsRenderer: React.FC<TechnicalFieldsRendererProps> = ({
  fields,
  values,
  onChange,
  disabled = false
}) => {
  if (!fields || fields.length === 0) {
    return null;
  }

  const renderField = (field: TechnicalField) => {
    const value = values[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            disabled={disabled}
            placeholder={field.description}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(field.id, parseFloat(e.target.value) || 0)}
            disabled={disabled}
            placeholder={field.description}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            disabled={disabled}
            placeholder={field.description}
            rows={3}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(field.id, checked)}
              disabled={disabled}
            />
            <span className="text-sm">Sim</span>
          </div>
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => onChange(field.id, newValue)}
            disabled={disabled}
          >
            <SelectTrigger>
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
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            disabled={disabled}
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(field.id, e.target.value)}
            disabled={disabled}
            placeholder={field.description}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Campos Técnicos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(field)}
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
