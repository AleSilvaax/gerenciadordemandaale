import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomField } from '@/types/serviceTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CustomFieldManagerProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

export const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({
  fields,
  onChange
}) => {
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'textarea' | 'boolean' | 'select'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const handleAddField = () => {
    if (!newFieldLabel.trim()) {
      toast.error('O rótulo do campo não pode estar vazio');
      return;
    }

    // Create default value based on field type
    let defaultValue: string | number | boolean = '';
    if (newFieldType === 'number') defaultValue = 0;
    if (newFieldType === 'boolean') defaultValue = false;

    // Create options array for select field
    const options = newFieldType === 'select' 
      ? newFieldOptions.split(',').map(option => option.trim()).filter(option => option !== '')
      : undefined;

    if (newFieldType === 'select' && (!options || options.length === 0)) {
      toast.error('Selecione pelo menos uma opção para o campo de seleção');
      return;
    }

    const newField: CustomField = {
      id: `field-${Date.now()}`,
      label: newFieldLabel,
      type: newFieldType,
      value: defaultValue,
      options
    };

    onChange([...fields, newField]);
    
    // Reset form
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldOptions('');
    
    toast.success('Campo adicionado com sucesso');
  };

  const handleRemoveField = (fieldId: string) => {
    onChange(fields.filter(field => field.id !== fieldId));
    toast.success('Campo removido com sucesso');
  };

  const handleFieldChange = (fieldId: string, value: string | number | boolean) => {
    const updatedFields = fields.map(field => {
      if (field.id === fieldId) {
        return { ...field, value };
      }
      return field;
    });
    onChange(updatedFields);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Campos Personalizados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.length > 0 ? (
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-grow">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  
                  {field.type === 'text' && (
                    <Input
                      id={field.id}
                      value={field.value as string}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="mt-1"
                    />
                  )}
                  
                  {field.type === 'number' && (
                    <Input
                      id={field.id}
                      type="number"
                      value={field.value as number}
                      onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  )}
                  
                  {field.type === 'boolean' && (
                    <Select
                      value={(field.value as boolean).toString()}
                      onValueChange={(value) => handleFieldChange(field.id, value === 'true')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.type === 'textarea' && (
                    <textarea
                      id={field.id}
                      value={field.value as string}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full p-2 mt-1 border rounded-md"
                      rows={3}
                    />
                  )}
                  
                  {field.type === 'select' && field.options && (
                    <Select
                      value={field.value as string}
                      onValueChange={(value) => handleFieldChange(field.id, value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
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
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="mt-4"
                  onClick={() => handleRemoveField(field.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum campo personalizado adicionado
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="font-medium mb-4">Adicionar novo campo</h3>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-field-label">Rótulo do Campo</Label>
              <Input
                id="new-field-label"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Ex: Número do Equipamento"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-field-type">Tipo do Campo</Label>
              <Select
                value={newFieldType}
                onValueChange={(value) => setNewFieldType(value as any)}
              >
                <SelectTrigger id="new-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="textarea">Texto Longo</SelectItem>
                  <SelectItem value="boolean">Sim/Não</SelectItem>
                  <SelectItem value="select">Selecionar Opções</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newFieldType === 'select' && (
              <div className="space-y-2">
                <Label htmlFor="new-field-options">Opções (separadas por vírgula)</Label>
                <Input
                  id="new-field-options"
                  value={newFieldOptions}
                  onChange={(e) => setNewFieldOptions(e.target.value)}
                  placeholder="Opção 1, Opção 2, Opção 3"
                />
              </div>
            )}
            
            <Button 
              type="button" 
              onClick={handleAddField}
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
