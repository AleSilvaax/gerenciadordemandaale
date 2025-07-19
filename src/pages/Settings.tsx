
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { VisualPreferencesTab } from "@/components/settings/VisualPreferencesTab";
import { TechnicalSettingsTab } from "@/components/settings/TechnicalSettingsTab";
import { PermissionsTab } from "@/components/settings/PermissionsTab";
import { Settings as SettingsIcon, Palette, Wrench, Shield } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("visual");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações do Sistema</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações e preferências do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Técnico
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="visual" className="space-y-6">
            <VisualPreferencesTab />
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <TechnicalSettingsTab />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <PermissionsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
