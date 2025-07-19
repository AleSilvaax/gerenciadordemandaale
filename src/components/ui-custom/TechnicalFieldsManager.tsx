
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { 
  getServiceTypesFromDatabase,
  createTechnicalField,
  updateTechnicalField
} from '@/services/serviceTypesService';
import { toast } from "sonner";

interface TechnicalFieldsManagerProps {
  onFieldsChange?: (fields: any[]) => void;
}

export const TechnicalFieldsManager: React.FC<TechnicalFieldsManagerProps> = ({ 
  onFieldsChange 
}) => {
  const [selectedServiceType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);

  const [fieldData, setFieldData] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'textarea' | 'boolean' | 'select' | 'date' | 'checkbox',
    required: false,
    description: '',
    options: [] as string[]
  });

  useEffect(() => {
    loadServiceTypes();
  }, []);

  const loadServiceTypes = async () => {
    setIsLoading(true);
    try {
      const types = await getServiceTypesFromDatabase();
      console.log('Service types loaded:', types);
    } catch (error) {
      console.error('[TechnicalFieldsManager] Error loading service types:', error);
      toast.error("Erro ao carregar tipos de serviço");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!selectedServiceType) {
      toast.error("Selecione um tipo de serviço");
      return;
    }

    if (!fieldData.name.trim()) {
      toast.error("Nome do campo é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      await createTechnicalField(selectedServiceType, fieldData);
      toast.success("Campo adicionado com sucesso!");
      
      // Reset form
      setFieldData({
        name: '',
        type: 'text',
        required: false,
        description: '',
        options: []
      });
      
      if (onFieldsChange) {
        onFieldsChange([]);
      }
    } catch (error) {
      console.error('[TechnicalFieldsManager] Error adding field:', error);
      toast.error("Erro ao adicionar campo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateField = async () => {
    if (!editingField) return;

    setIsLoading(true);
    try {
      await updateTechnicalField({
        ...editingField,
        ...fieldData
      });
      toast.success("Campo atualizado com sucesso!");
      setEditingField(null);
      
      if (onFieldsChange) {
        onFieldsChange([]);
      }
    } catch (error) {
      console.error('[TechnicalFieldsManager] Error updating field:', error);
      toast.error("Erro ao atualizar campo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Gerenciar Campos Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">Nome do Campo</Label>
              <Input
                id="field-name"
                value={fieldData.name}
                onChange={(e) => setFieldData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Modelo do Equipamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-type">Tipo do Campo</Label>
              <Select 
                value={fieldData.type} 
                onValueChange={(value: any) => setFieldData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="textarea">Área de Texto</SelectItem>
                  <SelectItem value="select">Lista de Opções</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-description">Descrição (Opcional)</Label>
            <Textarea
              id="field-description"
              value={fieldData.description}
              onChange={(e) => setFieldData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o propósito deste campo..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="field-required"
              checked={fieldData.required}
              onCheckedChange={(checked) => setFieldData(prev => ({ ...prev, required: checked }))}
            />
            <Label htmlFor="field-required">Campo obrigatório</Label>
          </div>

          <div className="flex gap-2">
            {editingField ? (
              <>
                <Button onClick={handleUpdateField} disabled={isLoading}>
                  Atualizar Campo
                </Button>
                <Button variant="outline" onClick={() => setEditingField(null)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={handleAddField} disabled={isLoading}>
                Adicionar Campo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
