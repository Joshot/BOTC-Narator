'use client';

import React from 'react';
import { ART_ASSETS, GRIMOIRE_PALETTE } from '@/lib/grimoire-theme';

interface ParchmentSurfaceProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Warm vellum parchment paper container (`warm-vellum.webp`) with deep walnut ink
 * and brass hairline border, used for drawers, context popovers, and reference sheets.
 */
export default function ParchmentSurface({
  children,
  className = '',
  style,
}: ParchmentSurfaceProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        backgroundColor: GRIMOIRE_PALETTE.parchment,
        backgroundImage: `url('${ART_ASSETS.paperVellum}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: GRIMOIRE_PALETTE.ink,
        boxShadow:
          '0 18px 44px rgba(0, 0, 0, 0.56), inset 0 0 0 1px rgba(101, 83, 66, 0.32), inset 0 1px 0 rgba(255, 250, 223, 0.55)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
