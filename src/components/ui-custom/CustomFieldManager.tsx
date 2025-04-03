
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Edit, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea';

export interface CustomField {
  id: string;
  label: string;
  type: FieldType;
  value: string | number | boolean;
  options?: string[]; // For select type
}

interface CustomFieldManagerProps {
  fields: CustomField[];
  onAddField: (field: CustomField) => void;
  onUpdateField: (fieldId: string, updates: Partial<CustomField>) => void;
  onRemoveField: (fieldId: string) => void;
  categoryName?: string;
}

export const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({
  fields,
  onAddField,
  onUpdateField,
  onRemoveField,
  categoryName = "Campos personalizados"
}) => {
  const [newField, setNewField] = useState<Partial<CustomField>>({
    label: '',
    type: 'text',
    value: '',
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomField>>({});
  const [newOption, setNewOption] = useState('');
  const [selectOptions, setSelectOptions] = useState<string[]>([]);

  const generateId = () => {
    return `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  const handleAddField = () => {
    if (!newField.label) {
      toast.warning("Campo inválido", { 
        description: "O campo precisa ter um nome." 
      });
      return;
    }

    const fieldToAdd: CustomField = {
      id: generateId(),
      label: newField.label || 'Campo',
      type: newField.type as FieldType || 'text',
      value: newField.type === 'boolean' ? false : newField.value || '',
      ...(newField.type === 'select' ? { options: selectOptions } : {})
    };

    onAddField(fieldToAdd);
    setNewField({ label: '', type: 'text', value: '' });
    setSelectOptions([]);
    
    toast.success("Campo adicionado", { 
      description: `O campo "${fieldToAdd.label}" foi adicionado com sucesso.` 
    });
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field.id);
    setEditForm({...field});
    if (field.type === 'select' && field.options) {
      setSelectOptions([...field.options]);
    } else {
      setSelectOptions([]);
    }
  };

  const handleSaveEdit = () => {
    if (!editingField || !editForm.label) return;
    
    const updatedField: Partial<CustomField> = {...editForm};
    
    if (updatedField.type === 'select') {
      updatedField.options = selectOptions;
    }
    
    onUpdateField(editingField, updatedField);
    setEditingField(null);
    
    toast.success("Campo atualizado", { 
      description: `O campo "${updatedField.label}" foi atualizado com sucesso.` 
    });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditForm({});
    setSelectOptions([]);
  };

  const handleAddOption = () => {
    if (!newOption) return;
    setSelectOptions([...selectOptions, newOption]);
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...selectOptions];
    newOptions.splice(index, 1);
    setSelectOptions(newOptions);
  };

  const handleTypeChange = (type: string, isEditing = false) => {
    if (isEditing) {
      setEditForm({ ...editForm, type: type as FieldType });
      if (type === 'boolean') {
        setEditForm({ ...editForm, type: type as FieldType, value: false });
      } else if (type === 'number') {
        setEditForm({ ...editForm, type: type as FieldType, value: 0 });
      } else {
        setEditForm({ ...editForm, type: type as FieldType, value: '' });
      }
    } else {
      setNewField({ ...newField, type: type as FieldType });
      if (type === 'boolean') {
        setNewField({ ...newField, type: type as FieldType, value: false });
      } else if (type === 'number') {
        setNewField({ ...newField, type: type as FieldType, value: 0 });
      } else {
        setNewField({ ...newField, type: type as FieldType, value: '' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{categoryName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="newFieldLabel">Nome do campo</Label>
                <Input
                  id="newFieldLabel"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="Ex: Tensão do circuito"
                />
              </div>
              <div>
                <Label htmlFor="newFieldType">Tipo de campo</Label>
                <Select 
                  defaultValue="text" 
                  onValueChange={(value) => handleTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="boolean">Sim/Não</SelectItem>
                    <SelectItem value="select">Lista de opções</SelectItem>
                    <SelectItem value="textarea">Área de texto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={handleAddField}
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> 
                  Adicionar Campo
                </Button>
              </div>
            </div>

            {newField.type === 'select' && (
              <div className="border p-4 rounded-md mt-4 bg-secondary/50">
                <Label>Opções para seleção</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Nova opção"
                  />
                  <Button type="button" variant="outline" onClick={handleAddOption}>
                    Adicionar
                  </Button>
                </div>
                {selectOptions.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectOptions.map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                        <span>{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {fields.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Campos configurados</h3>
              <div className="space-y-4">
                {fields.map((field) => (
                  <div 
                    key={field.id} 
                    className="border rounded-md p-4 flex justify-between items-center"
                  >
                    {editingField === field.id ? (
                      <div className="w-full space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor={`edit-${field.id}-label`}>Nome do campo</Label>
                            <Input
                              id={`edit-${field.id}-label`}
                              value={editForm.label || ''}
                              onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-${field.id}-type`}>Tipo de campo</Label>
                            <Select 
                              value={editForm.type} 
                              onValueChange={(value) => handleTypeChange(value, true)}
                            >
                              <SelectTrigger id={`edit-${field.id}-type`}>
                                <SelectValue placeholder="Selecione um tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="boolean">Sim/Não</SelectItem>
                                <SelectItem value="select">Lista de opções</SelectItem>
                                <SelectItem value="textarea">Área de texto</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {editForm.type === 'select' && (
                          <div className="border p-4 rounded-md mt-2 bg-secondary/50">
                            <Label>Opções para seleção</Label>
                            <div className="flex items-center space-x-2 mt-2">
                              <Input
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                placeholder="Nova opção"
                              />
                              <Button type="button" variant="outline" onClick={handleAddOption}>
                                Adicionar
                              </Button>
                            </div>
                            {selectOptions.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {selectOptions.map((option, index) => (
                                  <div key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                                    <span>{option}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveOption(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex space-x-2 justify-end">
                          <Button type="button" variant="outline" onClick={handleCancelEdit}>
                            <X className="mr-2 h-4 w-4" /> Cancelar
                          </Button>
                          <Button type="button" onClick={handleSaveEdit}>
                            <Save className="mr-2 h-4 w-4" /> Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-muted-foreground">
                            Tipo: {field.type === 'text' ? 'Texto' : 
                                  field.type === 'number' ? 'Número' : 
                                  field.type === 'boolean' ? 'Sim/Não' : 
                                  field.type === 'select' ? 'Lista de opções' : 
                                  field.type === 'textarea' ? 'Área de texto' : field.type}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleEditField(field)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              onRemoveField(field.id);
                              toast.success("Campo removido", { 
                                description: `O campo "${field.label}" foi removido com sucesso.` 
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
