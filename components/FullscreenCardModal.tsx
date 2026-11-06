'use client';

import React, { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { ROLE_MAP } from '@/lib/botc-data';
import { CharacterToken } from './TokenArtwork';

export interface SilentCardPayload {
  heading: string;
  subheading?: string;
  roleIds?: string[];
  bigText?: string;
  footerNote?: string;
  requireTapToReveal?: boolean;
  playerName?: string;
}

export default function FullscreenCardModal({
  card,
  onClose,
}: {
  card: SilentCardPayload | null;
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!card) return null;

  const isLocked = Boolean(card.requireTapToReveal && !revealed);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={card.heading}
      className="fixed inset-0 z-50 bg-[#0B0A0E] flex flex-col items-center justify-between p-6 sm:p-10 text-center"
    >
      <div className="w-full max-w-2xl flex items-center justify-between">
        <span className="text-xs font-medium text-[#A69F91] tracking-wide">
          Layar Tunjuk Bisu Storyteller
        </span>
        <button
          type="button"
          onClick={() => {
            setRevealed(false);
            onClose();
          }}
          aria-label="Tutup layar kartu"
          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl border border-[#322E3D] bg-[#1C1924] text-sm font-medium text-[#EDE7DB] hover:bg-[#272331] flex items-center gap-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Tutup</span>
        </button>
      </div>

      {isLocked ? (
        <div className="flex flex-col items-center justify-center max-w-md my-auto gap-6">
          <p className="text-sm text-[#B8B0A2]">Berikan layar ini hanya kepada:</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5EFE6]">
            {card.playerName}
          </h2>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="min-h-[52px] px-8 py-3.5 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white font-semibold text-base flex items-center gap-3 shadow-lg cursor-pointer transition-colors"
          >
            <Eye className="w-5 h-5" />
            <span>Ketuk untuk Melihat Peran Rahasia</span>
          </button>
          <p className="text-xs text-[#9C9486]">
            Pastikan pemain di sebelah Anda tidak mengintip layar HP ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center max-w-2xl my-auto gap-6 w-full">
          <div className="space-y-2">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F5EFE6] text-balance">
              {card.heading}
            </h2>
            {card.subheading && (
              <p className="text-base sm:text-lg text-[#C9C1B2]">{card.subheading}</p>
            )}
          </div>

          {card.bigText && (
            <div className="my-2 px-10 py-6 rounded-2xl border-2 border-[#D4AF37]/50 bg-[#1A1721]">
              <span className="font-mono text-6xl sm:text-8xl font-bold text-[#FDE68A] tabular-nums">
                {card.bigText}
              </span>
            </div>
          )}

          {card.roleIds && card.roleIds.length > 0 && (
            <div className="flex flex-wrap items-start justify-center gap-6 my-2">
              {card.roleIds.map((id) => {
                const role = ROLE_MAP[id];
                if (!role) return null;
                return (
                  <div
                    key={id}
                    className="flex flex-col items-center max-w-[280px] bg-[#1A1721] border border-[#2E293A] rounded-2xl p-5 gap-3 shadow-2xl"
                  >
                    <div className="w-44 h-44 sm:w-52 sm:h-52 select-none filter drop-shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-transform hover:scale-105">
                      <img
                        src={`/tokens/${id}.png`}
                        alt={role.name}
                        className="w-full h-full object-contain rounded-full pointer-events-none"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="font-display text-lg font-bold text-white">
                        {role.name} ({role.indonesianName})
                      </h3>
                      <p className="text-xs sm:text-sm text-[#D6CFC2] leading-relaxed">
                        {role.ability}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {card.footerNote && (
            <p className="text-sm sm:text-base text-[#B8B0A2] max-w-lg leading-relaxed">
              {card.footerNote}
            </p>
          )}
        </div>
      )}

      <div className="w-full max-w-md pb-2">
        <button
          type="button"
          onClick={() => {
            setRevealed(false);
            onClose();
          }}
          className="w-full min-h-[48px] rounded-xl bg-[#252130] hover:bg-[#312C3F] border border-[#3E384F] text-[#F5EFE6] font-semibold text-sm cursor-pointer transition-colors"
        >
          Selesai & Sembunyikan Layar
        </button>
      </div>
    </div>
  );
}
