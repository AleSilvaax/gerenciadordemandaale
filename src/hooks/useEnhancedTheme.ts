// Arquivo: src/hooks/useEnhancedTheme.ts (VERSÃO ATUALIZADA E CORRIGIDA)
import { useState, useEffect, useCallback } from 'react';

// Função para converter Hex para HSL (necessário para o ShadCN)
function hexToHsl(hex: string): string {
    if (!hex || !hex.startsWith('#')) return '217 91% 60%'; // Retorna o HSL do azul padrão
    
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
}


export interface ThemeConfig {
    mode: 'light' | 'dark' | 'auto';
    accentColor: string; // Armazena o valor HEX (ex: #3b82f6)
    fontSize: number;
    compactMode: boolean;
    animationsEnabled: boolean;
}

const defaultThemeConfig: ThemeConfig = {
    mode: 'dark',
    accentColor: '#2563eb', // Cor azul padrão em HEX
    fontSize: 14,
    compactMode: false,
    animationsEnabled: true,
};

const THEME_STORAGE_KEY = 'app-theme-config-v3'; // Versão do storage atualizada

export function useEnhancedTheme() {
    const [config, setConfig] = useState<ThemeConfig>(() => {
        if (typeof window === 'undefined') return defaultThemeConfig;
        
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Garante que todas as chaves do default existam no salvo
                return { ...defaultThemeConfig, ...parsed };
            }
        } catch (error) {
            console.warn('Erro ao carregar configurações de tema:', error);
        }
        
        return defaultThemeConfig;
    });

    const applyTheme = useCallback((themeConfig: ThemeConfig) => {
        if (typeof window === 'undefined') return;
        const root = document.documentElement;
        
        root.classList.remove('light', 'dark');
        if (themeConfig.mode === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.add(prefersDark ? 'dark' : 'light');
        } else {
            root.classList.add(themeConfig.mode);
        }
        
        const primaryHsl = hexToHsl(themeConfig.accentColor);
        root.style.setProperty('--primary', primaryHsl);
        root.style.setProperty('--ring', primaryHsl); // Atualiza a cor do anel de foco também

        root.style.fontSize = `${themeConfig.fontSize}px`;
        root.classList.toggle('compact-mode', themeConfig.compactMode);
        root.classList.toggle('reduced-motion', !themeConfig.animationsEnabled);
        
        console.log('[THEME] Configurações aplicadas:', themeConfig);
    }, []);

    const saveConfig = useCallback((newConfig: ThemeConfig) => {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newConfig));
        } catch (error) {
            console.warn('Erro ao salvar configurações de tema:', error);
        }
    }, []);

    const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
        setConfig(prev => {
            const newConfig = { ...prev, ...updates };
            saveConfig(newConfig);
            // Aplicar o tema é feito no useEffect abaixo para evitar re-renderizações desnecessárias
            return newConfig;
        });
    }, [saveConfig]);

    const resetTheme = useCallback(() => {
        document.documentElement.style.removeProperty('--primary');
        document.documentElement.style.removeProperty('--ring');
        updateTheme(defaultThemeConfig);
    }, [updateTheme]);

    useEffect(() => {
        applyTheme(config);
    }, [config, applyTheme]);

    useEffect(() => {
        if (config.mode !== 'auto') return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme(config);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [config, applyTheme]);

    return {
        config,
        updateTheme,
        resetTheme,
        setMode: (mode: ThemeConfig['mode']) => updateTheme({ mode }),
        setAccentColor: (accentColor: string) => updateTheme({ accentColor }),
        setFontSize: (fontSize: number) => updateTheme({ fontSize }),
        setCompactMode: (compactMode: boolean) => updateTheme({ compactMode }),
        setAnimationsEnabled: (animationsEnabled: boolean) => updateTheme({ animationsEnabled }),
        theme: config.mode,
        setTheme: (theme: 'light' | 'dark') => updateTheme({ mode: theme }),
        isDarkMode: config.mode === 'dark',
        toggleTheme: () => updateTheme({ mode: config.mode === 'dark' ? 'light' : 'dark' }),
    };
}
