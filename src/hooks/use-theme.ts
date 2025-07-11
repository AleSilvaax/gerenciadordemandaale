
import { useEnhancedTheme } from './useEnhancedTheme';

// Legacy wrapper for backward compatibility
export function useTheme() {
  const enhancedTheme = useEnhancedTheme();
  
  return {
    theme: enhancedTheme.theme,
    setTheme: enhancedTheme.setTheme,
    isDarkMode: enhancedTheme.isDarkMode,
    isLightMode: !enhancedTheme.isDarkMode,
    setDarkMode: (isDark: boolean) => enhancedTheme.setTheme(isDark ? 'dark' : 'light'),
    toggleTheme: enhancedTheme.toggleTheme,
    
    // Enhanced features
    config: enhancedTheme.config,
    updateTheme: enhancedTheme.updateTheme,
    resetTheme: enhancedTheme.resetTheme,
    setMode: enhancedTheme.setMode,
    setAccentColor: enhancedTheme.setAccentColor,
    setFontSize: enhancedTheme.setFontSize,
    setCompactMode: enhancedTheme.setCompactMode,
    setAnimationsEnabled: enhancedTheme.setAnimationsEnabled,
  };
}
