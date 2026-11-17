'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, X } from 'lucide-react';
import { ROLE_MAP, getRoleName, getRoleAbility, getTeamName } from '@/lib/botc-data';
import { CharacterToken } from './TokenArtwork';
import VelvetBackdrop from './grimoire/VelvetBackdrop';
import { useLockBodyScroll } from './grimoire/useLockBodyScroll';
import { useLanguage } from '@/context/LanguageContext';

export interface SilentCardPayload {
  heading: string;
  subheading?: string;
  roleIds?: string[];
  bigText?: string;
  footerNote?: string;
  requireTapToReveal?: boolean;
  playerName?: string;
}

function localizeHeading(text: string, isEn: boolean): string {
  if (isEn) {
    if (text.includes('3 KARAKTER INI TIDAK DIMAINKAN')) return 'THESE 3 CHARACTERS ARE NOT IN PLAY';
    if (text.includes('INI ADALAH DEMON ANDA')) return 'THIS IS YOUR DEMON';
    if (text.includes('PERAN ANDA ADALAH')) return 'YOUR ROLE IS';
    if (text.includes('KARAKTER PEMAIN YANG DIEKSEKUSI')) return 'EXECUTED PLAYER CHARACTER';
    if (text.includes('KARAKTER INI ADALAH')) return 'THIS CHARACTER IS';
    if (text.includes('INFORMASI ANGKA MALAM INI')) return 'NIGHT NUMBER INFO';
    if (text.includes('PESAN STORYTELLER')) return 'STORYTELLER MESSAGE';
    return text;
  } else {
    if (text.includes('THESE 3 CHARACTERS ARE NOT IN PLAY')) return '3 KARAKTER INI TIDAK DIMAINKAN';
    if (text.includes('THIS IS YOUR DEMON')) return 'INI ADALAH DEMON ANDA';
    if (text.includes('YOUR ROLE IS')) return 'PERAN ANDA ADALAH';
    if (text.includes('EXECUTED PLAYER CHARACTER')) return 'KARAKTER PEMAIN YANG DIEKSEKUSI';
    if (text.includes('THIS CHARACTER IS')) return 'KARAKTER INI ADALAH';
    if (text.includes('NIGHT NUMBER INFO')) return 'INFORMASI ANGKA MALAM INI';
    if (text.includes('STORYTELLER MESSAGE')) return 'PESAN STORYTELLER';
    return text;
  }
}

function localizeSubheading(text: string | undefined, isEn: boolean): string | undefined {
  if (!text) return undefined;
  if (isEn) {
    if (text.includes('Rekan Minion:')) return text.replace('Rekan Minion:', 'Minion Teammates:').replace('Kursi', 'Seat');
    if (text.includes('Storyteller menunjuk ke arah pemain Demon')) return 'The Storyteller points towards your Demon';
    if (text.includes('Gunakan peran berikut sebagai penyamaran')) return 'Use these characters as your safe bluffs';
    if (text.includes('Opsi Bluff Aman untuk Demon')) return 'Safe bluff options for the Demon';
    if (text.includes('Pemain di Kursi')) return text.replace('Pemain di Kursi', 'Player in Seat');
    if (text.includes('Eksekusi siang hari')) return 'Daytime execution';
    return text;
  } else {
    if (text.includes('Minion Teammates:')) return text.replace('Minion Teammates:', 'Rekan Minion:').replace('Seat', 'Kursi');
    if (text.includes('The Storyteller points towards your Demon')) return 'Storyteller menunjuk ke arah pemain Demon Anda';
    if (text.includes('Use these characters as your safe bluffs')) return 'Gunakan peran berikut sebagai penyamaran (Bluff) aman Anda';
    if (text.includes('Safe bluff options for the Demon')) return 'Opsi Bluff Aman untuk Demon';
    if (text.includes('Player in Seat')) return text.replace('Player in Seat', 'Pemain di Kursi');
    if (text.includes('Daytime execution')) return 'Eksekusi siang hari';
    return text;
  }
}

function localizeFooterNote(text: string | undefined, isEn: boolean): string | undefined {
  if (!text) return undefined;
  if (isEn) {
    if (text.includes('Tidak ada warga baik yang memegang 3 token ini')) {
      return 'None of the good players hold these 3 tokens. You can safely claim these roles.';
    }
    if (text.includes('Ketuk di atas jika siap melihat peran') || text.includes('Ketuk di atas bila pemain sudah siap')) {
      return 'Tap above when ready to reveal role, then close before returning the device.';
    }
    if (text.includes('Tunjukkan layar ini kepada para Minion')) {
      return 'Show this screen to the Minions when they wake, pointing to the Demon.';
    }
    return text;
  } else {
    if (text.includes('None of the good players hold these 3 tokens')) {
      return 'Tidak ada warga baik yang memegang 3 token ini. Anda dapat mengklaim peran ini dengan aman.';
    }
    if (text.includes('Tap above when ready to reveal role')) {
      return 'Ketuk di atas jika siap melihat peran, lalu tekan Tutup sebelum mengembalikan perangkat.';
    }
    return text;
  }
}

