
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun, Monitor, Palette, Layers, RotateCw, Gauge, Eye, Zap, Layout, Smartphone, Monitor as MonitorIcon, Tablet } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";

interface ColorScheme {
  id: string;
  name: string;
  value: string;
  preview: string;
  description: string;
}

interface LayoutOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
}

interface FontOption {
  id: string;
  name: string;
  value: string;
  preview: string;
}

const colorSchemes: ColorScheme[] = [
  { id: "default", name: "Padrão", value: "default", preview: "bg-primary", description: "Azul profissional" },
  { id: "blue", name: "Oceano", value: "blue", preview: "bg-blue-500", description: "Azul oceânico" },
  { id: "green", name: "Natureza", value: "green", preview: "bg-green-500", description: "Verde natural" },
  { id: "purple", name: "Criativo", value: "purple", preview: "bg-purple-500", description: "Roxo criativo" },
  { id: "orange", name: "Energia", value: "orange", preview: "bg-orange-500", description: "Laranja energético" },
  { id: "rose", name: "Elegante", value: "rose", preview: "bg-rose-500", description: "Rosa elegante" },
];

const layoutOptions: LayoutOption[] = [
  { 
    id: "compact", 
    name: "Compacto", 
    description: "Máxima densidade de informação", 
    icon: <Smartphone size={16} />,
    preview: "h-8 space-y-1"
  },
  { 
    id: "balanced", 
    name: "Equilibrado", 
    description: "Balanço ideal entre conteúdo e respiro", 
    icon: <Tablet size={16} />,
    preview: "h-10 space-y-2"
  },
  { 
    id: "spacious", 
    name: "Espaçoso", 
    description: "Máximo conforto visual e legibilidade", 
    icon: <MonitorIcon size={16} />,
    preview: "h-12 space-y-3"
  },
];

const fontOptions: FontOption[] = [
  { id: "inter", name: "Inter", value: "Inter", preview: "font-sans" },
  { id: "roboto", name: "Roboto", value: "Roboto", preview: "font-mono" },
  { id: "opensans", name: "Open Sans", value: "Open Sans", preview: "font-serif" },
];

