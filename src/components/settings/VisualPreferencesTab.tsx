
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Moon, Sun, Monitor, Palette, Layers, RotateCw, Gauge } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface ColorScheme {
  id: string;
  name: string;
  value: string;
  preview: string;
}

interface AnimationSetting {
  id: string;
  name: string;
  enabled: boolean;
}

const colorSchemes: ColorScheme[] = [
  { id: "default", name: "Padrão", value: "default", preview: "bg-primary" },
  { id: "blue", name: "Azul", value: "blue", preview: "bg-blue-500" },
  { id: "green", name: "Verde", value: "green", preview: "bg-green-500" },
  { id: "purple", name: "Roxo", value: "purple", preview: "bg-purple-500" },
  { id: "orange", name: "Laranja", value: "orange", preview: "bg-orange-500" },
];

const layoutOptions = [
  { id: "compact", name: "Compacto", description: "Layout mais denso com menor espaçamento" },
  { id: "balanced", name: "Equilibrado", description: "Espaçamento padrão (recomendado)" },
  { id: "spacious", name: "Espaçoso", description: "Layout com maior respiro visual" },
];

export const VisualPreferencesTab = () => {
  const { isDarkMode, setDarkMode } = useTheme();
  const [colorScheme, setColorScheme] = React.useState<string>("default");
  const [layout, setLayout] = React.useState<string>("balanced");
  const [animationLevel, setAnimationLevel] = React.useState<number>(50);
  const [animations, setAnimations] = React.useState<AnimationSetting[]>([
    { id: "transitions", name: "Transições de página", enabled: true },
    { id: "hover", name: "Efeitos ao passar o mouse", enabled: true },
    { id: "loading", name: "Animações de carregamento", enabled: true },
    { id: "cards", name: "Efeitos em cartões", enabled: true },
  ]);

  // Função para alternar uma animação
  const toggleAnimation = (id: string) => {
    setAnimations(prev => 
      prev.map(anim => 
        anim.id === id ? { ...anim, enabled: !anim.enabled } : anim
      )
    );
  };

  // Salvando as preferências quando elas mudam
  React.useEffect(() => {
    const preferences = {
      colorScheme,
      layout,
      animationLevel,
      animations: animations.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.enabled }), {})
    };
    localStorage.setItem('visualPreferences', JSON.stringify(preferences));
    
    // Aplicando o tema de cores
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    
    // Aplicando o nível de layout
    document.documentElement.setAttribute('data-layout', layout);
    
    // Aplicando o nível de animação
    document.documentElement.style.setProperty('--animation-speed-factor', `${animationLevel / 50}`);
    
  }, [colorScheme, layout, animationLevel, animations]);

  // Carregando as preferências salvas
  React.useEffect(() => {
    const savedPrefs = localStorage.getItem('visualPreferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setColorScheme(prefs.colorScheme || "default");
        setLayout(prefs.layout || "balanced");
        setAnimationLevel(prefs.animationLevel || 50);
        
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

  const resetToDefaults = () => {
    setColorScheme("default");
    setLayout("balanced");
    setAnimationLevel(50);
    setAnimations(prev => prev.map(anim => ({ ...anim, enabled: true })));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Personalize o visual do sistema de acordo com suas preferências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha entre modo claro ou escuro
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-5 w-5 text-muted-foreground" />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={setDarkMode}
                  aria-label="Alternar tema"
                />
                <Moon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Esquema de cores</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Selecione um esquema de cores para o sistema
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.id}
                  className={`flex flex-col items-center p-2 rounded-md border transition-all ${
                    colorScheme === scheme.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setColorScheme(scheme.value)}
                >
                  <div className={`w-full h-6 rounded-sm mb-2 ${scheme.preview}`} />
                  <span className="text-xs">{scheme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Densidade do layout</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Ajuste o espaçamento entre os elementos
            </p>
            <RadioGroup value={layout} onValueChange={setLayout} className="gap-2">
              {layoutOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={`layout-${option.id}`} />
                  <Label htmlFor={`layout-${option.id}`} className="flex flex-col">
                    <span>{option.name}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Animações</Label>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Intensidade das animações</span>
                  <span className="text-sm text-muted-foreground">{animationLevel}%</span>
                </div>
                <Slider
                  value={[animationLevel]}
                  min={0}
                  max={100}
                  step={10}
                  onValueChange={(v) => setAnimationLevel(v[0])}
                  aria-label="Intensidade das animações"
                />
              </div>

              {animations.map((animation) => (
                <div key={animation.id} className="flex items-center justify-between">
                  <Label htmlFor={`animation-${animation.id}`}>{animation.name}</Label>
                  <Switch
                    id={`animation-${animation.id}`}
                    checked={animation.enabled}
                    onCheckedChange={() => toggleAnimation(animation.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCw className="mr-2 h-4 w-4" />
              Restaurar padrões
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
