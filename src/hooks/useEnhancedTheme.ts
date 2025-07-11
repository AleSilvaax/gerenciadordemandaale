
import { useState, useEffect, useCallback } from 'react';

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  accentColor: string;
  fontSize: number;
  fontFamily: string;
  compactMode: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
}

const defaultThemeConfig: ThemeConfig = {
  mode: 'dark',
  accentColor: 'blue',
  fontSize: 16,
  fontFamily: 'system',
  compactMode: false,
  animationsEnabled: true,
  highContrast: false,
};

const THEME_STORAGE_KEY = 'app-theme-config';

export function useEnhancedTheme() {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    if (typeof window === 'undefined') return defaultThemeConfig;
    
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        return { ...defaultThemeConfig, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de tema:', error);
    }
    
    return defaultThemeConfig;
  });

  // Apply theme changes to document
  const applyTheme = useCallback((themeConfig: ThemeConfig) => {
    const root = document.documentElement;
    
    // Theme mode
    root.classList.remove('light', 'dark');
    if (themeConfig.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(themeConfig.mode);
    }
    
    // Accent color
    root.setAttribute('data-accent-color', themeConfig.accentColor);
    
    // Font settings
    root.style.fontSize = `${themeConfig.fontSize}px`;
    root.setAttribute('data-font-family', themeConfig.fontFamily);
    
    // Layout density
    root.classList.toggle('compact-mode', themeConfig.compactMode);
    
    // Animations
    root.classList.toggle('reduced-motion', !themeConfig.animationsEnabled);
    root.style.setProperty('--animation-duration', themeConfig.animationsEnabled ? '0.2s' : '0s');
    
    // High contrast
    root.classList.toggle('high-contrast', themeConfig.highContrast);
    
    console.log('[THEME] Configurações aplicadas:', themeConfig);
  }, []);

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: ThemeConfig) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.warn('Erro ao salvar configurações de tema:', error);
    }
  }, []);

  // Update specific theme property
  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      saveConfig(newConfig);
      applyTheme(newConfig);
      return newConfig;
    });
  }, [saveConfig, applyTheme]);

  // Reset to defaults
  const resetTheme = useCallback(() => {
    setConfig(defaultThemeConfig);
    saveConfig(defaultThemeConfig);
    applyTheme(defaultThemeConfig);
  }, [saveConfig, applyTheme]);

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(config);
  }, [config, applyTheme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (config.mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (config.mode === 'auto') {
        applyTheme(config);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config, applyTheme]);

  return {
    config,
    updateTheme,
    resetTheme,
    
    // Convenience methods
    setMode: (mode: ThemeConfig['mode']) => updateTheme({ mode }),
    setAccentColor: (accentColor: string) => updateTheme({ accentColor }),
    setFontSize: (fontSize: number) => updateTheme({ fontSize }),
    setFontFamily: (fontFamily: string) => updateTheme({ fontFamily }),
    setCompactMode: (compactMode: boolean) => updateTheme({ compactMode }),
    setAnimationsEnabled: (animationsEnabled: boolean) => updateTheme({ animationsEnabled }),
    setHighContrast: (highContrast: boolean) => updateTheme({ highContrast }),
    
    // Legacy compatibility
    theme: config.mode === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.mode,
    setTheme: (theme: 'light' | 'dark') => updateTheme({ mode: theme }),
    isDarkMode: config.mode === 'dark' || 
      (config.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches),
    toggleTheme: () => updateTheme({ 
      mode: config.mode === 'dark' ? 'light' : 'dark' 
    }),
  };
}
