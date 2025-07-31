
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

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'textarea': return '📄';
      case 'boolean': return '✅';
      case 'select': return '📋';
      case 'date': return '📅';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/30">
        <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
          <span className="text-lg">🔧</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Checklist Técnico</h3>
          <p className="text-sm text-muted-foreground">Preencha os campos técnicos necessários</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id} className="group">
            <div className="relative p-4 bg-gradient-to-br from-background/80 to-background/40 rounded-xl border border-border/30 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm">
                  {getFieldIcon(field.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor={field.id} className="font-semibold text-foreground flex items-center gap-2">
                    {field.name}
                    {field.required && (
                      <span className="flex items-center justify-center w-4 h-4 bg-red-500/20 text-red-600 rounded-full text-xs font-bold">
                        *
                      </span>
                    )}
                  </Label>
                  {field.description && (
                    <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {renderField(field)}
              </div>
              
              {/* Indicador visual de preenchimento */}
              <div className="absolute top-2 right-2">
                {values[field.id] && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
