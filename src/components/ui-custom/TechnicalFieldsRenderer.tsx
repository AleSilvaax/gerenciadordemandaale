
import React from 'react';
import { Calendar, CheckSquare, ClipboardList, FileText, Hash, Pencil, Wrench } from 'lucide-react';
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
      case 'text': return <Pencil className="h-5 w-5" aria-hidden="true" />;
      case 'number': return <Hash className="h-5 w-5" aria-hidden="true" />;
      case 'textarea': return <FileText className="h-5 w-5" aria-hidden="true" />;
      case 'boolean': return <CheckSquare className="h-5 w-5" aria-hidden="true" />;
      case 'select': return <ClipboardList className="h-5 w-5" aria-hidden="true" />;
      case 'date': return <Calendar className="h-5 w-5" aria-hidden="true" />;
      default: return <Pencil className="h-5 w-5" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/30">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
          <Wrench className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Checklist Técnico</h3>
          <p className="text-sm text-muted-foreground">Preencha os campos técnicos necessários</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id} className="group">
            <div className="relative p-4 bg-gradient-to-br from-card/80 to-card/40 rounded-xl border border-border/30 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center text-base border border-primary/20">
                  {getFieldIcon(field.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor={field.id} className="font-semibold text-foreground flex items-center gap-2 text-base">
                    {field.name}
                    {field.required && (
                      <span className="flex items-center justify-center w-5 h-5 bg-red-500/20 text-red-600 rounded-full text-xs font-bold animate-pulse">
                        *
                      </span>
                    )}
                  </Label>
                  {field.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{field.description}</p>
                  )}
                </div>
                
                {/* Indicador visual de preenchimento */}
                <div className="flex-shrink-0">
                  {values[field.id] ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/30" />
                  ) : (
                    <div className="w-3 h-3 bg-muted/30 rounded-full" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {renderField(field)}
              </div>
              
              {/* Borda animada para campos obrigatórios não preenchidos */}
              {field.required && !values[field.id] && (
                <div className="absolute inset-0 rounded-xl border-2 border-red-500/20 animate-pulse pointer-events-none" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Progresso do preenchimento */}
      <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso do Checklist</span>
          <span className="text-sm text-muted-foreground">
            {Object.values(values).filter(v => v).length} de {fields.length} campos preenchidos
          </span>
        </div>
        <div className="w-full bg-background/50 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
            style={{ width: `${(Object.values(values).filter(v => v).length / fields.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
