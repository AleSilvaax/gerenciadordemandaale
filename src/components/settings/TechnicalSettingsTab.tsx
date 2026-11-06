import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Save, RotateCw, FileText, Pencil, Zap } from "lucide-react";
import { EV_TEMPLATE_NAME, evChargerTemplate } from "@/templates/evChargerTemplate";
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
  createGuidedServiceType,
  updateServiceType,
  deleteServiceType,
  createTechnicalField,
  updateTechnicalField,
  deleteTechnicalField,
} from "@/services/servicesDataService";
import { updateServiceTypeTemplate } from "@/services/serviceTypesService";
import type { ChecklistStep, PhotoSlotDef } from "@/types/checklist";
import { ChecklistBuilder } from "./ChecklistBuilder";
import { validateTemplate } from "./validateTemplate";

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
    try {
    const types = await getServiceTypesFromDatabase();
    setServiceTypes(types);
    // se estava editando um tipo, buscar versão atualizada
    if(selectedType) {
      const updated = types.find(t => t.id === selectedType.id);
      setSelectedType(updated || null);
    }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar tipos de serviço.');
    } finally { setIsSaving(false); }
  }

  // Checklist guiado (rascunho em edição)
  const [isGuided, setIsGuided] = useState(false);
  const [draftSteps, setDraftSteps] = useState<ChecklistStep[]>([]);
  const [draftSlots, setDraftSlots] = useState<PhotoSlotDef[]>([]);

  useEffect(() => {
    const steps = selectedType?.checklistSteps || [];
    setIsGuided(steps.length > 0);
    setDraftSteps(steps);
    setDraftSlots(selectedType?.photoSlots || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType?.id, selectedType?.checklistSteps, selectedType?.photoSlots]);

  const toggleGuided = async (on: boolean) => {
    if (on) {
      setIsGuided(true);
      if (draftSteps.length === 0) {
        setDraftSteps([{ id: "etapa_1", title: "Etapa 1", fields: [] }]);
      }
      return;
    }
    if (!selectedType) return;
    if (selectedType.checklistSteps?.length && !window.confirm("Remover o checklist guiado deste tipo? As demandas voltarão a usar os campos simples.")) return;
    setIsSaving(true);
    try {
      await updateServiceTypeTemplate(selectedType.id, null, null);
      setIsGuided(false);
      await refreshTypes();
    } catch {
      toast.error("Erro ao remover checklist.");
    }
    setIsSaving(false);
  };

  const loadEvModel = () => {
    if (draftSteps.some(s => s.fields.length) && !window.confirm("Substituir o checklist atual pelo modelo EV?")) return;
    setDraftSteps(structuredClone(evChargerTemplate.steps));
    setDraftSlots(structuredClone(evChargerTemplate.photoSlots));
  };

  const handleSaveTemplate = async () => {
    if (!selectedType) return;
    const problem = validateTemplate(draftSteps, draftSlots);
    if (problem) { toast.error(problem); return; }
    setIsSaving(true);
    try {
      await updateServiceTypeTemplate(selectedType.id, draftSteps, draftSlots);
      await refreshTypes();
      toast.success("Checklist salvo. Novas demandas deste tipo já usam este fluxo.");
    } catch {
      toast.error("Erro ao salvar checklist.");
    }
    setIsSaving(false);
  };

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
            <ServiceTypeList
              serviceTypes={serviceTypes}
              selectedType={selectedType}
              onSelectType={handleSelectType}
              onCreateNewType={handleCreateNewType}
            />

            {/* Detalhes do Tipo Selecionado */}
            <div className="lg:col-span-5 border rounded-lg p-4 min-h-[500px] flex flex-col">
              {selectedType ? (
                <>
                  <ServiceTypeForm
                    selectedType={selectedType}
                    onUpdateType={handleUpdateType}
                    onChange={setSelectedType}
                    onDeleteType={handleDeleteType}
                    isSaving={isSaving}
                  />

                  <div className="mt-4 flex items-center justify-between gap-2 flex-wrap border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isGuided}
                        onCheckedChange={toggleGuided}
                        aria-label="Checklist guiado"
                      />
                      <div>
                        <p className="text-sm font-medium">Checklist guiado por etapas</p>
                        <p className="text-xs text-muted-foreground">Etapas, campos e fotos obrigatórias com título</p>
                      </div>
                    </div>
                    {isGuided && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadEvModel}>
                          <Zap className="h-4 w-4 mr-1" />Usar modelo EV
                        </Button>
                        <Button size="sm" onClick={handleSaveTemplate} disabled={isSaving}>
                          <Save className="h-4 w-4 mr-1" />Salvar checklist
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex-1 flex flex-col">
                    {isGuided ? (
                      <ChecklistBuilder
                        steps={draftSteps}
                        photoSlots={draftSlots}
                        onChange={(s, p) => { setDraftSteps(s); setDraftSlots(p); }}
                      />
                    ) : editingField ? (
                      <TechnicalFieldForm
                        editingField={editingField}
                        isNewField={isNewField}
                        onChange={setEditingField}
                        onCancel={() => setEditingField(null)}
                        onSave={handleSaveField}
                        isSaving={isSaving}
                      />
                    ) : (
                      <TechnicalFieldList
                        fields={selectedType.fields}
                        onEditField={handleEditField}
                        onDeleteField={handleDeleteField}
                        onAddField={handleAddField}
                      />
                    )}
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
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  const created = await createGuidedServiceType(
                    EV_TEMPLATE_NAME,
                    "Vistoria técnica para instalação de carregador veicular com checklist guiado e slots de fotos.",
                    evChargerTemplate.steps,
                    evChargerTemplate.photoSlots
                  );
                  await refreshTypes();
                  handleSelectType({ id: created.id, name: created.name, description: created.description || '', fields: [], checklistSteps: created.checklist_steps as unknown as ChecklistStep[], photoSlots: created.photo_slots as unknown as PhotoSlotDef[] });
                  toast.success("Template de Vistoria EV aberto para edição.");
                } catch {
                  toast.error("Erro ao adicionar o template. Verifique se ele já existe.");
                }
                setIsSaving(false);
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Adicionar Template Vistoria EV
            </Button>
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

import { ServiceTypeList } from "./ServiceTypeList";
import { ServiceTypeForm } from "./ServiceTypeForm";
import { TechnicalFieldList } from "./TechnicalFieldList";
import { TechnicalFieldForm } from "./TechnicalFieldForm";
