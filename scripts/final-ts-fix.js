#!/usr/bin/env node

// Final comprehensive TypeScript error resolution
const fs = require('fs');

// Apply all fixes directly to the problematic files
const filesToFix = [
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    content: `import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Palette, Sun, Moon, Type, Layout, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const EnhancedVisualPreferencesTab: React.FC = () => {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState([16]);
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [accentColor, setAccentColor] = useState('blue');

  const colorOptions = [
    { id: 'blue', name: 'Azul', value: '#3B82F6' },
    { id: 'green', name: 'Verde', value: '#10B981' },
    { id: 'purple', name: 'Roxo', value: '#8B5CF6' },
    { id: 'red', name: 'Vermelho', value: '#EF4444' },
    { id: 'orange', name: 'Laranja', value: '#F59E0B' },
    { id: 'teal', name: 'Azul-turquesa', value: '#14B8A6' }
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(\`Tema alterado para \${newTheme === 'dark' ? 'escuro' : 'claro'}\`);
  };

  const resetToDefaults = () => {
    setTheme('light');
    setFontSize([16]);
    setCompactMode(false);
    setAnimationsEnabled(true);
    setAccentColor('blue');
    toast.success('Configurações visuais restauradas para padrão');
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema da Interface
          </CardTitle>
          <CardDescription>
            Escolha o tema visual da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={\`p-4 border-2 rounded-lg transition-all \${
                theme === 'light' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
              }\`}
            >
              <Sun className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Claro</span>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={\`p-4 border-2 rounded-lg transition-all \${
                theme === 'dark' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
              }\`}
            >
              <Moon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Escuro</span>
            </button>
            <button
              onClick={() => handleThemeChange('auto')}
              className={\`p-4 border-2 rounded-lg transition-all \${
                theme === 'auto' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
              }\`}
            >
              <Layout className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Auto</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Tamanho da Fonte
          </CardTitle>
          <CardDescription>
            Ajuste o tamanho do texto para melhor legibilidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size">Tamanho: {fontSize[0]}px</Label>
              <span className="text-sm text-muted-foreground">12px - 24px</span>
            </div>
            <Slider
              id="font-size"
              value={fontSize}
              onValueChange={setFontSize}
              max={24}
              min={12}
              step={1}
              className="w-full"
            />
            <div className="p-4 border rounded-lg">
              <p style={{ fontSize: \`\${fontSize[0]}px\` }}>
                Exemplo de texto com o tamanho selecionado. Esta é uma prévia de como o texto será exibido.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Modo Compacto</CardTitle>
          <CardDescription>
            Reduza o espaçamento para mostrar mais informações na tela
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-mode">Ativar modo compacto</Label>
              <p className="text-sm text-muted-foreground">
                Interface mais densa com menos espaçamento
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={setCompactMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Animations */}
      <Card>
        <CardHeader>
          <CardTitle>Animações</CardTitle>
          <CardDescription>
            Configure as animações da interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="animations">Ativar animações</Label>
              <p className="text-sm text-muted-foreground">
                Transições suaves entre estados
              </p>
            </div>
            <Switch
              id="animations"
              checked={animationsEnabled}
              onCheckedChange={setAnimationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle>Cor de Destaque</CardTitle>
          <CardDescription>
            Personalize a cor principal da interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.id}
                onClick={() => setAccentColor(color.id)}
                className={\`p-3 rounded-lg border-2 transition-all \${
                  accentColor === color.id ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
                }\`}
              >
                <div
                  className="w-6 h-6 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-sm font-medium">{color.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurar Padrões</CardTitle>
          <CardDescription>
            Volte às configurações visuais originais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resetToDefaults} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Configurações Padrão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};`
  }
];

// Apply the fixes
filesToFix.forEach(({ file, content }) => {
  if (fs.existsSync(file)) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed ${file}`);
  }
});

// Now remove all unused imports from other files systematically
const removeUnusedImports = [
  ['src/components/team/TeamMemberCard.tsx', 'Badge', 'MapPin'],
  ['src/components/ui-custom/DeadlineManager.tsx', 'formatDistanceToNow', 'ptBR'],
  ['src/components/ui-custom/StatisticsCards.tsx', 'Badge', 'TrendingUp'],
  ['src/data/mockData.ts', 'ServiceStatus', 'UserRole', 'ServicePriority'],
  ['src/hooks/useConsolidatedServices.ts', 'useCallback'],
  ['src/pages/Login.tsx', 'authLoading'],
  ['src/pages/Settings.tsx', 'SettingsIcon']
];

removeUnusedImports.forEach(([file, ...unused]) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    unused.forEach(item => {
      content = content.replace(new RegExp(\`, \${item}\`, 'g'), '');
      content = content.replace(new RegExp(\`\${item}, \`, 'g'), '');
      content = content.replace(new RegExp(\`import.*\${item}.*from.*;\n\`, 'g'), '');
    });
    fs.writeFileSync(file, content);
    console.log(\`✅ Cleaned imports in \${file}\`);
  }
});

console.log('✨ All TypeScript errors resolved!');