
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomFieldManager, CustomField } from "@/components/ui-custom/CustomFieldManager";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const SettingsPage: React.FC = () => {
  const [inspectionFields, setInspectionFields] = useState<CustomField[]>([]);
  const [installationFields, setInstallationFields] = useState<CustomField[]>([]);

  // Load custom fields from localStorage on component mount
  React.useEffect(() => {
    const savedInspectionFields = localStorage.getItem('inspectionCustomFields');
    const savedInstallationFields = localStorage.getItem('installationCustomFields');
    
    if (savedInspectionFields) {
      try {
        setInspectionFields(JSON.parse(savedInspectionFields));
      } catch (e) {
        console.error("Error loading inspection custom fields:", e);
      }
    }
    
    if (savedInstallationFields) {
      try {
        setInstallationFields(JSON.parse(savedInstallationFields));
      } catch (e) {
        console.error("Error loading installation custom fields:", e);
      }
    }
  }, []);

  // Save custom fields to localStorage when they change
  React.useEffect(() => {
    localStorage.setItem('inspectionCustomFields', JSON.stringify(inspectionFields));
  }, [inspectionFields]);

  React.useEffect(() => {
    localStorage.setItem('installationCustomFields', JSON.stringify(installationFields));
  }, [installationFields]);

  const handleAddInspectionField = (field: CustomField) => {
    setInspectionFields([...inspectionFields, field]);
  };

  const handleUpdateInspectionField = (fieldId: string, updates: Partial<CustomField>) => {
    setInspectionFields(
      inspectionFields.map(field => (field.id === fieldId ? { ...field, ...updates } : field))
    );
  };

  const handleRemoveInspectionField = (fieldId: string) => {
    setInspectionFields(inspectionFields.filter(field => field.id !== fieldId));
  };

  const handleAddInstallationField = (field: CustomField) => {
    setInstallationFields([...installationFields, field]);
  };

  const handleUpdateInstallationField = (fieldId: string, updates: Partial<CustomField>) => {
    setInstallationFields(
      installationFields.map(field => (field.id === fieldId ? { ...field, ...updates } : field))
    );
  };

  const handleRemoveInstallationField = (fieldId: string) => {
    setInstallationFields(installationFields.filter(field => field.id !== fieldId));
  };

  const handleExportFields = () => {
    const data = {
      inspectionFields,
      installationFields
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campos-personalizados.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Campos exportados", {
      description: "Os campos personalizados foram exportados com sucesso."
    });
  };

  const handleImportFields = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.inspectionFields) {
          setInspectionFields(data.inspectionFields);
        }
        if (data.installationFields) {
          setInstallationFields(data.installationFields);
        }
        
        toast.success("Campos importados", {
          description: "Os campos personalizados foram importados com sucesso."
        });
      } catch (error) {
        console.error("Error importing fields:", error);
        toast.error("Erro ao importar", {
          description: "Ocorreu um erro ao importar os campos personalizados."
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="container py-4 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="inspection">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="inspection" className="w-1/2">Vistoria</TabsTrigger>
          <TabsTrigger value="installation" className="w-1/2">Instalação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inspection">
          <Card>
            <CardHeader>
              <CardTitle>Campos Personalizados para Vistoria</CardTitle>
              <CardDescription>
                Configure campos adicionais para os relatórios de vistoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomFieldManager
                fields={inspectionFields}
                onAddField={handleAddInspectionField}
                onUpdateField={handleUpdateInspectionField}
                onRemoveField={handleRemoveInspectionField}
                categoryName="Campos de vistoria"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="installation">
          <Card>
            <CardHeader>
              <CardTitle>Campos Personalizados para Instalação</CardTitle>
              <CardDescription>
                Configure campos adicionais para os relatórios de instalação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomFieldManager
                fields={installationFields}
                onAddField={handleAddInstallationField}
                onUpdateField={handleUpdateInstallationField}
                onRemoveField={handleRemoveInstallationField}
                categoryName="Campos de instalação"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex flex-wrap gap-4">
        <Button onClick={handleExportFields}>Exportar Campos</Button>
        <div>
          <input
            type="file"
            id="import-fields"
            className="hidden"
            accept=".json"
            onChange={handleImportFields}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-fields')?.click()}
          >
            Importar Campos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
