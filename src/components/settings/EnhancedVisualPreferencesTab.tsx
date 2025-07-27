// ARQUIVO COMPLETO E CORRIGIDO: src/components/settings/EnhancedVisualPreferencesTab.tsx

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Palette, Sun, Moon, Type, Layout, RefreshCw } from "lucide-react";
import { useTheme } from "@/hooks/use-theme"; // Mantemos o uso do hook principal
import { toast } from "sonner";

export const EnhancedVisualPreferencesTab: React.FC = () => {
  // A LÓGICA AGORA VEM DIRETAMENTE DO NOSSO HOOK CENTRAL
  const {
    theme,
    setTheme,
    config, // Pegamos a configuração completa para ter acesso à cor
    setAccentColor, // A função correta para mudar a cor
    setFontSize,
    setCompactMode,
    setAnimationsEnabled,
    resetTheme
  } = useTheme();

  // Removemos os 'useState' locais que causavam o problema
  const { accentColor, fontSize, compactMode, animationsEnabled } = config;

  const colorOptions = [
    { value: 'blue', label: 'Azul', color: 'bg-blue-500' },
    { value: 'green', label: 'Verde', color: 'bg-green-500' },
    { value: 'purple', label: 'Roxo', color: 'bg-purple-500' },
    { value: 'orange', label: 'Laranja', color: 'bg-orange-500' },
    { value: 'red', label: 'Vermelho', color: 'bg-red-500' }
  ];

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    toast.success(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`);
  };

  const handleFontSizeChange = (newSize: number[]) => {
    setFontSize(newSize[0]); // A função do hook espera um número, não um array
    toast.success(`Tamanho da fonte: ${newSize[0]}px`);
  };

  // ESTA FUNÇÃO AGORA CHAMA O "CÉREBRO" DO TEMA
  const handleAccentColorChange = (color: string) => {
    setAccentColor(color); // Chamando a função correta do useTheme
    toast.success(`Cor de destaque alterada para ${colorOptions.find(c => c.value === color)?.label}`);
  };
  
  const resetToDefaults = () => {
    resetTheme(); // Usando a função de reset do hook
    toast.success('Configurações visuais restauradas');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Preferências Visuais</h3>
        <p className="text-muted-foreground">Personalize a aparência do sistema conforme sua preferência.</p>
      </div>

      {/* Tema */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Tema do Sistema
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
              className="flex-1 flex items-center gap-2"
            >
              <Sun className="w-4 h-4" />
              Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('dark')}
              className="flex-1 flex items-center gap-2"
            >
              <Moon className="w-4 h-4" />
              Escuro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cores de Destaque */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Cores de Destaque
          </CardTitle>
          <CardDescription>
            Escolha a cor principal do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentColorChange(color.value)}
                className={`
                  relative w-12 h-12 rounded-lg transition-all duration-200 hover:scale-105
                  ${color.color}
                  ${accentColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}
                `}
                title={color.label}
              >
                {accentColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tipografia */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-5 h-5" />
            Tipografia
          </CardTitle>
          <CardDescription>
            Ajuste o tamanho da fonte para melhor legibilidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tamanho da fonte</Label>
              <span className="text-sm text-muted-foreground">{fontSize}px</span>
            </div>
            <Slider
              value={[fontSize]} // Slider espera um array
              onValueChange={handleFontSizeChange}
              max={20}
              min={12}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout e Interface */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Layout e Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="compact-mode">Modo compacto</Label>
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
            <Label htmlFor="animations">Animações</Label>
            <Switch
              id="animations"
              checked={animationsEnabled}
              onCheckedChange={(checked) => {
                setAnimationsEnabled(checked);
                toast.success(`Animações ${checked ? 'ativadas' : 'desativadas'}`);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Restaurar Padrões */}
      <Card className="bg-background/30 border border-border/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Restaurar Padrões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restaurar Padrões
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
