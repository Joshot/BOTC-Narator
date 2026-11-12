'use client';

import { useEffect } from 'react';

/**
 * Mengunci scroll halaman di belakang overlay/popup saat modal terbuka.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [locked]);
}
