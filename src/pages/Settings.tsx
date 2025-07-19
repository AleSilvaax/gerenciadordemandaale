
import React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedVisualPreferencesTab } from "@/components/settings/EnhancedVisualPreferencesTab";
import { TechnicalSettingsTab } from "@/components/settings/TechnicalSettingsTab";
import { PermissionsTab } from "@/components/settings/PermissionsTab";
import { 
  User, 
  Palette, 
  Wrench, 
  Shield 
} from "lucide-react";

export default function Settings() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="visual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4">
            <EnhancedVisualPreferencesTab />
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <TechnicalSettingsTab />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <PermissionsTab />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card className="p-6">
              <div className="text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Configurações de Perfil</h3>
                <p className="text-muted-foreground">
                  Esta seção estará disponível em breve
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
