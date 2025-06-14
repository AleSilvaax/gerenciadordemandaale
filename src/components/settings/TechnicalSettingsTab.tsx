import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Save, RotateCw, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ServiceTypeConfig, TechnicalField } from "@/types/serviceTypes";
import {
  getServiceTypesFromDatabase,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  createTechnicalField,
  updateTechnicalField,
  deleteTechnicalField,
} from "@/services/servicesDataService";

// Remover mocks e usaremos apenas dados do Supabase:
export const TechnicalSettingsTab = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceTypeConfig | null>(null);
  const [editingField, setEditingField] = useState<TechnicalField | null>(null);
  const [isNewField, setIsNewField] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregando tipos do banco
  useEffect(() => {
    refreshTypes();
  }, []);

  async function refreshTypes() {
    setIsSaving(true);
    const types = await getServiceTypesFromDatabase();
    setServiceTypes(types);
    // se estava editando um tipo, buscar versão atualizada
    if(selectedType) {
      const updated = types.find(t => t.id === selectedType.id);
      setSelectedType(updated || null);
    }
    setIsSaving(false);
  }

  // Selecionar tipo
  const handleSelectType = (type: ServiceTypeConfig) => {
    setSelectedType(type);
    setEditingField(null);
  };

  // Criar novo tipo de serviço
  const handleCreateNewType = async () => {
    setIsSaving(true);
    try {
      const data = await createServiceType({ name: "Novo Tipo de Serviço", description: "" });
      await refreshTypes();
      setSelectedType({
        id: data.id,
        name: data.name,
        description: data.description,
        fields: [],
      });
      toast.success("Tipo de serviço criado.");
    } catch {
      toast.error("Erro ao criar tipo.");
    }
    setIsSaving(false);
  };

  // Salvar alterações no tipo
  const handleUpdateType = async () => {
    if (!selectedType) return;
    setIsSaving(true);
    try {
      await updateServiceType(selectedType);
      await refreshTypes();
      toast.success("Tipo de serviço atualizado.");
    } catch {
      toast.error("Erro ao atualizar tipo.");
    }
    setIsSaving(false);
  };

  // Excluir tipo de serviço
  const handleDeleteType = async () => {
    if (!selectedType) return;
    setIsSaving(true);
    try {
      await deleteServiceType(selectedType.id);
      await refreshTypes();
      setSelectedType(null);
      toast.success("Tipo excluído.");
    } catch (err: any) {
      console.error("Erro ao excluir tipo:", err);
      if (err && err.message) {
        toast.error(`Erro ao excluir tipo: ${err.message}`);
      } else {
        toast.error("Erro ao excluir tipo.");
      }
    }
    setIsSaving(false);
  };

  // Adicionar campo técnico
  const handleAddField = () => {
    setEditingField({
      id: "",
      name: "Novo Campo",
      type: "text",
      required: false,
      options: [],
      description: "",
    });
    setIsNewField(true);
  };

  // Editar campo técnico
  const handleEditField = (field: TechnicalField) => {
    setEditingField({ ...field });
    setIsNewField(false);
  };

  // Salvar campo técnico (cria ou atualiza)
  const handleSaveField = async () => {
    if (!selectedType || !editingField) return;
    setIsSaving(true);
    try {
      if (isNewField) {
        await createTechnicalField(selectedType.id, {
          ...editingField,
          id: undefined, // para o insert
        } as any);
      } else {
        await updateTechnicalField(editingField);
      }
      setEditingField(null);
      setIsNewField(false);
      await refreshTypes();
      toast.success("Campo salvo.");
    } catch {
      toast.error("Erro ao salvar campo.");
    }
    setIsSaving(false);
  };

  // Excluir campo técnico
  const handleDeleteField = async (fieldId: string) => {
    if (!selectedType) return;
    setIsSaving(true);
    try {
      await deleteTechnicalField(fieldId);
      await refreshTypes();
      toast.success("Campo excluído.");
    } catch {
      toast.error("Erro ao excluir campo.");
    }
    setIsSaving(false);
  };

  const handleExportSettings = () => {
    try {
      const dataStr = JSON.stringify(serviceTypes, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'configuracoes-tecnicas.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success("Configurações exportadas com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar configurações");
      console.error("Export error:", error);
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedTypes = JSON.parse(content) as ServiceTypeConfig[];
        
        setIsSaving(true);
        setTimeout(() => {
          setServiceTypes(importedTypes);
          setSelectedType(null);
          setIsSaving(false);
          toast.success("Configurações importadas com sucesso");
        }, 1000);
      } catch (error) {
        toast.error("Erro ao importar configurações");
        console.error("Import error:", error);
        setIsSaving(false);
      }
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
      setIsSaving(false);
    };
    reader.readAsText(file);
  };

  const resetToDefaults = () => {
    // setServiceTypes(defaultServiceTypes);
    setSelectedType(null);
    toast.success("Configurações restauradas para os valores padrão");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Técnicas</CardTitle>
          <CardDescription>
            Gerencie tipos de serviço e campos técnicos personalizados
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            {/* Lista de Tipos de Serviço */}
            <div className="lg:col-span-2 border rounded-lg p-3 h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Tipos de Serviço</h3>
                <Button size="sm" variant="ghost" onClick={handleCreateNewType}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Separator className="my-2" />
              <ScrollArea className="flex-grow">
                <div className="space-y-1 pr-3">
                  {serviceTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleSelectType(type)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedType?.id === type.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* Detalhes do Tipo Selecionado */}
            <div className="lg:col-span-5 border rounded-lg p-4 h-[500px] flex flex-col">
              {selectedType ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1 flex-grow">
                      <Label htmlFor="type-name">Nome do Tipo de Serviço</Label>
                      <Input
                        id="type-name"
                        value={selectedType.name}
                        onChange={(e) => setSelectedType({...selectedType, name: e.target.value})}
                      />
                    </div>
                    <div className="flex ml-2 space-x-2">
                      <Button size="sm" variant="destructive" onClick={handleDeleteType}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-4">
                    <div>
                      <Label htmlFor="type-description">Descrição</Label>
                      <Textarea
                        id="type-description"
                        value={selectedType.description}
                        onChange={(e) => setSelectedType({...selectedType, description: e.target.value})}
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Campos Personalizados</h3>
                    <Button size="sm" variant="ghost" onClick={handleAddField}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <ScrollArea className="flex-grow pr-3">
                    {editingField ? (
                      <div className="p-3 border rounded-md">
                        <h4 className="font-medium mb-3">
                          {isNewField ? "Novo Campo" : "Editar Campo"}
                        </h4>
                        
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="field-name">Nome do Campo</Label>
                            <Input
                              id="field-name"
                              value={editingField.name}
                              onChange={(e) => setEditingField({...editingField, name: e.target.value})}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="field-type">Tipo</Label>
                            <select
                              id="field-type"
                              value={editingField.type}
                              onChange={(e) => setEditingField({
                                ...editingField, 
                                type: e.target.value as TechnicalField['type']
                              })}
                              className="w-full p-2 border rounded-md bg-background"
                            >
                              <option value="text">Texto</option>
                              <option value="number">Número</option>
                              <option value="select">Seleção</option>
                              <option value="boolean">Sim/Não</option>
                              <option value="date">Data</option>
                              <option value="textarea">Área de Texto</option>
                            </select>
                          </div>
                          
                          {editingField.type === 'select' && (
                            <div>
                              <Label htmlFor="field-options">Opções (separadas por vírgula)</Label>
                              <Input
                                id="field-options"
                                value={editingField.options?.join(',') || ''}
                                onChange={(e) => setEditingField({
                                  ...editingField, 
                                  options: e.target.value.split(',').map(o => o.trim())
                                })}
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="field-required"
                              checked={editingField.required}
                              onCheckedChange={(checked) => 
                                setEditingField({...editingField, required: checked})
                              }
                            />
                            <Label htmlFor="field-required">Campo Obrigatório</Label>
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingField(null)}
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleSaveField}>
                              Salvar Campo
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {selectedType.fields.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>Nenhum campo personalizado definido</p>
                            <Button variant="ghost" className="mt-2" onClick={handleAddField}>
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Campo
                            </Button>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Obrigatório</TableHead>
                                <TableHead className="w-[100px]">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedType.fields.map(field => (
                                <TableRow key={field.id}>
                                  <TableCell>{field.name}</TableCell>
                                  <TableCell>
                                    {field.type === 'text' && 'Texto'}
                                    {field.type === 'number' && 'Número'}
                                    {field.type === 'select' && 'Seleção'}
                                    {field.type === 'boolean' && 'Sim/Não'}
                                    {field.type === 'date' && 'Data'}
                                    {field.type === 'textarea' && 'Área de Texto'}
                                  </TableCell>
                                  <TableCell>{field.required ? 'Sim' : 'Não'}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-1">
                                      <Button size="sm" variant="ghost" onClick={() => handleEditField(field)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteField(field.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handleUpdateType}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Selecione um tipo de serviço para editar ou crie um novo
                    </p>
                    <Button onClick={handleCreateNewType}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Novo Tipo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-5">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCw className="h-4 w-4 mr-2" />
              Restaurar Padrões
            </Button>
            
            <Button variant="outline" onClick={handleExportSettings}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <div className="relative">
              <input
                type="file"
                id="import-file"
                className="absolute inset-0 opacity-0 w-full cursor-pointer"
                accept=".json"
                onChange={handleImportSettings}
              />
              <Button variant="outline" disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importando...
                  </span>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
