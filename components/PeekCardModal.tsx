'use client';

import React, { useState } from 'react';
import {
  Beer,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  ShieldAlert,
  Swords,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { REMINDER_MAP, ROLE_MAP } from '@/lib/botc-data';
import { PlayerSeat } from '@/lib/botc-engine';
import { CharacterToken, RoleGlyph } from './TokenArtwork';
import { useLockBodyScroll } from './grimoire/useLockBodyScroll';

interface PeekCardModalProps {
  isOpen: boolean;
  players: PlayerSeat[];
  initialPlayerIndex: number;
  demonBluffIds: string[];
  onClose: () => void;
}

export default function PeekCardModal({
  isOpen,
  players,
  initialPlayerIndex,
  demonBluffIds,
  onClose,
}: PeekCardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialPlayerIndex);
  const [activeTab, setActiveTab] = useState<'player_view' | 'storyteller_view'>('player_view');
  const [showPlayerName, setShowPlayerName] = useState(false);

  useLockBodyScroll(isOpen);

  if (!isOpen || players.length === 0) return null;

  const validIndex = Math.max(0, Math.min(players.length - 1, currentIndex));
  const player = players[validIndex];
  if (!player) return null;

  const trueRole = ROLE_MAP[player.trueRoleId];
  const perceivedRole = ROLE_MAP[player.perceivedRoleId];
  const isDrunk = player.trueRoleId === 'drunk';
  const isPoisoned = player.reminders.some((r) => r.reminderId === 'poisoned');
  const isUnder7 = players.length < 7;

  // Evil team members for Demon / Minion view
  const demonPlayer = players.find((p) => ROLE_MAP[p.trueRoleId]?.team === 'demon');
  const minionPlayers = players.filter(
    (p) => ROLE_MAP[p.trueRoleId]?.team === 'minion' && p.id !== player.id
  );

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : players.length - 1));
    setShowPlayerName(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < players.length - 1 ? prev + 1 : 0));
    setShowPlayerName(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mode Intip Rahasia"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.12] rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[94dvh]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-purple-50/80 dark:bg-[#14141B] border-b border-purple-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-[#D4AF37]/20 border border-amber-300 dark:border-[#D4AF37]/40 text-amber-900 dark:text-[#FDE68A] text-[10px] font-bold tracking-wider uppercase font-mono">
              Mode Intip Rahasia
            </span>
            <span className="text-xs text-slate-500 dark:text-[#8E8A9E]">
              {activeTab === 'storyteller_view'
                ? `Kursi ${player.seatIndex + 1} dari ${players.length}`
                : 'Tampilan Pribadi'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Mode Intip"
            className="w-8 h-8 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-[#1E1E28] dark:hover:bg-[#282838] text-purple-900 dark:text-[#EDEAF0] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Player View vs Storyteller View */}
        <div className="grid grid-cols-2 p-1.5 bg-white dark:bg-[#0C0C10] border-b border-purple-200 dark:border-white/[0.08] gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('player_view')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'player_view'
                ? 'bg-[#D4AF37] text-[#121016] shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-[#8E8A9E] hover:bg-purple-50 dark:hover:bg-[#14141B]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Tunjukkan ke Pemain</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storyteller_view')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'storyteller_view'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-[#8E8A9E] hover:bg-purple-50 dark:hover:bg-[#14141B]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Catatan Storyteller</span>
          </button>
        </div>

        {/* Carousel Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-purple-50/60 dark:bg-[#14141B] border-b border-purple-200 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={handlePrev}
            className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-[#1E1E28] dark:hover:bg-[#282838] text-xs font-semibold text-purple-900 dark:text-[#EDEAF0] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="text-center min-w-0 px-2 flex flex-col items-center">
            {activeTab === 'storyteller_view' ? (
              <>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-[#EDEAF0] truncate">
                  {player.name}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-[#8E8A9E]">
                  Kursi {player.seatIndex + 1} · {player.isAlive ? 'Status: Hidup' : 'Status: Telah Mati'}
                </p>
              </>
            ) : (
              <div className="text-xs font-bold text-slate-900 dark:text-[#EDEAF0]">
                Tampilan Pribadi Pemain (Nama &amp; Kursi Disembunyikan)
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-[#1E1E28] dark:hover:bg-[#282838] text-xs font-semibold text-purple-900 dark:text-[#EDEAF0] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content (Zero Scroll Fit) */}
        <div className="p-3 sm:p-4 overflow-hidden space-y-3 text-xs sm:text-sm">
          {activeTab === 'player_view' ? (
            /* TAB 1: PLAYER-FACING VIEW */
            <div className="space-y-3">
              <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-[#14141B] border border-amber-200 dark:border-white/[0.08] text-[11px] text-amber-950 dark:text-[#FDE68A] flex items-center gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-[#D4AF37]" />
                <span>
                  Tampilan Aman: Nama disembunyikan agar tidak terintip pemain di samping.
                </span>
              </div>

              {/* Pure Character Card Presentation */}
              <div className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-purple-50/50 dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] shadow-xl space-y-3">
                <CharacterToken
                  roleId={player.perceivedRoleId}
                  size={trueRole?.team === 'demon' ? 'md' : 'lg'}
                  isDead={!player.isAlive}
                  isDrunkSecret={false}
                />

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-amber-800 dark:text-[#D4AF37]">
                    Karakter Peran Anda
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    {perceivedRole?.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-[#8E8A9E]">
                    {perceivedRole?.indonesianName} ({perceivedRole?.team === 'townsfolk' ? 'Warga Baik / Townsfolk' : perceivedRole?.team === 'outsider' ? 'Warga Luar / Outsider' : perceivedRole?.team === 'minion' ? 'Anak Buah Jahat / Minion' : 'Iblis Utama / Demon'})
                  </p>
                </div>

                <div className="max-w-lg w-full p-3 rounded-xl bg-white dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-[#EDEAF0] leading-snug text-left shadow-xs">
                  <div className="font-bold text-amber-800 dark:text-[#D4AF37] mb-1 text-[10px] uppercase tracking-wider font-mono">
                    Kemampuan Karakter:
                  </div>
                  <p>{perceivedRole?.ability}</p>
                </div>
              </div>

              {/* If Demon: Show Fellow Minions (ONLY IF NOT UNDER 7) and 3 Safe Bluffs */}
              {trueRole?.team === 'demon' && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-[#1C1318] border border-red-200 dark:border-[#DC2626]/40 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-red-900 dark:text-[#FECACA]">
                    <span className="flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-red-600 dark:text-[#EF4444]" />
                      Informasi Rahasia Tim Evil (Demon)
                    </span>
                    {!isUnder7 && minionPlayers.length > 0 && (
                      <span className="text-[11px] font-normal">
                        Minion: {minionPlayers.map((m) => ROLE_MAP[m.trueRoleId]?.name).join(', ')}
                      </span>
                    )}
                  </div>

                  {isUnder7 && (
                    <p className="text-[11px] text-red-700 dark:text-[#FCA5A5] italic">
                      Aturan Under 7 (Teensyville): Minion tidak ditampilkan ke Demon.
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-1.5">
                    {demonBluffIds.map((bid) => {
                      const bRole = ROLE_MAP[bid];
                      if (!bRole) return null;
                      return (
                        <div
                          key={bid}
                          className="p-1.5 rounded-xl bg-white dark:bg-[#120E15] border border-red-200 dark:border-[#6B1F27] flex items-center gap-1.5 shadow-xs"
                        >
                          <CharacterToken roleId={bid} size="sm" />
                          <div className="min-w-0 text-left">
                            <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                              {bRole.name}
                            </div>
                            <div className="text-[9px] text-slate-600 dark:text-[#8E8A9E] truncate">
                              {bRole.indonesianName}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* If Minion: Show Fellow Demon and Minions (ONLY IF NOT UNDER 7) */}
              {trueRole?.team === 'minion' && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-[#1C1318] border border-red-200 dark:border-[#DC2626]/40 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-900 dark:text-[#FECACA]">
                    <Swords className="w-3.5 h-3.5 text-red-600 dark:text-[#EF4444]" />
                    <span>Demon Anda:</span>
                  </div>
                  {!isUnder7 ? (
                    demonPlayer ? (
                      <span className="px-2.5 py-1 rounded-lg bg-red-100 text-xs font-bold text-red-950 border border-red-300 dark:bg-[#3F1B20] dark:text-[#FED7D7] dark:border-[#7F1D1D]">
                        {ROLE_MAP[demonPlayer.trueRoleId]?.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600 dark:text-[#E2C4C6]">Belum terdaftar</span>
                    )
                  ) : (
                    <span className="text-[11px] text-red-700 dark:text-[#FCA5A5] italic">
                      Teensyville (Under 7): Tersembunyi.
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="brass-sheen-btn w-full py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C365] text-xs sm:text-sm font-extrabold text-[#121016] border border-[#F59E0B] cursor-pointer transition-colors shadow-md"
              >
                Selesai & Sembunyikan Layar
              </button>
            </div>
          ) : (
            /* TAB 2: STORYTELLER DOSSIER VIEW */
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-[#D4AF37] font-mono">
                  Identitas Asli Pemain: {player.name} (Kursi {player.seatIndex + 1})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08] shadow-xs">
                    <span className="text-[10px] text-slate-600 dark:text-[#8E8A9E] block font-medium">Peran Sebenarnya:</span>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {trueRole?.name} ({trueRole?.indonesianName})
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-[#D4AF37] uppercase">
                      Tim: {trueRole?.team}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0C0C10] border border-purple-200 dark:border-white/[0.08] shadow-xs">
                    <span className="text-[10px] text-slate-600 dark:text-[#8E8A9E] block font-medium">Peran Diketahui Pemain:</span>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {perceivedRole?.name} ({perceivedRole?.indonesianName})
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-[#93C5FD]">
                      {isDrunk ? 'Mengira Townsfolk!' : 'Sama dengan peran asli'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-200 dark:border-white/[0.08] text-xs">
                  <span className="text-slate-600 dark:text-[#8E8A9E] font-medium">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      player.isAlive
                        ? 'bg-emerald-100 dark:bg-[#10B981]/20 text-emerald-900 dark:text-[#A7F3D0] border border-emerald-400 dark:border-[#10B981]/40'
                        : 'bg-red-100 dark:bg-[#EF4444]/20 text-red-900 dark:text-[#FECACA] border border-red-400 dark:border-[#EF4444]/40'
                    }`}
                  >
                    {player.isAlive ? 'Hidup' : 'Mati'}
                  </span>

                  {!player.isAlive && (
                    <span className="text-slate-600 dark:text-[#8E8A9E] ml-2">
                      Suara Hantu: <strong className="text-slate-900 dark:text-[#EDEAF0]">{player.hasGhostVote ? 'Masih Ada' : 'Sudah Habis'}</strong>
                    </span>
                  )}
                </div>
              </div>

              {isDrunk && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-[#281D12] border border-amber-400 dark:border-[#D97706]/60 flex items-center gap-2.5">
                  <Beer className="w-4 h-4 text-amber-700 dark:text-[#F59E0B] shrink-0" />
                  <p className="text-xs text-amber-950 dark:text-[#FDE68A]">
                    <strong>THE DRUNK!</strong> Mengira <strong>{perceivedRole?.name}</strong>. Kemampuan tidak aktif.
                  </p>
                </div>
              )}

              {isPoisoned && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-[#2B1317] border border-red-400 dark:border-[#EF4444]/60 flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-700 dark:text-[#EF4444] shrink-0" />
                  <p className="text-xs text-red-950 dark:text-[#FCA5A5]">
                    <strong>POISONED!</strong> Kemampuan nonaktif — berikan info palsu malam ini.
                  </p>
                </div>
              )}

              {/* Active Reminders on this Player */}
              <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-[#D4AF37] font-mono">
                  Token Pengingat Menempel ({player.reminders.length}):
                </h4>
                {player.reminders.length === 0 ? (
                  <p className="text-xs text-slate-600 dark:text-[#8E8A9E]">Tidak ada token pengingat aktif pada kursi ini.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {player.reminders.map((r) => {
                      const def = REMINDER_MAP[r.reminderId];
                      return (
                        <div
                          key={r.instanceId}
                          className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#1E1E28] border border-purple-200 dark:border-white/[0.08] flex items-center gap-1.5 text-xs shadow-xs"
                        >
                          <RoleGlyph roleId={def?.roleId ?? 'imp'} className="w-3.5 h-3.5 text-amber-700 dark:text-[#D4AF37] shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white">{r.customNote || def?.indonesianLabel || def?.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