export const EnhancedVisualPreferencesTab = () => {
  const { isDarkMode, setDarkMode, theme } = useTheme();
  const [colorScheme, setColorScheme] = React.useState<string>("default");
  const [layout, setLayout] = React.useState<string>("balanced");
  const [fontSize, setFontSize] = React.useState<number>(16);
  const [fontFamily, setFontFamily] = React.useState<string>("inter");
  const [borderRadius, setBorderRadius] = React.useState<number>(8);
  const [animationLevel, setAnimationLevel] = React.useState<number>(75);
  const [reducedMotion, setReducedMotion] = React.useState<boolean>(false);
  const [highContrast, setHighContrast] = React.useState<boolean>(false);
  const [compactMode, setCompactMode] = React.useState<boolean>(false);
  
  const [animations, setAnimations] = React.useState([
    { id: "transitions", name: "Transições de página", enabled: true, description: "Animações suaves entre páginas" },
    { id: "hover", name: "Efeitos de hover", enabled: true, description: "Animações ao passar o mouse" },
    { id: "loading", name: "Indicadores de carregamento", enabled: true, description: "Spinners e skeleton loaders" },
    { id: "cards", name: "Animações de cartões", enabled: true, description: "Efeitos em cards e componentes" },
    { id: "charts", name: "Gráficos animados", enabled: true, description: "Animações em gráficos e dados" },
  ]);

  // Carrega preferências salvas
  React.useEffect(() => {
    const savedPrefs = localStorage.getItem('enhancedVisualPreferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setColorScheme(prefs.colorScheme || "default");
        setLayout(prefs.layout || "balanced");
        setFontSize(prefs.fontSize || 16);
        setFontFamily(prefs.fontFamily || "inter");
        setBorderRadius(prefs.borderRadius || 8);
        setAnimationLevel(prefs.animationLevel || 75);
        setReducedMotion(prefs.reducedMotion || false);
        setHighContrast(prefs.highContrast || false);
        setCompactMode(prefs.compactMode || false);
        
        if (prefs.animations) {
          setAnimations(prev =>
            prev.map(anim => ({
              ...anim,
              enabled: prefs.animations[anim.id] !== undefined ? prefs.animations[anim.id] : anim.enabled
            }))
          );
        }
      } catch (e) {
        console.error("Erro ao carregar preferências visuais:", e);
      }
    }
  }, []);

  // Salva preferências ao alterar
  React.useEffect(() => {
    const preferences = {
      colorScheme, layout, fontSize, fontFamily, borderRadius, animationLevel,
      reducedMotion, highContrast, compactMode,
      animations: animations.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.enabled }), {})
    };
    
    localStorage.setItem('enhancedVisualPreferences', JSON.stringify(preferences));
    
    // Aplica as preferências ao documento
    const root = document.documentElement;
    root.setAttribute('data-color-scheme', colorScheme);
    root.setAttribute('data-layout', layout);
    root.setAttribute('data-font-family', fontFamily);
    root.style.setProperty('--font-size-base', `${fontSize}px`);
    root.style.setProperty('--border-radius-base', `${borderRadius}px`);
    root.style.setProperty('--animation-speed-factor', `${animationLevel / 100}`);
    
    if (reducedMotion) root.classList.add('reduce-motion');
    else root.classList.remove('reduce-motion');
    
    if (highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
    
    if (compactMode) root.classList.add('compact-mode');
    else root.classList.remove('compact-mode');
  }, [colorScheme, layout, fontSize, fontFamily, borderRadius, animationLevel, reducedMotion, highContrast, compactMode, animations]);

  const toggleAnimation = (id: string) => {
    setAnimations(prev => 
      prev.map(anim => 
        anim.id === id ? { ...anim, enabled: !anim.enabled } : anim
      )
    );
  };

  const resetToDefaults = () => {
    setColorScheme("default");
    setLayout("balanced");
    setFontSize(16);
    setFontFamily("inter");
    setBorderRadius(8);
    setAnimationLevel(75);
    setReducedMotion(false);
    setHighContrast(false);
    setCompactMode(false);
    setAnimations(prev => prev.map(anim => ({ ...anim, enabled: true })));
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case "minimal":
        setLayout("compact");
        setAnimationLevel(25);
        setBorderRadius(4);
        break;
      case "modern":
        setLayout("balanced");
        setAnimationLevel(100);
        setBorderRadius(12);
        break;
      case "accessible":
        setHighContrast(true);
        setReducedMotion(true);
        setFontSize(18);
        setLayout("spacious");
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Configurações Rápidas
          </CardTitle>
          <CardDescription>
            Aplique configurações predefinidas para diferentes necessidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => applyPreset("minimal")} className="h-auto p-4 flex flex-col items-start">
              <div className="font-semibold">Minimalista</div>
              <div className="text-xs text-muted-foreground text-left">Layout compacto, poucas animações</div>
            </Button>
            <Button variant="outline" onClick={() => applyPreset("modern")} className="h-auto p-4 flex flex-col items-start">
              <div className="font-semibold">Moderno</div>
              <div className="text-xs text-muted-foreground text-left">Visual elegante com animações suaves</div>
            </Button>
            <Button variant="outline" onClick={() => applyPreset("accessible")} className="h-auto p-4 flex flex-col items-start">
              <div className="font-semibold">Acessível</div>
              <div className="text-xs text-muted-foreground text-left">Alto contraste, sem animações</div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Tabs */}
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance" className="flex items-center gap-1">
            <Palette size={14} />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-1">
            <Layout size={14} />
            <span className="hidden sm:inline">Layout</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-1">
            <Eye size={14} />
            <span className="hidden sm:inline">Tipografia</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-1">
            <Gauge size={14} />
            <span className="hidden sm:inline">Acessibilidade</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema e Cores</CardTitle>
              <CardDescription>
                Personalize a aparência visual do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Alterna entre tema claro e escuro
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setDarkMode}
                    aria-label="Alternar tema"
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Separator />

              {/* Color Schemes */}
              <div className="space-y-3">
                <Label>Esquema de cores</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Escolha uma paleta de cores para personalizar a interface
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {colorSchemes.map((scheme) => (
                    <motion.button
                      key={scheme.id}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        colorScheme === scheme.value
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setColorScheme(scheme.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-full h-6 rounded-sm mb-2 ${scheme.preview}`} />
                      <div className="font-medium text-sm">{scheme.name}</div>
                      <div className="text-xs text-muted-foreground">{scheme.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Border Radius */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Arredondamento dos cantos</Label>
                  <Badge variant="outline">{borderRadius}px</Badge>
                </div>
                <Slider
                  value={[borderRadius]}
                  min={0}
                  max={20}
                  step={2}
                  onValueChange={(v) => setBorderRadius(v[0])}
                  aria-label="Arredondamento dos cantos"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Quadrado</span>
                  <span>Arredondado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Densidade e Espaçamento</CardTitle>
              <CardDescription>
                Configure o espaçamento e densidade da interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Densidade do layout</Label>
                <RadioGroup value={layout} onValueChange={setLayout} className="gap-3">
                  {layoutOptions.map((option) => (
                    <motion.div 
                      key={option.id} 
                      className={`relative flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                        layout === option.id ? "border-primary bg-accent" : "border-border"
                      }`}
                      whileHover={{ scale: 1.01 }}
                    >
                      <RadioGroupItem value={option.id} id={`layout-${option.id}`} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={`layout-${option.id}`} className="flex items-center gap-2 cursor-pointer">
                          {option.icon}
                          <span className="font-medium">{option.name}</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        <div className={`mt-2 ${option.preview}`}>
                          <div className="bg-muted/50 rounded w-full h-2"></div>
                          <div className="bg-muted/30 rounded w-3/4 h-2"></div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo compacto</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduz ainda mais o espaçamento para telas pequenas
                  </p>
                </div>
                <Switch
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipografia</CardTitle>
              <CardDescription>
                Configure fontes e tamanhos de texto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Família da fonte</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.id} value={font.value} className={font.preview}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Tamanho da fonte</Label>
                  <Badge variant="outline">{fontSize}px</Badge>
                </div>
                <Slider
                  value={[fontSize]}
                  min={12}
                  max={24}
                  step={1}
                  onValueChange={(v) => setFontSize(v[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pequeno</span>
                  <span>Grande</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acessibilidade</CardTitle>
              <CardDescription>
                Configurações para melhor acessibilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alto contraste</Label>
                  <p className="text-sm text-muted-foreground">
                    Aumenta o contraste para melhor visibilidade
                  </p>
                </div>
                <Switch
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduzir movimento</Label>
                  <p className="text-sm text-muted-foreground">
                    Desabilita animações para reduzir desconforto
                  </p>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Intensidade das animações</Label>
                    <Badge variant="outline">{animationLevel}%</Badge>
                  </div>
                  <Slider
                    value={[animationLevel]}
                    min={0}
                    max={100}
                    step={10}
                    onValueChange={(v) => setAnimationLevel(v[0])}
                    disabled={reducedMotion}
                  />
                </div>

                {animations.map((animation) => (
                  <div key={animation.id} className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`animation-${animation.id}`}>{animation.name}</Label>
                      <p className="text-xs text-muted-foreground">{animation.description}</p>
                    </div>
                    <Switch
                      id={`animation-${animation.id}`}
                      checked={animation.enabled && !reducedMotion}
                      onCheckedChange={() => toggleAnimation(animation.id)}
                      disabled={reducedMotion}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCw className="mr-2 h-4 w-4" />
          Restaurar padrões
        </Button>
      </div>
    </div>
  );
};
