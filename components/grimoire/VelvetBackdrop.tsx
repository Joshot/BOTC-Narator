'use client';

import React from 'react';
import { GRIMOIRE_PALETTE, VELVET_COLOURS, VelvetColour } from '@/lib/grimoire-theme';

interface VelvetBackdropProps {
  colour?: VelvetColour;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  center?: boolean;
  showFrame?: boolean;
  showCorners?: boolean;
  style?: React.CSSProperties;
}

const VIGNETTES: Record<VelvetColour, string> = {
  midnight: 'radial-gradient(ellipse at 50% 42%, rgba(24,36,46,0.35) 0%, rgba(10,14,18,0.82) 100%)',
  burgundy: 'radial-gradient(ellipse at 50% 42%, rgba(79,22,27,0.35) 0%, rgba(24,7,10,0.84) 100%)',
  forest: 'radial-gradient(ellipse at 50% 42%, rgba(20,47,34,0.35) 0%, rgba(7,18,12,0.84) 100%)',
  plum: 'radial-gradient(ellipse at 50% 42%, rgba(46,22,53,0.38) 0%, rgba(16,7,20,0.85) 100%)',
};

const BASE_COLORS: Record<VelvetColour, string> = {
  midnight: '#111a22',
  burgundy: '#340f13',
  forest: '#0f2319',
  plum: '#211026',
};

/** Brass corner ornament SVG faithfully mirroring botcgrimoire-main's filigree corner piece. */
function CornerFiligree({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      width="24"
      height="24"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      fill="none"
    >
      <path
        d="M2 22V6C2 3.8 3.8 2 6 2H22"
        stroke={GRIMOIRE_PALETTE.accent}
        strokeWidth="1.5"
        strokeOpacity="0.68"
      />
      <path
        d="M6 16V8.5C6 7.1 7.1 6 8.5 6H16"
        stroke={GRIMOIRE_PALETTE.accent}
        strokeWidth="1"
        strokeOpacity="0.45"
      />
      <circle cx="6" cy="6" r="1.7" fill={GRIMOIRE_PALETTE.accent} fillOpacity="0.72" />
    </svg>
  );
}

/**
 * Tactile dark Velvet felt stage with optional inset double brass border and corner filigree.
 */
export default function VelvetBackdrop({
  colour = 'midnight',
  children,
  className = '',
  contentClassName = '',
  center = false,
  showFrame = true,
  showCorners = true,
  style,
}: VelvetBackdropProps) {
  const velvetMeta = VELVET_COLOURS.find((v) => v.id === colour) ?? VELVET_COLOURS[0];

  return (
    <div
      className={`relative overflow-hidden flex flex-col ${className}`}
      style={{
        backgroundColor: BASE_COLORS[colour],
        backgroundImage: `url('${velvetMeta.art}')`,
        backgroundSize: '360px 360px',
        backgroundRepeat: 'repeat',
        ...style,
      }}
    >
      {/* Rich depth vignette over tiled felt texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: VIGNETTES[colour] }}
      />

      {showFrame && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 sm:inset-3 rounded-[18px]"
          style={{
            border: '1px solid rgba(201, 150, 58, 0.36)',
            boxShadow:
              'inset 0 0 0 3px rgba(201, 150, 58, 0.08), inset 0 18px 40px rgba(0, 0, 0, 0.42)',
          }}
        />
      )}

      {showCorners && showFrame && (
        <>
          <CornerFiligree className="absolute top-3.5 left-3.5 sm:top-4.5 sm:left-4.5" />
          <CornerFiligree className="absolute top-3.5 right-3.5 sm:top-4.5 sm:right-4.5 rotate-90" />
          <CornerFiligree className="absolute bottom-3.5 right-3.5 sm:bottom-4.5 sm:right-4.5 rotate-180" />
          <CornerFiligree className="absolute bottom-3.5 left-3.5 sm:bottom-4.5 sm:left-4.5 -rotate-90" />
        </>
      )}

      <div
        className={`relative z-10 flex-1 min-h-0 w-full flex flex-col ${
          center ? 'items-center justify-center text-center' : ''
        } ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

/** Compact swatch selector for Midnight / Burgundy / Forest / Plum velvet felt themes. */
export function VelvetColourSelector({
  value,
  onChange,
  compact = false,
}: {
  value: VelvetColour;
  onChange: (colour: VelvetColour) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Pilih warna kain velvet Grimoire"
      className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 border border-[#c9963a]/30 backdrop-blur-sm"
    >
      {VELVET_COLOURS.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={item.label}
            aria-label={item.label}
            onClick={() => onChange(item.id)}
            className={`relative rounded-full transition-transform cursor-pointer ${
              compact ? 'w-5 h-5' : 'w-6 h-6'
            } ${active ? 'scale-110 ring-2 ring-[#c9963a] ring-offset-1 ring-offset-[#121614]' : 'opacity-75 hover:opacity-100'}`}
            style={{ backgroundColor: item.swatch }}
          />
        );
      })}
    </div>
  );
}
