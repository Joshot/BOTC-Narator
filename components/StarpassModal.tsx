'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Crown, RefreshCw, Swords, X } from 'lucide-react';
import { ROLE_MAP } from '@/lib/botc-data';
import { StarpassPendingData } from '@/context/GameContext';
import { useLockBodyScroll } from './grimoire/useLockBodyScroll';

interface StarpassModalProps {
  pendingData: StarpassPendingData | null;
  onChooseMinion: (minionId: string) => void;
  onDismiss: () => void;
}

export default function StarpassModal({
  pendingData,
  onChooseMinion,
  onDismiss,
}: StarpassModalProps) {
  useLockBodyScroll(Boolean(pendingData));

  if (!pendingData) return null;

  const { dyingDemon, aliveMinions } = pendingData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#14141B] border-2 border-red-400 dark:border-[#EF4444]/60 p-6 shadow-2xl dark:shadow-red-950/40 space-y-6"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 dark:text-[#8E8A9E] hover:text-slate-900 dark:hover:text-[#EDEAF0] hover:bg-purple-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          aria-label="Tutup Pilihan Starpass"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-red-100 dark:bg-[#2A1216] border border-red-300 dark:border-[#EF4444]/40 text-red-700 dark:text-[#EF4444] shrink-0">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-[#EF4444]/20 border border-red-300 dark:border-[#EF4444]/40 text-[10px] font-mono uppercase tracking-wider text-red-900 dark:text-[#FCA5A5] font-bold">
              Aturan Trouble Brewing: Starpass
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-[#EDEAF0]">
              Pilih Minion Menjadi Imp Baru
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#A6A2B2] leading-relaxed">
              Demon <strong className="text-slate-900 dark:text-white">{dyingDemon.name}</strong> (Kursi {dyingDemon.seatIndex + 1}) bunuh diri atau mati akibat serangan sesama Demon. Karena terdapat lebih dari 1 Minion hidup, pilih Minion yang mewarisi gelar IMP:
            </p>
          </div>
        </div>

        {/* Minion Candidate List */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#8E8A9E] px-1">
            Daftar Minion Hidup ({aliveMinions.length})
          </div>
          <div className="grid grid-cols-1 gap-2">
            {aliveMinions.map((minion) => {
              const role = ROLE_MAP[minion.trueRoleId];
              return (
                <div
                  key={minion.id}
                  className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-[#1C1C26] border border-purple-200 dark:border-white/[0.08] hover:border-red-400 dark:hover:border-[#EF4444]/60 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#252533] border border-purple-200 dark:border-white/[0.06] font-mono text-[10px] font-bold text-amber-800 dark:text-[#D4AF37]">
                        Kursi #{minion.seatIndex + 1}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-[#8E8A9E] font-medium">
                        Peran Asal: {role?.name || minion.trueRoleId}
                      </span>
                    </div>
                    <div className="font-display text-base font-bold text-slate-900 dark:text-[#EDEAF0] group-hover:text-red-700 dark:group-hover:text-[#FCA5A5] transition-colors truncate">
                      {minion.name}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onChooseMinion(minion.id)}
                    className="brass-sheen-btn px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#EF4444] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 shadow-md cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-200 dark:text-[#FDE68A]" />
                    <span>Jadikan Imp</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Notes */}
        <div className="p-3 rounded-2xl bg-purple-50 dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-[#8E8A9E] flex items-center gap-2">
          <Swords className="w-4 h-4 text-red-600 dark:text-[#EF4444] shrink-0" />
          <span>
            Begitu dipilih, peran Minion bersangkutan langsung berganti menjadi IMP dan token pengingat diperbarui otomatis.
          </span>
        </div>
      </motion.div>
    </div>
  );
}

