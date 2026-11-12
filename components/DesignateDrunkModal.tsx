'use client';

import React from 'react';
import { Beer, Check, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROLE_MAP } from '@/lib/botc-data';
import { PlayerSeat } from '@/lib/botc-engine';
import { CharacterToken, RoleGlyph } from './TokenArtwork';
import { useLockBodyScroll } from './grimoire/useLockBodyScroll';

interface DesignateDrunkModalProps {
  isOpen: boolean;
  players: PlayerSeat[];
  currentDrunkPlayerId: string | null;
  onSelectDrunkPlayer: (playerId: string) => void;
  onClose: () => void;
}

export default function DesignateDrunkModal({
  isOpen,
  players,
  currentDrunkPlayerId,
  onSelectDrunkPlayer,
  onClose,
}: DesignateDrunkModalProps) {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  // Filter good/townsfolk players eligible to be the Drunk
  const eligiblePlayers = players.filter((p) => {
    const role = ROLE_MAP[p.perceivedRoleId];
    return role && role.team === 'townsfolk';
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tentukan Pemain Drunk"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white dark:bg-[#14111B] border-2 border-amber-400 dark:border-[#D97706] rounded-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(217,119,6,0.35)] overflow-hidden flex flex-col max-h-[94dvh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-amber-50 dark:bg-[#231A12] border-b border-amber-200 dark:border-[#4D341B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-[#3D2611] border border-amber-300 dark:border-[#B45309] flex items-center justify-center text-amber-700 dark:text-[#F59E0B] shadow-inner shrink-0">
              <Beer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-[#F59E0B]">
                Rahasia Storyteller (Trouble Brewing)
              </span>
              <h2 className="font-display text-base sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                Tentukan Siapa yang Menjadi The Drunk
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-[#2E2016] dark:hover:bg-[#422E1E] text-amber-950 dark:text-[#EDE7DB] flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Zero Scroll Fit) */}
        <div className="p-3 sm:p-5 overflow-hidden space-y-3">
          <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-[#261E13] border border-amber-300 dark:border-[#D97706]/60 text-xs text-amber-950 dark:text-[#FDE68A] leading-snug">
            Pilih <strong>1 pemain</strong> pemegang token Townsfolk berikut yang secara rahasia menjadi <strong>The Drunk</strong>:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {eligiblePlayers.map((player) => {
              const isSelected = player.id === currentDrunkPlayerId || player.trueRoleId === 'drunk';
              const role = ROLE_MAP[player.perceivedRoleId];

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => onSelectDrunkPlayer(player.id)}
                  className={`p-2 sm:p-2.5 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-[#3D2511] dark:to-[#26170A] border-amber-500 dark:border-[#F59E0B] ring-2 ring-[#FBBF24]/50 shadow-md'
                      : 'bg-purple-50/60 hover:bg-purple-100/70 border-purple-200 dark:bg-[#181423] dark:hover:bg-[#251E33] dark:border-[#2C243B]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <CharacterToken
                        roleId={player.perceivedRoleId}
                        size="sm"
                        isDead={false}
                        isDrunkSecret={isSelected}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-bold text-amber-800 dark:text-[#D4AF37]">
                        Kursi {player.seatIndex + 1} · {player.name}
                      </div>
                      <p className="text-xs text-blue-800 dark:text-[#93C5FD] font-bold truncate">
                        {role?.name}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-[#A8A092] truncate">
                        {role?.indonesianName}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="p-1 rounded-lg bg-[#F59E0B] text-[#121016] shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-purple-50/70 dark:bg-[#1C151F] border-t border-purple-200 dark:border-[#362734] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="brass-sheen-btn w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] font-black text-xs sm:text-sm cursor-pointer transition-all shadow-md"
          >
            Simpan & Buka Meja Grimoire
          </button>
        </div>
      </motion.div>
    </div>
  );
}