export default function FullscreenCardModal({
  card,
  onClose,
}: {
  card: SilentCardPayload | null;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [revealed, setRevealed] = useState(false);

  useLockBodyScroll(Boolean(card));

  useEffect(() => {
    setRevealed(false);
  }, [card]);

  if (!card) return null;

  const isLocked = Boolean(card.requireTapToReveal && !revealed);
  const tokenCount = card.roleIds?.length ?? 0;
  const headingText = localizeHeading(card.heading, isEn);
  const subheadingText = localizeSubheading(card.subheading, isEn);
  const footerText = localizeFooterNote(card.footerNote, isEn);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={card.heading}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      <VelvetBackdrop
        colour="midnight"
        className="w-full h-dvh overflow-hidden"
        contentClassName="items-center justify-between p-3 sm:p-6 md:p-8 text-center h-full overflow-hidden"
      >
        <div className="w-full max-w-3xl flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[#c9963a]">
            {isEn ? 'Silent Screen Presenter' : 'Layar Tunjuk Bisu Storyteller'}
          </span>
          <button
            type="button"
            onClick={() => {
              setRevealed(false);
              onClose();
            }}
            aria-label={isEn ? 'Close card screen' : 'Tutup layar kartu'}
            className="min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl border border-[#c9963a]/40 bg-black/50 text-xs sm:text-sm font-semibold text-[#efe6d2] hover:bg-black/75 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>{isEn ? 'Close' : 'Tutup'}</span>
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
              className="flex-1 min-h-0 w-full flex flex-col items-center justify-center max-w-md mx-auto gap-5 px-2"
            >
              <div className="space-y-1.5">
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c9963a]">
                  {isEn ? 'Privacy Protected' : 'Privasi Terjaga'}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#efe6d2]">
                  {isEn ? 'Secret Card Ready to Reveal' : 'Kartu Rahasia Siap Dibuka'}
                </h2>
                <p className="text-xs sm:text-sm text-[#a89f8c] leading-relaxed">
                  {isEn
                    ? 'Ensure other players cannot see the screen before tapping the button below.'
                    : 'Pastikan pemain lain tidak melihat layar sebelum Anda mengetuk tombol di bawah.'}
                </p>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setRevealed(true)}
                className="brass-sheen-btn min-h-[52px] px-7 py-3.5 rounded-2xl bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl cursor-pointer transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span>{isEn ? 'Tap to Reveal Role' : 'Ketuk untuk Melihat Peran'}</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="revealed-vault"
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="flex-1 min-h-0 flex flex-col items-center justify-center max-w-4xl mx-auto gap-3 sm:gap-5 w-full px-1"
            >
              <div className="space-y-1 shrink-0">
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#efe6d2] text-balance leading-tight">
                  {headingText}
                </h2>
                {subheadingText && (
                  <p className="text-xs sm:text-base font-medium text-[#c9963a]">
                    {subheadingText}
                  </p>
                )}
              </div>

              {card.bigText && (
                <motion.div
                  initial={{ scale: 0.78 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                  className="my-1 px-6 sm:px-10 py-4 sm:py-6 rounded-3xl border-2 border-[#c9963a]/60 bg-black/55 shadow-2xl max-w-xl"
                >
                  <span
                    className={`font-bold text-[#f2c56b] leading-tight block ${
                      card.bigText.trim().length <= 4
                        ? 'font-mono text-6xl sm:text-8xl tabular-nums'
                        : 'font-display text-2xl sm:text-4xl'
                    }`}
                  >
                    {card.bigText}
                  </span>
                </motion.div>
              )}

              {card.roleIds && card.roleIds.length > 0 && (
                <div
                  className={`flex flex-wrap items-stretch justify-center gap-2.5 sm:gap-4 w-full ${
                    tokenCount === 1 ? 'max-w-xs' : tokenCount === 2 ? 'max-w-xl' : 'max-w-3xl'
                  }`}
                >
                  {card.roleIds.map((id, i) => {
                    const role = ROLE_MAP[id];
                    if (!role) return null;
                    const roleName = isEn ? role.name : (role.indonesianName || role.name);
                    const teamLabel = getTeamName(role.team, language);
                    const abilityText = isEn ? (role.abilityEn || role.ability) : role.ability;

                    return (
                      <motion.div
                        key={`${id}-${i}`}
                        initial={{ opacity: 0, y: 16, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          delay: i * 0.08,
                          type: 'spring',
                          stiffness: 280,
                          damping: 22,
                        }}
                        className={`flex flex-col items-center gap-1.5 rounded-3xl bg-black/50 border border-[#c9963a]/40 shadow-xl ${
                          tokenCount === 1
                            ? 'w-full p-4 sm:p-5'
                            : tokenCount === 3
                            ? 'flex-1 min-w-[104px] sm:min-w-[180px] p-2.5 sm:p-4'
                            : 'flex-1 min-w-[136px] sm:min-w-[200px] p-3 sm:p-4'
                        }`}
                      >
                        <CharacterToken
                          roleId={id}
                          size={tokenCount >= 3 ? 'sm' : 'lg'}
                          showAbility={false}
                        />
                        <span className="font-display text-base sm:text-xl font-bold text-[#efe6d2] mt-0.5 leading-tight">
                          {roleName}
                        </span>
                        <span className="text-[11px] sm:text-xs text-[#c9963a] font-semibold uppercase tracking-wider">
                          {teamLabel}
                        </span>
                        <p className="text-[11px] sm:text-xs text-[#dfd6c3] leading-snug sm:leading-relaxed">
                          {abilityText}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {footerText && (
                <p className="text-[11px] sm:text-xs text-[#a89f8c] max-w-md leading-relaxed border-t border-[#c9963a]/25 pt-2 shrink-0">
                  {footerText}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-[11px] text-[#a89f8c] font-mono shrink-0">
          {isEn
            ? 'Press Close button above after the player has finished reading.'
            : 'Tekan tombol Tutup di atas setelah pemain selesai melihat.'}
        </div>
      </VelvetBackdrop>
    </div>
  );
}
