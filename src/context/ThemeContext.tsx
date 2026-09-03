import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Theme, getInitialTheme, applyTheme, toggleTheme as doToggleTheme, STORAGE_KEY } from '../utils/theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);

    // Écoute de la préférence système si aucun choix manuel n'a été enregistré
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved && typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-color-scheme: light)');
      const listener = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          const next: Theme = e.matches ? 'light' : 'dark';
          setThemeState(next);
          applyTheme(next);
        }
      };
      if (media.addEventListener) {
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
      }
    }
  }, [theme]);

  const toggle = () => {
    const next = doToggleTheme();
    setThemeState(next);
  };

  const setTheme = (next: Theme) => {
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setThemeState(next);
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      isLight: theme === 'light',
      toggleTheme: toggle,
      setTheme
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
