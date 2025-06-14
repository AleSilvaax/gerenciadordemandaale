
import { useState, useEffect } from 'react';

export function useTheme() {
  // Carrega do localStorage na montagem
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {}
    // Detecção automática: escuro ou claro
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // O padrão do Tailwind é "light", só precisa remover a classe dark
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Persistir preferência
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Certificar que ao inicializar, o tema visual corresponde ao salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, []);

  const setDarkMode = (isDark: boolean) => setTheme(isDark ? 'dark' : 'light');
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme, isDarkMode: theme === 'dark', setDarkMode, toggleTheme };
}

