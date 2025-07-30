// ARQUIVO COMPLETO E CORRIGIDO: src/components/settings/EnhancedVisualPreferencesTab.tsx
// Arquivo: src/components/settings/EnhancedVisualPreferencesTab.tsx (VERSÃO ATUALIZADA)
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Palette, Sun, Moon, Type, Layout, RefreshCw } from "lucide-react";
import { useTheme } from "@/hooks/use-theme"; // A importação continua a mesma
import { toast } from "sonner";

export const EnhancedVisualPreferencesTab: React.FC = () => {
    const {
        theme,
        setTheme,
        config,
        setAccentColor,
        setFontSize,
        setCompactMode,
        setAnimationsEnabled,
        resetTheme
    } = useTheme();

    // As configurações agora vêm do hook central
    const { accentColor, fontSize, compactMode, animationsEnabled } = config;

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        toast.success(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`);
    };

    const handleFontSizeChange = (newSize: number[]) => {
        setFontSize(newSize[0]);
    };

    const handleAccentColorChange = (color: string) => {
        setAccentColor(color);
        toast.success(`Cor de destaque alterada!`);
    };
    
    const resetToDefaults = () => {
        resetTheme();
        toast.success('Configurações visuais restauradas para o padrão.');
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Preferências Visuais</h3>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Sun className="w-5 h-5" /> Tema</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                    <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => handleThemeChange('light')} className="flex-1 gap-2">
                        <Sun className="w-4 h-4" /> Claro
                    </Button>
                    <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => handleThemeChange('dark')} className="flex-1 gap-2">
                        <Moon className="w-4 h-4" /> Escuro
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Palette className="w-5 h-5" /> Cor de Destaque</CardTitle>
                    <CardDescription>Clique no círculo para abrir a paleta e escolher qualquer cor.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <input
                        id="color-picker"
                        type="color"
                        value={accentColor}
                        onChange={(e) => handleAccentColorChange(e.target.value)}
                        // Esconde o input feio do navegador
                        className="w-0 h-0 p-0 m-0 border-0 opacity-0 absolute" 
                    />
                     <Label htmlFor="color-picker" className="cursor-pointer" title="Clique para escolher uma cor">
                        <div
                            className="w-10 h-10 rounded-full border-2 border-border transition-transform hover:scale-110"
                            style={{ backgroundColor: accentColor }}
                        />
                    </Label>
                    <div className="flex-grow">
                        <p className="font-mono text-sm bg-muted text-muted-foreground rounded-md px-3 py-2">{accentColor.toUpperCase()}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Type className="w-5 h-5" /> Tipografia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <Label>Tamanho da fonte</Label>
                        <span className="text-sm font-mono bg-muted text-muted-foreground rounded-md px-2 py-1">{fontSize}px</span>
                    </div>
                    <Slider value={[fontSize]} onValueChange={handleFontSizeChange} max={18} min={12} step={1} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Layout className="w-5 h-5" /> Interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                     <div className="flex items-center justify-between">
                        <Label htmlFor="compact-mode" className="cursor-pointer">Modo compacto</Label>
                        <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="animations" className="cursor-pointer">Animações</Label>
                        <Switch id="animations" checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                    </div>
                </CardContent>
            </Card>

            <Button variant="outline" onClick={resetToDefaults} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" /> Restaurar Padrões
            </Button>
        </div>
    );
};
