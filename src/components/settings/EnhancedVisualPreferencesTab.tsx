
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Monitor, Moon, Sun, Palette, Eye, Type, Layout } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

const EnhancedVisualPreferencesTab = () => {
  const { theme, setTheme, isDarkMode } = useTheme();
  const [fontSize, setFontSize] = useState([16]);
  const [compactMode, setCompactMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [animations, setAnimations] = useState(true);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    toast.success(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`);
  };

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value);
    document.documentElement.style.fontSize = `${value[0]}px`;
    toast.success(`Tamanho da fonte alterado para ${value[0]}px`);
  };

  const handleCompactModeChange = (enabled: boolean) => {
    setCompactMode(enabled);
    document.documentElement.classList.toggle('compact-mode', enabled);
    toast.success(`Modo compacto ${enabled ? 'ativado' : 'desativado'}`);
  };

  const handleHighContrastChange = (enabled: boolean) => {
    setHighContrast(enabled);
    document.documentElement.classList.toggle('high-contrast', enabled);
    toast.success(`Alto contraste ${enabled ? 'ativado' : 'desativado'}`);
  };

  const handleAnimationsChange = (enabled: boolean) => {
    setAnimations(enabled);
    document.documentElement.classList.toggle('reduce-motion', !enabled);
    toast.success(`Animações ${enabled ? 'ativadas' : 'desativadas'}`);
  };

  const resetToDefaults = () => {
    setTheme('light');
    setFontSize([16]);
    setCompactMode(false);
    setHighContrast(false);
    setAnimations(true);
    
    document.documentElement.style.fontSize = '16px';
    document.documentElement.classList.remove('compact-mode', 'high-contrast', 'reduce-motion');
    
    toast.success('Configurações visuais restauradas para o padrão');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Preferências Visuais</h3>
        <p className="text-muted-foreground">
          Personalize a aparência e comportamento visual do sistema.
        </p>
      </div>

      {/* Tema */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Tema da Interface
          </CardTitle>
          <CardDescription>
            Escolha entre tema claro ou escuro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('light')}
              className="flex items-center gap-2 flex-1"
            >
              <Sun className="w-4 h-4" />
              Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('dark')}
              className="flex items-center gap-2 flex-1"
            >
              <Moon className="w-4 h-4" />
              Escuro
            </Button>
          </div>
          <div className="flex items-center justify-center p-3 rounded-lg border bg-muted/30">
            <span className="text-sm text-muted-foreground">
              Tema atual: <Badge variant="secondary">{isDarkMode ? 'Escuro' : 'Claro'}</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tamanho da Fonte */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4" />
            Tamanho da Fonte
          </CardTitle>
          <CardDescription>
            Ajuste o tamanho do texto para melhor legibilidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Pequeno</span>
              <span className="text-sm font-medium">{fontSize[0]}px</span>
              <span className="text-sm">Grande</span>
            </div>
            <Slider
              value={fontSize}
              onValueChange={handleFontSizeChange}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-sm" style={{ fontSize: `${fontSize[0]}px` }}>
              Exemplo de texto com o tamanho selecionado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Opções de Layout */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Layout e Experiência
          </CardTitle>
          <CardDescription>
            Configure a disposição e comportamento dos elementos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Modo Compacto</Label>
              <p className="text-xs text-muted-foreground">
                Reduz espaçamentos para mostrar mais conteúdo
              </p>
            </div>
            <Switch
              checked={compactMode}
              onCheckedChange={handleCompactModeChange}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Alto Contraste</Label>
              <p className="text-xs text-muted-foreground">
                Aumenta o contraste para melhor visibilidade
              </p>
            </div>
            <Switch
              checked={highContrast}
              onCheckedChange={handleHighContrastChange}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Animações</Label>
              <p className="text-xs text-muted-foreground">
                Habilita transições e animações suaves
              </p>
            </div>
            <Switch
              checked={animations}
              onCheckedChange={handleAnimationsChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Redefinir Configurações</CardTitle>
          <CardDescription>
            Restaurar todas as configurações visuais para o padrão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            className="w-full"
          >
            Restaurar Padrões
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedVisualPreferencesTab;
