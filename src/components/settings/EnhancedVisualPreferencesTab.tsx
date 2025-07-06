
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Palette, Monitor, Sun, Moon, Type, Layout, Zap, RefreshCw } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

export const EnhancedVisualPreferencesTab: React.FC = () => {
  const { theme, setTheme, isDarkMode, toggleTheme } = useTheme();
  const [fontSize, setFontSize] = useState([16]);
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [accentColor, setAccentColor] = useState('blue');

  const colorOptions = [
    { value: 'blue', label: 'Azul', color: 'bg-blue-500' },
    { value: 'green', label: 'Verde', color: 'bg-green-500' },
    { value: 'purple', label: 'Roxo', color: 'bg-purple-500' },
    { value: 'orange', label: 'Laranja', color: 'bg-orange-500' },
    { value: 'red', label: 'Vermelho', color: 'bg-red-500' }
  ];

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    console.log('[THEME] Alterando tema para:', newTheme);
    setTheme(newTheme);
    toast.success(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`);
  };

  const handleFontSizeChange = (newSize: number[]) => {
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize[0]}px`;
    toast.success(`Tamanho da fonte: ${newSize[0]}px`);
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    // Aqui você poderia implementar a mudança real da cor
    toast.success(`Cor de destaque alterada para ${color}`);
  };

  const resetToDefaults = () => {
    setTheme('dark');
    setFontSize([16]);
    setCompactMode(false);
    setAnimationsEnabled(true);
    setAccentColor('blue');
    document.documentElement.style.fontSize = '16px';
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
          
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-theme">Alternar automaticamente</Label>
            <Switch
              id="auto-theme"
              checked={false}
              disabled
              onCheckedChange={() => {
                toast.info('Recurso em desenvolvimento');
              }}
            />
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
              <span className="text-sm text-muted-foreground">{fontSize[0]}px</span>
            </div>
            <Slider
              value={fontSize}
              onValueChange={handleFontSizeChange}
              max={20}
              min={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pequeno (12px)</span>
              <span>Grande (20px)</span>
            </div>
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
          <CardDescription>
            Configure a aparência e comportamento da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="compact-mode">Modo compacto</Label>
              <p className="text-sm text-muted-foreground">Reduz espaçamentos para aproveitar melhor o espaço</p>
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
              <p className="text-sm text-muted-foreground">Ativa transições e efeitos visuais</p>
            </div>
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
          <CardDescription>
            Volta todas as configurações visuais para os valores padrão
          </CardDescription>
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
