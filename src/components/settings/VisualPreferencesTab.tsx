
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, Settings, Eye } from "lucide-react";
import { toast } from "sonner";

export const VisualPreferencesTab = () => {
  const [theme] = React.useState('light');
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  const applyTheme = (selectedTheme: string) => {
    console.log('Aplicando tema:', selectedTheme);
    toast.success(`Tema ${selectedTheme} aplicado!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Preferências Visuais</h3>
        <p className="text-muted-foreground">Configure a aparência da interface conforme sua preferência.</p>
      </div>

      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Tema da Interface
          </CardTitle>
          <CardDescription>
            Escolha entre o tema claro ou escuro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => applyTheme('light')}
            >
              <Sun className="w-6 h-6" />
              <span>Claro</span>
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => applyTheme('dark')}
            >
              <Moon className="w-6 h-6" />
              <span>Escuro</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Interface
          </CardTitle>
          <CardDescription>
            Personalize como a interface se comporta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="compact-mode">Modo Compacto</Label>
              <p className="text-sm text-muted-foreground">
                Reduz o espaçamento entre elementos para mostrar mais conteúdo
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={(checked) => {
                setCompactMode(checked);
                toast.success(`Modo compacto ${checked ? 'ativado' : 'desativado'}`);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="animations">Animações</Label>
              <p className="text-sm text-muted-foreground">
                Habilita transições e efeitos visuais suaves
              </p>
            </div>
            <Switch
              id="animations"
              checked={animations}
              onCheckedChange={(checked) => {
                setAnimations(checked);
                toast.success(`Animações ${checked ? 'ativadas' : 'desativadas'}`);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="high-contrast">Alto Contraste</Label>
              <p className="text-sm text-muted-foreground">
                Aumenta o contraste para melhor visibilidade
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={(checked) => {
                setHighContrast(checked);
                toast.success(`Alto contraste ${checked ? 'ativado' : 'desativado'}`);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Salvar Configurações */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            className="w-full" 
            onClick={() => toast.success('Configurações salvas com sucesso!')}
          >
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
