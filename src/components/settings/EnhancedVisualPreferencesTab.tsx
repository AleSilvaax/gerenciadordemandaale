
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Palette, Monitor, Sun, Moon, Eye, Grid, List, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface VisualPreference {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: number;
  compactMode: boolean;
  animations: boolean;
  listView: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export const EnhancedVisualPreferencesTab: React.FC = () => {
  const [preferences, setPreferences] = useState<VisualPreference>({
    theme: 'system',
    accentColor: 'blue',
    fontSize: 14,
    compactMode: false,
    animations: true,
    listView: false,
    autoRefresh: true,
    refreshInterval: 30
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Carregar preferências salvas do localStorage
    const savedPreferences = localStorage.getItem('visual_preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
        applyVisualChanges(parsed);
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    }
  }, []);

  const applyVisualChanges = (prefs: VisualPreference) => {
    // Aplicar tema
    const root = document.documentElement;
    
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else if (prefs.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Aplicar tamanho da fonte
    root.style.fontSize = `${prefs.fontSize}px`;

    // Aplicar cor de destaque
    const colors = {
      blue: { h: 217, s: 91, l: 60 },
      green: { h: 142, s: 76, l: 36 },
      purple: { h: 262, s: 83, l: 58 },
      orange: { h: 25, s: 95, l: 53 },
      red: { h: 0, s: 84, l: 60 }
    };

    const color = colors[prefs.accentColor as keyof typeof colors] || colors.blue;
    root.style.setProperty('--primary', `${color.h} ${color.s}% ${color.l}%`);

    // Aplicar modo compacto
    if (prefs.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Controlar animações
    if (!prefs.animations) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }
  };

  const handlePreferenceChange = (key: keyof VisualPreference, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    // Aplicar mudanças imediatamente
    applyVisualChanges(newPreferences);
    
    // Salvar no localStorage
    localStorage.setItem('visual_preferences', JSON.stringify(newPreferences));
    
    toast.success('Preferência atualizada!');
  };

  const resetToDefaults = () => {
    const defaultPreferences: VisualPreference = {
      theme: 'system',
      accentColor: 'blue',
      fontSize: 14,
      compactMode: false,
      animations: true,
      listView: false,
      autoRefresh: true,
      refreshInterval: 30
    };

    setPreferences(defaultPreferences);
    applyVisualChanges(defaultPreferences);
    localStorage.setItem('visual_preferences', JSON.stringify(defaultPreferences));
    
    toast.success('Configurações restauradas para o padrão!');
  };

  const accentColors = [
    { name: 'Azul', value: 'blue', color: 'bg-blue-500' },
    { name: 'Verde', value: 'green', color: 'bg-green-500' },
    { name: 'Roxo', value: 'purple', color: 'bg-purple-500' },
    { name: 'Laranja', value: 'orange', color: 'bg-orange-500' },
    { name: 'Vermelho', value: 'red', color: 'bg-red-500' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Preferências Visuais
        </h3>
        <p className="text-muted-foreground">
          Personalize a aparência do sistema conforme sua preferência.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Tema */}
        <Card className="bg-background/30 border border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Tema
            </CardTitle>
            <CardDescription>
              Escolha entre tema claro, escuro ou automático
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={preferences.theme}
              onValueChange={(value) => handlePreferenceChange('theme', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Claro
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Escuro
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Sistema
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Cor de Destaque */}
        <Card className="bg-background/30 border border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Cor de Destaque</CardTitle>
            <CardDescription>
              Personalize a cor principal do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {accentColors.map((color) => (
                <motion.button
                  key={color.value}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${color.color}
                    ${preferences.accentColor === color.value 
                      ? 'border-foreground ring-2 ring-foreground/20' 
                      : 'border-transparent hover:border-foreground/20'
                    }
                  `}
                  onClick={() => handlePreferenceChange('accentColor', color.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-center">
                    <div className="text-white text-xs font-medium">
                      {color.name}
                    </div>
                    {preferences.accentColor === color.value && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-background rounded-full" />
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tamanho da Fonte */}
        <Card className="bg-background/30 border border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Tamanho da Fonte
            </CardTitle>
            <CardDescription>
              Ajuste o tamanho da fonte para melhor legibilidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Pequeno</span>
                <span className="text-sm">Grande</span>
              </div>
              <Slider
                value={[preferences.fontSize]}
                onValueChange={(value) => handlePreferenceChange('fontSize', value[0])}
                min={12}
                max={18}
                step={1}
                className="w-full"
              />
              <div className="text-center">
                <Badge variant="outline">{preferences.fontSize}px</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opções de Interface */}
        <Card className="bg-background/30 border border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Opções de Interface</CardTitle>
            <CardDescription>
              Configure o comportamento e aparência da interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  <span className="font-medium">Modo Compacto</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reduz espaçamentos para mostrar mais conteúdo
                </p>
              </div>
              <Switch
                checked={preferences.compactMode}
                onCheckedChange={(checked) => handlePreferenceChange('compactMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Animações</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ativa animações e transições suaves
                </p>
              </div>
              <Switch
                checked={preferences.animations}
                onCheckedChange={(checked) => handlePreferenceChange('animations', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  <span className="font-medium">Visualização em Lista</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Prefere listas ao invés de cards quando possível
                </p>
              </div>
              <Switch
                checked={preferences.listView}
                onCheckedChange={(checked) => handlePreferenceChange('listView', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span className="font-medium">Atualização Automática</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Atualiza dados automaticamente em intervalos
                </p>
              </div>
              <Switch
                checked={preferences.autoRefresh}
                onCheckedChange={(checked) => handlePreferenceChange('autoRefresh', checked)}
              />
            </div>

            {preferences.autoRefresh && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Intervalo de Atualização</span>
                  <Badge variant="outline">{preferences.refreshInterval}s</Badge>
                </div>
                <Slider
                  value={[preferences.refreshInterval]}
                  onValueChange={(value) => handlePreferenceChange('refreshInterval', value[0])}
                  min={10}
                  max={300}
                  step={10}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão de Reset */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Restaurar Padrões
          </Button>
        </div>
      </div>
    </div>
  );
};
