
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalField } from '@/types/serviceTypes';

interface TechnicalFieldsRendererProps {
  fields: TechnicalField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  readonly?: boolean;
}

export const TechnicalFieldsRenderer: React.FC<TechnicalFieldsRendererProps> = ({
  fields,
  values,
  onChange,
  readonly = false
}) => {
  const renderField = (field: TechnicalField) => {
    const value = values[field.id] || '';
    const isRequired = field.required;

    const handleChange = (newValue: any) => {
      if (!readonly) {
        onChange(field.id, newValue);
      }
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.description || `Digite ${field.name.toLowerCase()}`}
            required={isRequired}
            disabled={readonly}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.description || `Digite ${field.name.toLowerCase()}`}
            required={isRequired}
            disabled={readonly}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.description || `Digite ${field.name.toLowerCase()}`}
            required={isRequired}
            disabled={readonly}
            rows={3}
          />
        );

      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={handleChange}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={Boolean(value)}
              onCheckedChange={handleChange}
              disabled={readonly}
            />
            <Label 
              htmlFor={field.id}
              className={readonly ? 'cursor-default' : 'cursor-pointer'}
            >
              {field.description || field.name}
            </Label>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={isRequired}
            disabled={readonly}
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.description || `Digite ${field.name.toLowerCase()}`}
            required={isRequired}
            disabled={readonly}
          />
        );
    }
  };

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Nenhum campo técnico configurado para este tipo de serviço.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campos Técnicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-1">
              {field.name}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.description && field.type !== 'checkbox' && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {renderField(field)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
