'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, X } from 'lucide-react';
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
  const [showSecretName, setShowSecretName] = useState(false);

  if (!card) return null;

  const isLocked = Boolean(card.requireTapToReveal && !revealed);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={card.heading}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#F1F8F4]/98 dark:bg-[#0C0C10]/98 backdrop-blur-md flex flex-col items-center justify-between p-6 sm:p-10 text-center"
    >
      <div className="w-full max-w-2xl flex items-center justify-between">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-800 dark:text-[#8E8A9E]">
          Layar Tunjuk Bisu Storyteller
        </span>
        <button
          type="button"
          onClick={() => {
            setRevealed(false);
            setShowSecretName(false);
            onClose();
          }}
          aria-label="Tutup layar kartu"
          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl border border-purple-200 dark:border-white/[0.1] bg-white dark:bg-[#14141B] text-sm font-semibold text-slate-900 dark:text-[#EDEAF0] hover:bg-purple-50 dark:hover:bg-[#1E1E28] flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
          <span>Tutup</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLocked ? (
          <motion.div
            key="locked-vault"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="flex flex-col items-center justify-center max-w-md my-auto gap-6"
          >
            <p className="text-sm font-medium text-slate-600 dark:text-[#8E8A9E]">
              Tampilan Kartu Rahasia Pemain
            </p>

            {/* Hidden Name Box (Per user requirement: always hide name to prevent leaks) */}
            <div className="flex flex-col items-center gap-2">
              <div className="px-5 py-2.5 rounded-2xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.1] flex items-center gap-3 shadow-md">
                <span className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#EDEAF0]">
                  {showSecretName && card.playerName ? card.playerName : '•••••••• (Nama Disembunyikan)'}
                </span>
                {card.playerName && (
                  <button
                    type="button"
                    onClick={() => setShowSecretName((prev) => !prev)}
                    className="p-1 rounded text-slate-500 dark:text-[#8E8A9E] hover:text-amber-700 dark:hover:text-[#D4AF37] cursor-pointer"
                    title={showSecretName ? 'Sembunyikan Nama' : 'Tampilkan Nama'}
                  >
                    {showSecretName ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-[#6E6A7E]">
                Nama pemain disembunyikan untuk mencegah kebocoran intipan
              </span>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setRevealed(true)}
              className="brass-sheen-btn min-h-[52px] px-8 py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C365] text-[#0C0C10] font-bold text-base flex items-center gap-3 shadow-xl cursor-pointer transition-colors"
            >
              <Eye className="w-5 h-5" />
              <span>Ketuk untuk Melihat Peran Rahasia</span>
            </motion.button>
            <p className="text-xs text-slate-500 dark:text-[#8E8A9E]">
              Pastikan pemain di sebelah Anda tidak melihat layar saat kartu dibuka.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="revealed-vault"
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex flex-col items-center justify-center max-w-2xl my-auto gap-6 w-full"
          >
            <div className="space-y-2">
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-slate-900 dark:text-[#EDEAF0] text-balance">
                {card.heading}
              </h2>
              {card.subheading && (
                <p className="text-base sm:text-lg font-medium text-purple-800 dark:text-[#A6A2B2]">
                  {card.subheading}
                </p>
              )}
            </div>

            {card.bigText && (
              <motion.div
                initial={{ scale: 0.75 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                className="my-2 px-10 py-6 rounded-3xl border-2 border-amber-500 dark:border-[#D4AF37]/50 bg-white dark:bg-[#14141B] shadow-2xl"
              >
                <span className="font-mono text-6xl sm:text-8xl font-bold text-amber-800 dark:text-[#FDE68A] tabular-nums">
                  {card.bigText}
                </span>
              </motion.div>
            )}

            {card.roleIds && card.roleIds.length > 0 && (
              <div className="flex flex-wrap items-start justify-center gap-6 my-2">
                {card.roleIds.map((id, i) => {
                  const role = ROLE_MAP[id];
                  if (!role) return null;
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 16, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 280, damping: 22 }}
                      className="flex flex-col items-center gap-2 max-w-[175px] p-4 rounded-3xl bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] shadow-xl"
                    >
                      <CharacterToken roleId={id} size="lg" />
                      <span className="font-display text-base font-bold text-slate-900 dark:text-[#EDEAF0] mt-1">
                        {role.name}
                      </span>
                      <span className="text-[11px] text-amber-800 dark:text-[#D4AF37] font-semibold">
                        {role.indonesianName}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-[#8E8A9E] leading-relaxed line-clamp-3">
                        {role.ability}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {card.footerNote && (
              <p className="text-xs text-slate-600 dark:text-[#8E8A9E] max-w-md leading-relaxed border-t border-purple-200 dark:border-white/[0.08] pt-3">
                {card.footerNote}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-[11px] text-slate-500 dark:text-[#5A5766] font-mono">
        Tekan tombol Tutup di atas setelah pemain selesai melihat.
      </div>
    </motion.div>
  );
}
