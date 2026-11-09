'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type AppTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: AppTheme;
  isConfirmModalOpen: boolean;
  targetTheme: AppTheme | null;
  requestThemeChange: (newTheme?: AppTheme) => void;
  confirmThemeChange: () => void;
  cancelThemeChange: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'botc_color_theme_v2';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [targetTheme, setTargetTheme] = useState<AppTheme | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or default to 'dark'
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        applyThemeClass(saved);
      } else {
        setTheme('dark');
        applyThemeClass('dark');
      }
    } catch {
      applyThemeClass('dark');
    }
    setMounted(true);
  }, []);

  const applyThemeClass = (currentTheme: AppTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (currentTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  };

  const requestThemeChange = useCallback(
    (newTheme?: AppTheme) => {
      const next = newTheme || (theme === 'dark' ? 'light' : 'dark');
      setTargetTheme(next);
      setIsConfirmModalOpen(true);
    },
    [theme]
  );

  const confirmThemeChange = useCallback(() => {
    if (!targetTheme) return;
    setTheme(targetTheme);
    applyThemeClass(targetTheme);
    try {
      localStorage.setItem(STORAGE_KEY, targetTheme);
    } catch {
      // Ignore localStorage errors
    }
    setIsConfirmModalOpen(false);
    setTargetTheme(null);
  }, [targetTheme]);

  const cancelThemeChange = useCallback(() => {
    setIsConfirmModalOpen(false);
    setTargetTheme(null);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isConfirmModalOpen,
        targetTheme,
        requestThemeChange,
        confirmThemeChange,
        cancelThemeChange,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}

