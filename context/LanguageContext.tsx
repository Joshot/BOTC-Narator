'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  TRANSLATIONS,
  TranslationKey,
  getTranslation,
} from '@/lib/translations';

export const LANGUAGE_STORAGE_KEY = 'botc_language';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey, ...args: any[]) => any;
  isEnglish: boolean;
  isIndonesian: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount, default to 'en'
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;
      if (saved === 'en' || saved === 'id') {
        setLanguageState(saved);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved;
        }
      } else {
        // Enforce default 'en'
        setLanguageState(DEFAULT_LANGUAGE);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = DEFAULT_LANGUAGE;
        }
      }
    } catch {
      // Fallback
      setLanguageState(DEFAULT_LANGUAGE);
    }

    const handleExternalChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ language?: AppLanguage }>;
      const nextLang = customEvent.detail?.language;
      if (nextLang === 'en' || nextLang === 'id') {
        setLanguageState(nextLang);
      }
    };

    window.addEventListener('botc-language-change', handleExternalChange);
    return () => {
      window.removeEventListener('botc-language-change', handleExternalChange);
    };
  }, []);

  const setLanguage = useCallback((newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang;
      }
      window.dispatchEvent(
        new CustomEvent('botc-language-change', { detail: { language: newLang } })
      );
    } catch {
      // Ignore storage errors
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, ...args: any[]) => {
      const val = getTranslation(language, key);
      if (typeof val === 'function') {
        return val(...args);
      }
      return val;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isEnglish: language === 'en',
      isIndonesian: language === 'id',
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for non-provider usage or SSR
    return {
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      t: (key: TranslationKey, ...args: any[]) => {
        const val = getTranslation(DEFAULT_LANGUAGE, key);
        return typeof val === 'function' ? val(...args) : val;
      },
      isEnglish: true,
      isIndonesian: false,
    };
  }
  return context;
}
