'use client';

import React from 'react';
import { Beer, Check, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROLE_MAP } from '@/lib/botc-data';
import { PlayerSeat } from '@/lib/botc-engine';
import { CharacterToken, RoleGlyph } from './TokenArtwork';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#14111B] border-2 border-amber-400 dark:border-[#D97706] rounded-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(217,119,6,0.35)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-50 dark:bg-[#231A12] border-b border-amber-200 dark:border-[#4D341B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-[#3D2611] border border-amber-300 dark:border-[#B45309] flex items-center justify-center text-amber-700 dark:text-[#F59E0B] shadow-inner">
              <Beer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-[#F59E0B]">
                Rahasia Storyteller (Trouble Brewing)
              </span>
              <h2 className="font-display text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Tentukan Siapa yang Menjadi The Drunk
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-[#2E2016] dark:hover:bg-[#422E1E] text-amber-950 dark:text-[#EDE7DB] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-[#261E13] border border-amber-300 dark:border-[#D97706]/60 text-xs text-amber-950 dark:text-[#FDE68A] leading-relaxed">
            Dalam tas permainan telah disiapkan <strong>1 peran Townsfolk ekstra</strong> untuk The Drunk. Semua pemain baik berikut ini mengira dirinya adalah Townsfolk. Silakan pilih <strong>satu orang</strong> yang secara rahasia adalah The Drunk:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eligiblePlayers.map((player) => {
              const isSelected = player.id === currentDrunkPlayerId || player.trueRoleId === 'drunk';
              const role = ROLE_MAP[player.perceivedRoleId];

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => onSelectDrunkPlayer(player.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-[#3D2511] dark:to-[#26170A] border-amber-500 dark:border-[#F59E0B] ring-2 ring-[#FBBF24]/50 shadow-lg scale-[1.02]'
                      : 'bg-purple-50/60 hover:bg-purple-100/70 border-purple-200 dark:bg-[#181423] dark:hover:bg-[#251E33] dark:border-[#2C243B]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <CharacterToken
                        roleId={player.perceivedRoleId}
                        size="sm"
                        isDead={false}
                        isDrunkSecret={isSelected}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-amber-800 dark:text-[#D4AF37]">
                          Kursi {player.seatIndex + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {player.name}
                        </span>
                      </div>
                      <p className="text-xs text-blue-800 dark:text-[#93C5FD] font-semibold truncate mt-0.5">
                        Memegang: {role?.name}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-[#A8A092]">
                        {role?.indonesianName}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="px-2.5 py-1 rounded-xl bg-[#F59E0B] text-[#121016] text-xs font-black flex items-center gap-1 shadow-md">
                        <Check className="w-3.5 h-3.5" />
                        <span>Drunk</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-purple-900 dark:text-[#B8B0A2] hover:text-amber-700 dark:hover:text-white">
                        Pilih
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-purple-50/70 dark:bg-[#1C151F] border-t border-purple-200 dark:border-[#362734] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="brass-sheen-btn w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] font-black text-sm cursor-pointer transition-all shadow-md"
          >
            Simpan & Buka Meja Grimoire
          </button>
        </div>
      </motion.div>
    </div>
  );
}
