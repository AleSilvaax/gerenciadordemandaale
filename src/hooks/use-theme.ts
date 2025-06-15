
import { useState, useEffect } from 'react';

export function useTheme() {
  // Load from localStorage on mount with better default handling
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark';
    
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {}
    
    // Default to dark theme as requested
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Persist preference
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  // Initialize on mount
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, []);

  const setDarkMode = (isDark: boolean) => setTheme(isDark ? 'dark' : 'light');
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return { 
    theme, 
    setTheme, 
    isDarkMode: theme === 'dark', 
    isLightMode: theme === 'light',
    setDarkMode, 
    toggleTheme 
  };
}
