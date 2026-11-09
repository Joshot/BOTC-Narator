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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#0C0C10] border border-white/[0.12] rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#14141B] border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FDE68A] text-[11px] font-bold tracking-wider uppercase font-mono">
              Mode Intip Rahasia
            </span>
            <span className="text-xs text-[#8E8A9E]">
              {activeTab === 'storyteller_view'
                ? `Kursi ${player.seatIndex + 1} dari ${players.length}`
                : 'Tampilan Pribadi Pemain'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Mode Intip"
            className="w-9 h-9 rounded-xl bg-[#1E1E28] hover:bg-[#282838] text-[#EDEAF0] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Player View vs Storyteller View */}
        <div className="grid grid-cols-2 p-2 bg-[#0C0C10] border-b border-white/[0.08] gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('player_view')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'player_view'
                ? 'bg-[#D4AF37] text-[#0C0C10] shadow-md'
                : 'text-[#8E8A9E] hover:bg-[#14141B] hover:text-[#EDEAF0]'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Tunjukkan ke Pemain</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storyteller_view')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'storyteller_view'
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'text-[#8E8A9E] hover:bg-[#14141B] hover:text-[#EDEAF0]'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Catatan Storyteller</span>
          </button>
        </div>

        {/* Carousel Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#14141B] border-b border-white/[0.08]">
          <button
            type="button"
            onClick={handlePrev}
            className="px-3 py-1.5 rounded-lg bg-[#1E1E28] hover:bg-[#282838] text-xs font-semibold text-[#EDEAF0] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="text-center min-w-0 px-2 flex flex-col items-center">
            {activeTab === 'storyteller_view' ? (
              <>
                <h2 className="font-display text-base sm:text-lg font-bold text-[#EDEAF0] truncate">
                  {player.name}
                </h2>
                <p className="text-[11px] text-[#8E8A9E]">
                  Kursi {player.seatIndex + 1} · {player.isAlive ? 'Status: Hidup' : 'Status: Telah Mati'}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#EDEAF0]">
                  Kursi {player.seatIndex + 1}
                </span>
                <span className="text-white/20">·</span>
                <span className="text-xs text-[#8E8A9E]">
                  {showPlayerName ? player.name : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPlayerName((p) => !p)}
                  className="p-1 rounded text-[#8E8A9E] hover:text-[#D4AF37] cursor-pointer"
                  title={showPlayerName ? 'Sembunyikan Nama' : 'Tampilkan Nama'}
                >
                  {showPlayerName ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-3 py-1.5 rounded-lg bg-[#1E1E28] hover:bg-[#282838] text-xs font-semibold text-[#EDEAF0] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'player_view' ? (
            /* TAB 1: PLAYER-FACING VIEW */
            <div className="space-y-5">
              <div className="p-3 rounded-2xl bg-[#14141B] border border-white/[0.08] text-xs text-[#FDE68A] flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                <span>
                  Tampilan Aman: Berikan layar HP ini kepada pemain terkait secara pribadi. Nama disembunyikan agar pemain di samping tidak bisa mengintip identitas.
                </span>
              </div>

              {/* Pure Character Card Presentation */}
              <div className="flex flex-col items-center text-center p-6 sm:p-8 rounded-3xl bg-[#14141B] border border-white/[0.08] shadow-2xl space-y-5">
                <CharacterToken
                  roleId={player.perceivedRoleId}
                  size="xl"
                  isDead={!player.isAlive}
                  isDrunkSecret={false}
                />

                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest font-mono font-bold text-[#D4AF37]">
                    Karakter Peran Anda
                  </span>
                  <h3 className="font-display text-3xl sm:text-4xl font-black text-white">
                    {perceivedRole?.name}
                  </h3>
                  <p className="text-sm font-semibold text-[#8E8A9E]">
                    {perceivedRole?.indonesianName} ({perceivedRole?.team === 'townsfolk' ? 'Warga Baik / Townsfolk' : perceivedRole?.team === 'outsider' ? 'Warga Luar / Outsider' : perceivedRole?.team === 'minion' ? 'Anak Buah Jahat / Minion' : 'Iblis Utama / Demon'})
                  </p>
                </div>

                <div className="max-w-md p-4 sm:p-5 rounded-2xl bg-[#0C0C10] border border-white/[0.08] text-xs sm:text-sm text-[#EDEAF0] leading-relaxed text-left">
                  <div className="font-bold text-[#D4AF37] mb-1.5 text-xs uppercase tracking-wider font-mono">
                    Kemampuan Karakter:
                  </div>
                  <p>{perceivedRole?.ability}</p>
                </div>
              </div>

              {/* If Demon: Show Fellow Minions (ONLY IF NOT UNDER 7) and 3 Safe Bluffs */}
              {trueRole?.team === 'demon' && (
                <div className="p-4 rounded-2xl bg-[#1C1318] border border-[#DC2626]/40 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#FECACA]">
                    <Swords className="w-4 h-4 text-[#EF4444]" />
                    <span>Informasi Rahasia Tim Evil (Khusus Demon)</span>
                  </div>

                  {/* Under 7 Teensyville Rule: Hide Minions */}
                  {!isUnder7 ? (
                    <div>
                      <span className="text-xs font-semibold text-[#FCA5A5] block mb-1">
                        Rekan Minion Anda:
                      </span>
                      {minionPlayers.length === 0 ? (
                        <p className="text-xs text-[#E2C4C6]">Tidak ada rekan Minion lain.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {minionPlayers.map((m) => (
                            <span
                              key={m.id}
                              className="px-2.5 py-1 rounded-lg bg-[#3F1B20] text-xs font-bold text-[#FED7D7] border border-[#7F1D1D]"
                            >
                              Kursi {m.seatIndex + 1} ({ROLE_MAP[m.trueRoleId]?.name})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#FCA5A5] italic">
                      Aturan Under 7 (Teensyville): Minion tidak ditampilkan ke Demon.
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#4E1E24]">
                    <span className="text-xs font-semibold text-[#FCA5A5] block mb-1.5">
                      3 Karakter Bluff Aman (Bisa Anda Akui):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {demonBluffIds.map((bid) => {
                        const bRole = ROLE_MAP[bid];
                        if (!bRole) return null;
                        return (
                          <div
                            key={bid}
                            className="p-2.5 rounded-xl bg-[#120E15] border border-[#6B1F27] flex items-center gap-2.5"
                          >
                            <CharacterToken roleId={bid} size="sm" />
                            <div className="min-w-0 text-left">
                              <div className="text-xs font-bold text-white truncate">
                                {bRole.name}
                              </div>
                              <div className="text-[10px] text-[#8E8A9E] truncate">
                                {bRole.indonesianName}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* If Minion: Show Fellow Demon and Minions (ONLY IF NOT UNDER 7) */}
              {trueRole?.team === 'minion' && (
                <div className="p-4 rounded-2xl bg-[#1C1318] border border-[#DC2626]/40 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#FECACA]">
                    <Swords className="w-4 h-4 text-[#EF4444]" />
                    <span>Informasi Rahasia Tim Evil (Khusus Minion)</span>
                  </div>

                  {!isUnder7 ? (
                    <div>
                      <span className="text-xs font-semibold text-[#FCA5A5] block mb-1">
                        Demon (Iblis Utama) Anda:
                      </span>
                      {demonPlayer ? (
                        <span className="inline-block px-3 py-1 rounded-lg bg-[#3F1B20] text-xs font-bold text-[#FED7D7] border border-[#7F1D1D]">
                          Kursi {demonPlayer.seatIndex + 1} ({ROLE_MAP[demonPlayer.trueRoleId]?.name})
                        </span>
                      ) : (
                        <p className="text-xs text-[#E2C4C6]">Demon belum terdaftar.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#FCA5A5] italic">
                      Aturan Under 7 (Teensyville): Demon tidak ditampilkan ke Minion.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[46px] py-2.5 rounded-2xl bg-[#1E1E28] hover:bg-[#282838] text-xs sm:text-sm font-bold text-[#EDEAF0] border border-white/[0.1] cursor-pointer transition-colors"
              >
                Selesai & Sembunyikan Layar
              </button>
            </div>
          ) : (
            /* TAB 2: STORYTELLER DOSSIER VIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#14141B] border border-white/[0.08] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
                  Identitas Asli Pemain: {player.name} (Kursi {player.seatIndex + 1})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#0C0C10] border border-white/[0.08]">
                    <span className="text-[11px] text-[#8E8A9E] block">Peran Sebenarnya (True Role):</span>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {trueRole?.name} ({trueRole?.indonesianName})
                    </div>
                    <span className="text-[11px] font-semibold text-[#D4AF37] uppercase">
                      Tim: {trueRole?.team}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0C0C10] border border-white/[0.08]">
                    <span className="text-[11px] text-[#8E8A9E] block">Peran yang Diketahui Pemain:</span>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {perceivedRole?.name} ({perceivedRole?.indonesianName})
                    </div>
                    <span className="text-[11px] font-semibold text-[#93C5FD]">
                      {isDrunk ? 'Pemain mengira dia Townsfolk!' : 'Sama dengan peran asli'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.08] text-xs">
                  <span className="text-[#8E8A9E]">Status Hidup:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      player.isAlive
                        ? 'bg-[#10B981]/20 text-[#A7F3D0] border border-[#10B981]/40'
                        : 'bg-[#EF4444]/20 text-[#FECACA] border border-[#EF4444]/40'
                    }`}
                  >
                    {player.isAlive ? 'Hidup' : 'Mati'}
                  </span>

                  {!player.isAlive && (
                    <span className="text-[#8E8A9E] ml-2">
                      Suara Hantu: <strong>{player.hasGhostVote ? 'Masih Ada' : 'Sudah Habis'}</strong>
                    </span>
                  )}
                </div>
              </div>

              {isDrunk && (
                <div className="p-4 rounded-2xl bg-[#281D12] border border-[#D97706]/60 flex items-start gap-3">
                  <Beer className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-sm text-[#FDE68A]">Pemain Ini Adalah THE DRUNK!</h5>
                    <p className="text-xs text-[#FDE68A]/90 mt-1 leading-relaxed">
                      Token aslinya adalah <strong>Drunk (Outsider)</strong>, tetapi pemain ini memegang token <strong>{perceivedRole?.name}</strong>. Kemampuannya TIDAK BERFUNGSI.
                    </p>
                  </div>
                </div>
              )}

              {isPoisoned && (
                <div className="p-4 rounded-2xl bg-[#2B1317] border border-[#EF4444]/60 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-sm text-[#FCA5A5]">Pemain Ini Sedang Diracun (Poisoned)!</h5>
                    <p className="text-xs text-[#FECACA]/90 mt-1 leading-relaxed">
                      Racun dari Poisoner menonaktifkan kemampuan pemain ini. Berikan informasi palsu malam ini.
                    </p>
                  </div>
                </div>
              )}

              {/* Active Reminders on this Player */}
              <div className="p-4 rounded-2xl bg-[#14141B] border border-white/[0.08] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
                  Token Pengingat Menempel ({player.reminders.length}):
                </h4>
                {player.reminders.length === 0 ? (
                  <p className="text-xs text-[#8E8A9E]">Tidak ada token pengingat aktif pada kursi ini.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {player.reminders.map((r) => {
                      const def = REMINDER_MAP[r.reminderId];
                      return (
                        <div
                          key={r.instanceId}
                          className="px-3 py-1.5 rounded-xl bg-[#1E1E28] border border-white/[0.08] flex items-center gap-2 text-xs"
                        >
                          <RoleGlyph roleId={def?.roleId ?? 'imp'} className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <div>
                            <span className="font-bold text-white block">{def?.label}</span>
                            <span className="text-[10px] text-[#8E8A9E]">{def?.indonesianLabel}</span>
                          </div>
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
