'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Beer,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  EyeOff,
  FlaskConical,
  Gavel,
  Ghost,
  HeartPulse,
  LayoutGrid,
  Skull,
  Swords,
  Trash2,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { REMINDER_MAP, REMINDER_TOKENS, ROLE_MAP, ROLES } from '@/lib/botc-data';
import {
  GamePhase,
  PlayerSeat,
  calculateVoteThreshold,
} from '@/lib/botc-engine';
import { CharacterToken, ReminderTokenChip, ReminderTokenTrayCard, RoleGlyph } from './TokenArtwork';
import { SilentCardPayload } from './FullscreenCardModal';
import PeekCardModal from './PeekCardModal';
import DesignateDrunkModal from './DesignateDrunkModal';

interface GrimoireBoardProps {
  players: PlayerSeat[];
  phase: GamePhase;
  dayNumber: number;
  executedTodayPlayerId: string | null;
  demonBluffIds?: string[];
  isDrunkActive?: boolean;
  onSetDrunkPlayer?: (playerId: string) => void;
  onSwapSeats: (fromIndex: number, toIndex: number) => void;
  onMoveSeat: (seatIndex: number, direction: 'cw' | 'ccw') => void;
  onKillPlayer?: (playerId: string, cause: 'demon' | 'execution' | 'slayer') => void;
  onResurrectPlayer?: (playerId: string) => void;
  onChangeDeathCause?: (playerId: string, cause: 'demon' | 'execution' | 'slayer') => void;
  onToggleAlive: (playerId: string, cause?: 'demon' | 'execution' | 'slayer') => void;
  onToggleGhostVote: (playerId: string) => void;
  onAddReminder: (playerId: string, reminderId: string) => void;
  onRemoveReminder: (playerId: string, instanceId: string) => void;
  onMarkExecutedToday: (playerId: string | null) => void;
  onChangePlayerTrueRole: (playerId: string, newTrueRoleId: string) => void;
  onShowSilentCard: (card: SilentCardPayload) => void;
}

export default function GrimoireBoard({
  players,
  phase,
  dayNumber,
  executedTodayPlayerId,
  demonBluffIds = [],
  isDrunkActive = false,
  onSetDrunkPlayer,
  onSwapSeats,
  onMoveSeat,
  onKillPlayer,
  onResurrectPlayer,
  onChangeDeathCause,
  onToggleAlive,
  onToggleGhostVote,
  onAddReminder,
  onRemoveReminder,
  onMarkExecutedToday,
  onChangePlayerTrueRole,
  onShowSilentCard,
}: GrimoireBoardProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    players[0]?.id ?? null
  );
  const [swapModeSourceIdx, setSwapModeSourceIdx] = useState<number | null>(null);
  const [isSwapModeActive, setIsSwapModeActive] = useState(false);
  const [activeBrushReminderId, setActiveBrushReminderId] = useState<string | null>(null);
  const [reminderFilter, setReminderFilter] = useState<'active' | 'all'>('active');
  const [showReminderRules, setShowReminderRules] = useState(false);
  const [displayMode, setDisplayMode] = useState<'circle' | 'cards'>('circle');
  const [spyCleanMode, setSpyCleanMode] = useState(false);
  const [dragPayload, setDragPayload] = useState<
    | { type: 'seat'; seatIndex: number }
    | { type: 'reminder'; reminderId: string }
    | null
  >(null);
  const [dragOverSeatIdx, setDragOverSeatIdx] = useState<number | null>(null);
  const [isPeekModalOpen, setIsPeekModalOpen] = useState(false);
  const [peekPlayerIndex, setPeekPlayerIndex] = useState(0);

  const selectedPlayer =
    players.find((p) => p.id === selectedPlayerId) ?? players[0] ?? null;

  const currentDrunkPlayer = players.find((p) => p.trueRoleId === 'drunk');
  const [isDrunkModalOpen, setIsDrunkModalOpen] = useState(() => {
    return Boolean(isDrunkActive && !currentDrunkPlayer);
  });

  const voteStats = calculateVoteThreshold(players);
  const totalSeats = players.length;

  // Responsive circular geometry
  const radiusPct = totalSeats <= 8 ? 36.5 : totalSeats <= 11 ? 38.5 : 40.5;
  const tokenSize = totalSeats >= 12 ? 'sm' : 'md';

  // Active roles set for filtering relevant reminder tokens
  const inPlayRoleSet = new Set<string>();
  players.forEach((p) => {
    inPlayRoleSet.add(p.trueRoleId);
    inPlayRoleSet.add(p.perceivedRoleId);
  });

  const hasDrunkInPlay = Boolean(currentDrunkPlayer);

  // Strict dynamic reminder filter:
  // If Poisoner is not in play, 'poisoned' is NOT shown!
  // If Drunk is not in play OR if Drunk already exists, 'is_the_drunk' is NOT shown!
  // If Undertaker is not in play, 'executed' is NOT shown!
  const baseReminders =
    reminderFilter === 'all'
      ? REMINDER_TOKENS
      : REMINDER_TOKENS.filter((rem) => {
          if (rem.id === 'executed') {
            return inPlayRoleSet.has('undertaker');
          }
          return inPlayRoleSet.has(rem.roleId);
        });

  // User requirement: "trus kalau udh ada drunk nihhh gabisa drunk lagi lah jadi hapus tuhhh bagian yg ada di is the drunk itu yaaa"
  const displayedReminders = baseReminders.filter((rem) => {
    if (rem.id === 'is_the_drunk' && hasDrunkInPlay) {
      return false;
    }
    return true;
  });

  const phaseLabel =
    phase === 'first_night'
      ? 'Malam Pertama'
      : phase === 'day'
      ? `Siang Hari ke-${dayNumber}`
      : `Malam ke-${dayNumber + 1}`;

  const handleSeatClick = (player: PlayerSeat) => {
    // 1. If a reminder token brush is active, attach that reminder to the clicked seat
    if (activeBrushReminderId) {
      onAddReminder(player.id, activeBrushReminderId);
      setSelectedPlayerId(player.id);
      setActiveBrushReminderId(null);
      return;
    }

    // 2. If seat swap mode is active
    if (isSwapModeActive) {
      if (swapModeSourceIdx === null) {
        setSwapModeSourceIdx(player.seatIndex);
      } else {
        onSwapSeats(swapModeSourceIdx, player.seatIndex);
        setSwapModeSourceIdx(null);
        setIsSwapModeActive(false);
      }
      return;
    }

    // 3. Normal inspect selection
    setSelectedPlayerId(player.id);
  };

  const handleSafeKill = (
    playerId: string,
    cause: 'demon' | 'execution' | 'slayer'
  ) => {
    const target = players.find((p) => p.id === playerId);
    if (!target) return;
    if (onKillPlayer) onKillPlayer(playerId, cause);
    else onToggleAlive(playerId, cause);
  };

  const handleSafeResurrect = (playerId: string) => {
    const target = players.find((p) => p.id === playerId);
    if (!target) return;
    if (onResurrectPlayer) onResurrectPlayer(playerId);
    else onToggleAlive(playerId);
  };

  return (
    <div className="space-y-6">
      {/* Drunk Alert Banner if Drunk is active but no player designated yet */}
      {isDrunkActive && !currentDrunkPlayer && !spyCleanMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3.5 rounded-2xl bg-amber-50 dark:bg-[#2C1808] border-2 border-amber-400 dark:border-[#F59E0B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-950 dark:text-[#FDE68A] shadow-xl"
        >
          <div className="flex items-center gap-2.5">
            <Beer className="w-5 h-5 text-amber-600 dark:text-[#F59E0B] shrink-0" />
            <div>
              <strong className="block font-bold text-amber-900 dark:text-white">
                Perhatian Storyteller: The Drunk Belum Ditentukan!
              </strong>
              <span>
                Tas karakter memiliki +1 Townsfolk ekstra untuk The Drunk. Tentukan pemain Townsfolk mana yang sebenarnya adalah The Drunk sebelum Malam Pertama dimulai.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDrunkModalOpen(true)}
            className="brass-sheen-btn min-h-[40px] px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#F59E0B] text-white dark:text-[#121016] text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer transition-colors shadow"
          >
            Pilih Drunk Sekarang
          </button>
        </motion.div>
      )}

      {/* Top Toolbar above Grimoire */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-[#C8C0B3]">
          <span className="font-semibold text-slate-900 dark:text-[#F5EFE6]">{phaseLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            Hidup: <strong className="text-emerald-700 dark:text-[#6EE7B7]">{voteStats.aliveCount}</strong>/{voteStats.totalPlayers}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            Ambang Eksekusi: <strong className="text-amber-700 dark:text-[#FDE68A]">{voteStats.votesNeeded} suara</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            Suara Hantu: <strong>{voteStats.ghostVotesRemaining}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Drunk Designation Button in Toolbar */}
          {isDrunkActive && (
            <button
              type="button"
              onClick={() => setIsDrunkModalOpen(true)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-100 dark:bg-[#2D1B08] hover:bg-amber-200 dark:hover:bg-[#3D250C] border border-amber-400 dark:border-[#F59E0B] text-amber-900 dark:text-[#FDE68A] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors whitespace-nowrap"
            >
              <Beer className="w-4 h-4 text-amber-600 dark:text-[#F59E0B]" />
              <span>
                {currentDrunkPlayer ? `Drunk: ${currentDrunkPlayer.name}` : 'Tentukan Drunk'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDisplayMode((prev) => (prev === 'circle' ? 'cards' : 'circle'))}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-[#1E1E28] hover:bg-purple-100 dark:hover:bg-[#282838] border border-purple-200 dark:border-white/[0.1] text-xs font-semibold text-purple-900 dark:text-[#EDEAF0] flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm whitespace-nowrap"
          >
            {displayMode === 'circle' ? (
              <>
                <LayoutGrid className="w-4 h-4 text-[#D4AF37]" />
                <span>Mode Daftar Kursi</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-[#D4AF37]" />
                <span>Mode Meja Bundar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPeekPlayerIndex(selectedPlayer ? selectedPlayer.seatIndex : 0);
              setIsPeekModalOpen(true);
            }}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-105 text-[#121016] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            <span>Intip Kartu Pemain</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveBrushReminderId(null);
              if (isSwapModeActive) {
                setIsSwapModeActive(false);
                setSwapModeSourceIdx(null);
              } else {
                setIsSwapModeActive(true);
                setSwapModeSourceIdx(null);
              }
            }}
            aria-pressed={isSwapModeActive}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              isSwapModeActive
                ? 'bg-[#D4AF37] text-[#121016] border-[#D4AF37]'
                : 'bg-purple-50 dark:bg-[#221E2E] hover:bg-purple-100 dark:hover:bg-[#2E293E] text-purple-900 dark:text-[#EDE7DB] border-purple-200 dark:border-[#363049]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{isSwapModeActive ? 'Batal Tukar Kursi' : 'Tukar Posisi Kursi'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSpyCleanMode((prev) => !prev)}
            aria-pressed={spyCleanMode}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              spyCleanMode
                ? 'bg-[#991B1B] text-white border-[#EF4444]'
                : 'bg-purple-50 dark:bg-[#221E2E] hover:bg-purple-100 dark:hover:bg-[#2E293E] text-purple-900 dark:text-[#EDE7DB] border-purple-200 dark:border-[#363049]'
            }`}
          >
            {spyCleanMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{spyCleanMode ? 'Keluar Mode Spy' : 'Mode Spy'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Mode Instruction Banner */}
      {(isSwapModeActive || activeBrushReminderId) && (
        <div className="px-4 py-3 rounded-xl bg-amber-100 dark:bg-[#272115] border border-amber-300 dark:border-[#D4AF37]/60 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-950 dark:text-[#FDE68A] shadow-md">
          {isSwapModeActive ? (
            <div className="flex items-center gap-2 min-w-0">
              <ArrowLeftRight className="w-4 h-4 text-amber-700 dark:text-[#D4AF37] shrink-0" />
              <span>
                {swapModeSourceIdx === null
                  ? 'Mode Tukar Kursi: Ketuk pemain pertama di lingkaran Grimoire yang ingin dipindah.'
                  : `Pemain Kursi ${swapModeSourceIdx + 1} (${players[swapModeSourceIdx]?.name}) dipilih — sekarang ketuk kursi tujuan untuk menukar posisi!`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-amber-400 dark:border-amber-300 shrink-0 bg-[#100E17] shadow-sm">
                <img
                  src={`/reminders/${activeBrushReminderId}.png`}
                  alt={REMINDER_MAP[activeBrushReminderId!]?.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="truncate">
                Mode Pasang Token <strong>{REMINDER_MAP[activeBrushReminderId!]?.label}</strong> ({REMINDER_MAP[activeBrushReminderId!]?.indonesianLabel}): Ketuk kursi pemain untuk menempelkannya!
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSwapModeActive(false);
              setSwapModeSourceIdx(null);
              setActiveBrushReminderId(null);
            }}
            className="px-3 py-1 rounded-lg bg-amber-200 dark:bg-black/30 hover:bg-amber-300 dark:hover:bg-black/50 text-xs font-semibold text-amber-950 dark:text-white cursor-pointer shrink-0 transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* Main Split: 3 Columns on PC (Grimoire Canvas + Inspector + Reminder Tray Side-by-Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Column 1: Arena Meja Grimoire / Daftar Kursi */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white dark:bg-[#14141B] border border-purple-200 dark:border-white/[0.08] rounded-3xl p-3 sm:p-5 shadow-xl">
          {displayMode === 'cards' ? (
            /* Mode Daftar Kursi (Responsive Grid / Mobile Friendly) */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-purple-200 dark:border-white/[0.08]">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-800 dark:text-[#D4AF37] font-bold">
                  Daftar Kursi Pemain ({voteStats.aliveCount} Hidup · {voteStats.totalPlayers - voteStats.aliveCount} Mati)
                </span>
                <span className="text-[11px] text-slate-600 dark:text-[#8E8A9E] font-mono">
                  Ambang: {voteStats.votesNeeded} Suara
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
                {players.map((player) => {
                  const isSelected = selectedPlayer?.id === player.id;
                  const role = ROLE_MAP[player.perceivedRoleId];
                  const isDrunk = player.trueRoleId === 'drunk';
                  return (
                    <motion.div
                      key={player.id}
                      whileHover={{ y: -2 }}
                      onClick={() => handleSeatClick(player)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-50/80 dark:bg-[#1E1E28] border-amber-500 dark:border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]/50'
                          : 'bg-purple-50/40 dark:bg-[#0C0C10] border-purple-200 dark:border-white/[0.08] hover:border-purple-400 dark:hover:border-white/[0.18]'
                      } ${!player.isAlive ? 'opacity-85' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <CharacterToken
                            roleId={player.perceivedRoleId}
                            size="sm"
                            isDead={!player.isAlive}
                            isDrunkSecret={isDrunk}
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold text-amber-800 dark:text-[#D4AF37] uppercase">
                              Kursi {player.seatIndex + 1}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                player.isAlive
                                  ? 'bg-emerald-100 text-emerald-900 dark:bg-[#34D399]/20 dark:text-[#34D399]'
                                  : 'bg-red-100 text-red-900 dark:bg-[#EF4444]/20 dark:text-[#EF4444]'
                              }`}
                            >
                              {player.isAlive ? 'Hidup' : 'Mati'}
                            </span>
                          </div>

                          <div className="font-bold text-sm text-slate-900 dark:text-[#EDEAF0] truncate">
                            {player.name}
                          </div>

                          <div className="text-xs text-slate-600 dark:text-[#8E8A9E] truncate">
                            {role?.name} {isDrunk ? '(Drunk)' : ''}
                          </div>
                        </div>
                      </div>

                      {/* Reminders chips */}
                      {player.reminders.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-purple-100 dark:border-white/[0.06]">
                          {player.reminders.map((rem) => (
                            <ReminderTokenChip
                              key={rem.instanceId}
                              reminderId={rem.reminderId}
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveReminder(player.id, rem.instanceId);
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Quick Actions row */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-purple-100 dark:border-white/[0.06]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (player.isAlive) {
                              handleSafeKill(player.id, 'execution');
                            } else {
                              handleSafeResurrect(player.id);
                            }
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                            player.isAlive
                              ? 'bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 dark:bg-[#EF4444]/20 dark:hover:bg-[#EF4444]/30 dark:text-[#FECACA] dark:border-[#EF4444]/40'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 dark:bg-[#34D399]/20 dark:hover:bg-[#34D399]/30 dark:text-[#A7F3D0] dark:border-[#34D399]/40'
                          }`}
                        >
                          {player.isAlive ? 'Gantung' : 'Hidupkan'}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPeekPlayerIndex(player.seatIndex);
                            setIsPeekModalOpen(true);
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-[11px] font-semibold text-purple-950 dark:text-[#EDEAF0] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3 h-3 text-amber-700 dark:text-[#D4AF37]" />
                          <span>Intip</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Mode Lingkaran Grimoire Klasik */
            <>
              <div
                data-testid="grimoire-circle"
                className="relative w-full aspect-square max-w-[420px] sm:max-w-[460px] xl:max-w-[490px] 2xl:max-w-[520px] mx-auto rounded-full bg-radial from-[#1A1A24] via-[#121217] to-[#0C0C10] border-2 border-white/[0.1] shadow-2xl overflow-hidden"
              >
                {/* Dual Counter-Rotating Luxury Clocktower Compass Rings */}
                <div className="absolute inset-[10%] rounded-full border border-dotted border-[#D4AF37]/25 animate-clockwork-slow pointer-events-none" />
                <div className="absolute inset-[16%] rounded-full border-2 border-dashed border-[#D4AF37]/25 animate-clockwork-reverse pointer-events-none" />

                {/* Center Clocktower Hub with subtle breathing glow */}
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[26%] h-[26%] rounded-full bg-white/95 dark:bg-[#14141B]/95 border-2 border-purple-200 dark:border-white/[0.12] flex flex-col items-center justify-center text-center p-2 pointer-events-none shadow-xl z-10"
                >
                  <span className="font-display text-[10px] sm:text-xs font-black tracking-widest text-amber-800 dark:text-[#D4AF37] leading-tight font-mono">
                    GRIMOIRE
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-bold text-slate-900 dark:text-[#EDEAF0] mt-0.5 truncate max-w-full">
                    {phaseLabel}
                  </span>
                  <span className="font-mono text-[9px] sm:text-[11px] font-bold text-emerald-700 dark:text-[#34D399] mt-0.5 tabular-nums">
                    {voteStats.aliveCount}H · {voteStats.votesNeeded}V
                  </span>
                </motion.div>

                {/* Circular Player Seats & Inner-Ring Reminder Tokens */}
                {players.map((player, index) => {
                  const angle = (index / totalSeats) * 2 * Math.PI - Math.PI / 2;
                  const leftPct = 50 + radiusPct * Math.cos(angle);
                  const topPct = 50 + radiusPct * Math.sin(angle);

                  const isSelected = !spyCleanMode && selectedPlayer?.id === player.id;
                  const isSwapSource = swapModeSourceIdx === index;
                  const isDragTarget = dragOverSeatIdx === index;
                  const isDrunk = player.trueRoleId === 'drunk';
                  const isPoisoned = player.reminders.some((r) => r.reminderId === 'poisoned');
                  const displayRoleId = spyCleanMode ? player.trueRoleId : player.perceivedRoleId;
                  const nonDrunkReminders = player.reminders.filter(
                    (r) => r.reminderId !== 'is_the_drunk' && r.reminderId !== 'executed'
                  );

                  return (
                    <React.Fragment key={player.id}>
                      <div
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                        }}
                        draggable={!spyCleanMode}
                        onDragStart={(e) => {
                          setDragPayload({ type: 'seat', seatIndex: index });
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverSeatIdx !== index) setDragOverSeatIdx(index);
                        }}
                        onDragLeave={() => {
                          if (dragOverSeatIdx === index) setDragOverSeatIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverSeatIdx(null);
                          if (!dragPayload) return;
                          if (dragPayload.type === 'seat') {
                            onSwapSeats(dragPayload.seatIndex, index);
                          } else if (dragPayload.type === 'reminder') {
                            onAddReminder(player.id, dragPayload.reminderId);
                            setSelectedPlayerId(player.id);
                          }
                          setDragPayload(null);
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                      >
                        <motion.div
                          initial={{ scale: 0.78, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.03, type: 'spring', stiffness: 280, damping: 22 }}
                          className="flex flex-col items-center"
                        >
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.07 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleSeatClick(player)}
                            aria-label={`Kursi ${index + 1}: ${player.name}, peran ${
                              ROLE_MAP[player.perceivedRoleId]?.name
                            }${isDrunk ? ' (Sebenarnya Drunk)' : ''}, status ${
                              player.isAlive ? 'Hidup' : 'Mati'
                            }`}
                            className={`group relative rounded-full p-0.5 transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24] ${
                              isSelected
                                ? 'ring-[3.5px] ring-[#D4AF37] scale-105 shadow-[0_0_24px_rgba(212,175,55,0.55)]'
                                : isSwapSource || isDragTarget
                                ? 'ring-[3.5px] ring-[#38BDF8] scale-110 shadow-[0_0_22px_rgba(56,189,248,0.5)]'
                                : 'hover:shadow-[0_0_16px_rgba(212,175,55,0.28)]'
                            }`}
                          >
                            <CharacterToken
                              roleId={displayRoleId}
                              size={tokenSize}
                              isDead={!player.isAlive}
                              deathCause={player.deathCause}
                              isDrunkSecret={isDrunk && !spyCleanMode}
                              isPoisoned={isPoisoned && !spyCleanMode}
                            />

                            {/* Seat Number Tag */}
                            <span className="absolute -top-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0C0C10] border-2 border-[#D4AF37] font-mono text-[10px] sm:text-xs font-black text-[#FDE68A] flex items-center justify-center tabular-nums shadow-md z-20">
                              {index + 1}
                            </span>

                            {/* Ghost Vote Pip */}
                            {!player.isAlive && player.hasGhostVote && (
                              <span
                                title="Suara Hantu masih tersedia"
                                className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1E293B] border-2 border-[#94A3B8] flex items-center justify-center shadow-md z-20"
                              >
                                <Ghost className="w-3 h-3 text-[#E2E8F0]" />
                              </span>
                            )}
                          </motion.button>

                          {/* Player Name */}
                          <div className="flex flex-col items-center gap-0.5 sm:gap-1 mt-1 sm:mt-1.5">
                            <span
                              className={`px-1.5 sm:px-2.5 py-0.5 rounded-lg text-[9px] sm:text-xs font-black tracking-wide max-w-[76px] sm:max-w-[120px] truncate text-center shadow-md border leading-tight ${
                                player.isAlive
                                  ? 'bg-white dark:bg-[#14141B]/95 text-slate-900 dark:text-white border-purple-300 dark:border-white/[0.1]'
                                  : 'bg-slate-100 dark:bg-[#0C0C10]/95 text-slate-500 dark:text-[#8E8A9E] border-slate-300 dark:border-white/[0.06] line-through'
                              }`}
                            >
                              {player.name}
                            </span>

                            {/* Distinct Status Badges */}
                            {!spyCleanMode && (
                              <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 max-w-[100px] sm:max-w-[130px]">
                                {!player.isAlive && (
                                  player.deathCause === 'demon' ? (
                                    <span className="text-[7px] sm:text-[9px] font-black text-[#FECACA] bg-[#450A0A] border border-[#DC2626] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                                      DEMON
                                    </span>
                                  ) : player.deathCause === 'execution' ? (
                                    <span className="text-[7px] sm:text-[9px] font-black text-[#FDE68A] bg-[#3B2808] border border-[#D4AF37] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                                      GANTUNG
                                    </span>
                                  ) : (
                                    <span className="text-[7px] sm:text-[9px] font-black text-[#E4E4E7] bg-[#18181B] border border-[#52525B] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                                      MATI
                                    </span>
                                  )
                                )}

                                {isDrunk && (
                                  <span className="text-[7px] sm:text-[9px] font-black text-[#FDE68A] bg-[#451A03] border border-[#F59E0B] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full uppercase tracking-wider shadow flex items-center gap-0.5 whitespace-nowrap">
                                    <Beer className="w-2.5 h-2.5 text-[#F59E0B]" />
                                    <span>DRUNK</span>
                                  </span>
                                )}

                                {isPoisoned && (
                                  <span className="text-[7px] sm:text-[9px] font-black text-[#FECACA] bg-[#7F1D1D] border border-[#EF4444] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full uppercase tracking-wider shadow flex items-center gap-0.5 animate-pulse whitespace-nowrap">
                                    <FlaskConical className="w-2.5 h-2.5 text-[#F87171]" />
                                    <span>RACUN</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Attached Reminder Tokens with Authentic Images */}
                            {!spyCleanMode && nonDrunkReminders.length > 0 && (
                              <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 max-w-[100px] sm:max-w-[120px] mt-0.5">
                                {nonDrunkReminders.map((rem) => (
                                  <ReminderTokenChip
                                    key={rem.instanceId}
                                    reminderId={rem.reminderId}
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveReminder(player.id, rem.instanceId);
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {!spyCleanMode && (
                <p className="text-center text-[11px] text-slate-500 dark:text-[#8E8A9E] mt-3">
                  Klik kursi pemain untuk melihat info & kelola token, atau klik <strong>Mode Daftar Kursi</strong> untuk tampilan kartu.
                </p>
              )}
            </>
          )}
        </div>

        {/* Column 2: Selected Player Inspector Card (Gambar 3) */}
        {!spyCleanMode && (
          <div className="lg:col-span-4 xl:col-span-4 space-y-4">
            <AnimatePresence mode="wait">
              {selectedPlayer ? (
                <motion.div
                  key={selectedPlayer.id}
                  initial={{ opacity: 0, y: 8, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.985 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl"
                >
                {/* Header: Token + Big Role & Player Details */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-purple-100 dark:border-[#2C263B]">
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                    {/* Enlarged Authentic Token Medallion */}
                    <div
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 shadow-xl ${
                        !selectedPlayer.isAlive
                          ? 'bg-slate-200 dark:bg-[#14111B] border-[3px] border-slate-400 dark:border-[#38324B]'
                          : 'bg-white dark:bg-[#14111B] border-[3px] border-[#D4AF37] ring-2 ring-[#D4AF37]/40'
                      }`}
                    >
                      <img
                        src={`/tokens/${selectedPlayer.perceivedRoleId}.png`}
                        alt={selectedPlayer.perceivedRoleId}
                        className={`w-full h-full object-contain filter drop-shadow ${
                          !selectedPlayer.isAlive
                            ? 'grayscale-[85%] opacity-65 contrast-[1.1] dark:brightness-[0.75] dark:opacity-75'
                            : ''
                        }`}
                      />
                      {!selectedPlayer.isAlive && (
                        <div className="absolute inset-0 bg-slate-900/15 dark:bg-black/35 pointer-events-none" />
                      )}
                    </div>

                    {/* Prominent Role & Player Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Seat Badge & Alive Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-[#251F33] border border-amber-300 dark:border-[#3C3450] font-mono text-xs font-black text-amber-900 dark:text-[#D4AF37]">
                          Kursi {selectedPlayer.seatIndex + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border ${
                            selectedPlayer.isAlive
                              ? 'bg-emerald-50 dark:bg-[#142A20] border-emerald-300 dark:border-[#10B981]/60 text-emerald-800 dark:text-[#6EE7B7]'
                              : selectedPlayer.deathCause === 'demon'
                              ? 'bg-red-50 dark:bg-[#35070A] border-red-300 dark:border-[#EF4444]/70 text-red-800 dark:text-[#FECACA]'
                              : selectedPlayer.deathCause === 'execution'
                              ? 'bg-amber-50 dark:bg-[#291B06] border-amber-300 dark:border-[#D4AF37]/80 text-amber-900 dark:text-[#FDE68A]'
                              : selectedPlayer.deathCause === 'slayer'
                              ? 'bg-orange-50 dark:bg-[#35160A] border-orange-300 dark:border-[#F97316]/80 text-orange-900 dark:text-[#FED7AA]'
                              : 'bg-slate-100 dark:bg-[#1F1F23] border-slate-300 dark:border-[#52525B] text-slate-800 dark:text-[#D4D4D8]'
                          }`}
                        >
                          {selectedPlayer.isAlive
                            ? 'Masih Hidup'
                            : selectedPlayer.deathCause === 'demon'
                            ? 'Mati: Dibunuh Demon'
                            : selectedPlayer.deathCause === 'execution'
                            ? 'Mati: Digantung'
                            : selectedPlayer.deathCause === 'slayer'
                            ? 'Mati: Ditembak Slayer'
                            : 'Telah Mati'}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs text-slate-600 dark:text-[#8E8A9E] font-medium">
                          Nama:{' '}
                          <strong
                            className={`text-slate-900 dark:text-white font-extrabold ${
                              !selectedPlayer.isAlive ? 'line-through text-slate-500 dark:text-[#9CA3AF]' : ''
                            }`}
                          >
                            {selectedPlayer.name}
                          </strong>
                        </span>
                      </div>

                      {/* Giant, High-Contrast Role Title */}
                      {selectedPlayer.trueRoleId === 'drunk' ? (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-lg sm:text-xl font-black text-[#F59E0B] tracking-wide uppercase bg-amber-100 dark:bg-[#3D2008] border-2 border-[#F59E0B] px-2.5 py-0.5 rounded-lg shadow-md">
                              ASLI: THE DRUNK
                            </span>
                            <span className="text-sm font-extrabold text-amber-950 dark:text-[#FDE68A]">
                              (Pemabuk)
                            </span>
                            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-950 border border-sky-300 dark:bg-[#075985] dark:text-[#BAE6FD] dark:border-[#0284C7] text-[10px] font-black uppercase tracking-wider">
                              Outsider
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-blue-950 dark:text-[#93C5FD]">
                            Peran Samaran / Mengira:{' '}
                            <strong className="text-slate-900 dark:text-white text-sm font-black uppercase">
                              {ROLE_MAP[selectedPlayer.perceivedRoleId]?.name}
                            </strong>{' '}
                            ({ROLE_MAP[selectedPlayer.perceivedRoleId]?.indonesianName})
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5 pt-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide uppercase">
                              {ROLE_MAP[selectedPlayer.trueRoleId]?.name}
                            </span>
                            <span className="text-base sm:text-lg font-extrabold text-amber-950 dark:text-[#FDE68A]">
                              ({ROLE_MAP[selectedPlayer.trueRoleId]?.indonesianName})
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                ROLE_MAP[selectedPlayer.trueRoleId]?.team === 'townsfolk'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-[#1E3A8A] dark:text-[#BFDBFE] dark:border-[#3B82F6]'
                                  : ROLE_MAP[selectedPlayer.trueRoleId]?.team === 'outsider'
                                  ? 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-[#075985] dark:text-[#BAE6FD] dark:border-[#0284C7]'
                                  : ROLE_MAP[selectedPlayer.trueRoleId]?.team === 'minion'
                                  ? 'bg-orange-100 text-orange-950 border-orange-300 dark:bg-[#7F1D1D] dark:text-[#FECACA] dark:border-[#DC2626]'
                                  : 'bg-red-100 text-red-950 border-red-300 dark:bg-[#450A0A] dark:text-[#FCA5A5] dark:border-[#EF4444]'
                              }`}
                            >
                              {ROLE_MAP[selectedPlayer.trueRoleId]?.team}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seat Shift Left / Right Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMoveSeat(selectedPlayer.seatIndex, 'ccw')}
                      title="Geser Kursi Berlawanan Jarum Jam"
                      aria-label={`Geser kursi ${selectedPlayer.name} ke kiri`}
                      className="min-w-[36px] min-h-[36px] rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-[#231F30] dark:hover:bg-[#2F2A40] text-purple-900 dark:text-[#EDE7DB] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveSeat(selectedPlayer.seatIndex, 'cw')}
                      title="Geser Kursi Searah Jarum Jam"
                      aria-label={`Geser kursi ${selectedPlayer.name} ke kanan`}
                      className="min-w-[36px] min-h-[36px] rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-[#231F30] dark:hover:bg-[#2F2A40] text-purple-900 dark:text-[#EDE7DB] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Role Ability Box */}
                <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-[#120F1A] border border-purple-200/80 dark:border-[#2B253D] space-y-1">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-[#A8A092] uppercase tracking-wider">
                    Kemampuan Karakter:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-[#F5EFE6] leading-relaxed">
                    {ROLE_MAP[selectedPlayer.trueRoleId]?.ability}
                  </p>
                </div>

                {/* Intip Kartu Rahasia Pemain Ini - High Contrast Solid Gold */}
                <button
                  type="button"
                  onClick={() => {
                    setPeekPlayerIndex(selectedPlayer.seatIndex);
                    setIsPeekModalOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C365] text-[#121016] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md border border-[#F59E0B]"
                >
                  <Eye className="w-4 h-4 text-[#121016]" />
                  <span>Intip Kartu Rahasia {selectedPlayer.name}</span>
                </button>

                {/* Drunk Alert Banner in Inspector */}
                {selectedPlayer.trueRoleId === 'drunk' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#281C10] border border-amber-300 dark:border-[#D97706]/70 text-xs text-amber-950 dark:text-[#FDE68A] flex items-start gap-2.5">
                    <Beer className="w-4 h-4 text-amber-600 dark:text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-amber-900 dark:text-[#FDE68A]">Pemain Ini Adalah THE DRUNK!</strong>
                      <span className="leading-relaxed">
                        Pemain mengira dirinya adalah <strong>{ROLE_MAP[selectedPlayer.perceivedRoleId]?.name}</strong>. Kemampuannya tidak berfungsi nyata atau berikan info palsu.
                      </span>
                    </div>
                  </div>
                )}

                {/* Primary Status Action Buttons - Both hanging and demon kills mark the player DEAD & BLACK */}
                <div className="grid grid-cols-2 gap-2.5">
                  {selectedPlayer.isAlive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSafeKill(selectedPlayer.id, 'demon')}
                        className="min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-red-50 hover:bg-red-100 dark:bg-[#2C1619] dark:hover:bg-[#3D1E22] border border-red-300 dark:border-[#EF4444]/60 text-red-700 dark:text-[#FECACA]"
                      >
                        <Swords className="w-4 h-4 text-red-600 dark:text-[#F87171] shrink-0" />
                        <span>Mati Dibunuh Demon</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSafeKill(selectedPlayer.id, 'execution')}
                        className="min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100 dark:bg-[#2B2011] dark:hover:bg-[#3A2C18] border border-amber-300 dark:border-[#F59E0B]/60 text-amber-800 dark:text-[#FDE68A]"
                      >
                        <Gavel className="w-4 h-4 text-amber-600 dark:text-[#F59E0B] shrink-0" />
                        <span>Mati Digantung</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSafeResurrect(selectedPlayer.id)}
                        className="min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-emerald-50 hover:bg-emerald-100 dark:bg-[#142922] dark:hover:bg-[#1B382E] border border-emerald-300 dark:border-[#10B981]/50 text-emerald-800 dark:text-[#A7F3D0]"
                      >
                        <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-[#34D399] shrink-0" />
                        <span>Hidupkan Kembali</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextCause =
                            selectedPlayer.deathCause === 'demon' ? 'execution' : 'demon';
                          if (onChangeDeathCause) {
                            onChangeDeathCause(selectedPlayer.id, nextCause);
                          } else {
                            onToggleAlive(selectedPlayer.id, nextCause);
                          }
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-purple-50 hover:bg-purple-100 dark:bg-[#231F30] dark:hover:bg-[#2F2A40] border border-purple-200 dark:border-[#38324C] text-purple-900 dark:text-[#EDE7DB]"
                      >
                        {selectedPlayer.deathCause === 'demon' ? (
                          <>
                            <Gavel className="w-4 h-4 text-amber-600 dark:text-[#F59E0B] shrink-0" />
                            <span>Ubah: Digantung</span>
                          </>
                        ) : (
                          <>
                            <Swords className="w-4 h-4 text-red-600 dark:text-[#F87171] shrink-0" />
                            <span>Ubah: Dibunuh Demon</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Secondary Actions: Ghost Vote + Silent Show Card + Emergency Role Change */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-100 dark:border-[#292535]">
                  {!selectedPlayer.isAlive && (
                    <button
                      type="button"
                      onClick={() => onToggleGhostVote(selectedPlayer.id)}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-[#221E2E] dark:hover:bg-[#2E293F] text-xs font-medium text-purple-950 dark:text-[#D6CFC2] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Ghost className="w-3.5 h-3.5 text-indigo-600 dark:text-[#93C5FD]" />
                      <span>
                        {selectedPlayer.hasGhostVote
                          ? 'Pakai Suara Hantu'
                          : 'Pulihkan Suara Hantu'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const roleDef = ROLE_MAP[selectedPlayer.perceivedRoleId];
                      if (!roleDef) return;
                      onShowSilentCard({
                        heading: `Karakter: ${roleDef.name}`,
                        subheading: roleDef.indonesianName,
                        roleIds: [roleDef.id],
                      });
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-[#221E2E] dark:hover:bg-[#2E293F] text-xs font-medium text-purple-950 dark:text-[#EDE7DB] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-[#D4AF37]" />
                    <span>Tunjuk Token di Layar</span>
                  </button>

                  {/* Role change dropdown (e.g. Imp Starpass or Scarlet Woman becoming Imp) */}
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="change-true-role"
                      className="text-[11px] text-slate-600 dark:text-[#A8A092]"
                    >
                      Ubah Peran:
                    </label>
                    <select
                      id="change-true-role"
                      value={selectedPlayer.trueRoleId}
                      onChange={(e) =>
                        onChangePlayerTrueRole(selectedPlayer.id, e.target.value)
                      }
                      className="min-h-[38px] rounded-lg bg-purple-50 dark:bg-[#14111B] border border-purple-200 dark:border-[#322D42] px-2 py-1 text-xs text-slate-900 dark:text-[#EDE7DB]"
                    >
                      {ROLES.map((r) => {
                        const isAnotherDrunk =
                          r.id === 'drunk' &&
                          players.some(
                            (p) => p.id !== selectedPlayer.id && p.trueRoleId === 'drunk'
                          );
                        return (
                          <option
                            key={r.id}
                            value={r.id}
                            disabled={isAnotherDrunk}
                          >
                            {r.name}
                            {isAnotherDrunk ? ' (Maksimal 1 Drunk)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Active Reminder Tokens on Selected Player */}
                <div className="pt-2 border-t border-purple-100 dark:border-[#292535] space-y-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-[#B8B0A2]">
                    Token Pengingat di Kursi {selectedPlayer.name}:
                  </div>
                  {selectedPlayer.reminders.filter((r) => r.reminderId !== 'executed').length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-[#7D758A]">
                      Belum ada token pengingat menempel di kursi ini.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayer.reminders
                        .filter((r) => r.reminderId !== 'executed')
                        .map((rem) => {
                          const def = REMINDER_MAP[rem.reminderId];
                          if (!def) return null;
                          return (
                            <div
                              key={rem.instanceId}
                              className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full bg-purple-50 dark:bg-[#201B2E] border border-purple-200 dark:border-[#38314A] shadow-sm text-xs"
                            >
                              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/30 shrink-0 bg-[#100E17]">
                                <img
                                  src={`/reminders/${def.id}.png`}
                                  alt={def.label}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-[#EDEAF0]">
                                {def.label}
                              </span>
                              <span className="text-[10px] text-purple-700 dark:text-[#D4AF37]">
                                ({def.indonesianLabel})
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemoveReminder(selectedPlayer.id, rem.instanceId)}
                                className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                                title={`Hapus token ${def.label}`}
                                aria-label={`Hapus token ${def.label}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-inspector"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-[#8E8A9E] shadow-xl"
              >
                Pilih salah satu kursi di lingkaran Grimoire untuk memeriksa detail peran dan mengelola status pemain.
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}

        {/* Column 3: Baki Token Pengingat (Side-by-side with Inspector on PC, No Page Scroll) */}
        {!spyCleanMode && (
          <div className="lg:col-span-3 xl:col-span-3">
            <div className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2A2636] rounded-2xl p-4 space-y-3 shadow-xl max-h-[calc(100vh-175px)] flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-[#F5EFE6]">
                    Baki Token Pengingat
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-[#A8A092] mt-0.5 line-clamp-2">
                    {selectedPlayer
                      ? `Ketuk token untuk menempelkan ke ${selectedPlayer.name} (Kursi ${selectedPlayer.seatIndex + 1}).`
                      : 'Ketuk token lalu ketuk kursi di lingkaran.'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                  {/* Detail Aturan Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowReminderRules((prev) => !prev)}
                    aria-pressed={showReminderRules}
                    className={`min-h-[32px] px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer border transition-colors ${
                      showReminderRules
                        ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-amber-200'
                        : 'bg-purple-100 dark:bg-[#1E1E28] border-purple-200 dark:border-white/[0.1] text-purple-900 dark:text-[#EDEAF0]'
                    }`}
                    title="Tampilkan keterangan aturan efek token"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-[#D4AF37]" />
                    <span>Detail</span>
                  </button>

                  <div className="flex items-center gap-0.5 p-0.5 bg-purple-100 dark:bg-[#121018] rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setReminderFilter('active')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        reminderFilter === 'active'
                          ? 'bg-purple-200 dark:bg-[#2C263B] text-purple-950 dark:text-[#F5EFE6]'
                          : 'text-slate-600 dark:text-[#9C9486]'
                      }`}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderFilter('all')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        reminderFilter === 'all'
                          ? 'bg-purple-200 dark:bg-[#2C263B] text-purple-950 dark:text-[#F5EFE6]'
                          : 'text-slate-600 dark:text-[#9C9486]'
                      }`}
                    >
                      Semua
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable list inside tray card so page doesn't scroll */}
              <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1 flex-1">
                {displayedReminders.map((rem) => (
                  <ReminderTokenTrayCard
                    key={rem.id}
                    reminderId={rem.id}
                    isSelected={activeBrushReminderId === rem.id}
                    showRuleDetail={showReminderRules}
                    onDragStart={(e) => {
                      setDragPayload({ type: 'reminder', reminderId: rem.id });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => {
                      if (selectedPlayer) {
                        onAddReminder(selectedPlayer.id, rem.id);
                      } else {
                        setIsSwapModeActive(false);
                        setSwapModeSourceIdx(null);
                        setActiveBrushReminderId((prev) =>
                          prev === rem.id ? null : rem.id
                        );
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secret Peek Modal for Storyteller & Private Player Show */}
      <PeekCardModal
        isOpen={isPeekModalOpen}
        players={players}
        initialPlayerIndex={peekPlayerIndex}
        demonBluffIds={demonBluffIds}
        onClose={() => setIsPeekModalOpen(false)}
      />

      {/* Designate Drunk Modal */}
      {isDrunkActive && onSetDrunkPlayer && (
        <DesignateDrunkModal
          isOpen={isDrunkModalOpen}
          players={players}
          currentDrunkPlayerId={currentDrunkPlayer?.id ?? null}
          onSelectDrunkPlayer={(playerId) => {
            onSetDrunkPlayer(playerId);
            setIsDrunkModalOpen(false);
          }}
          onClose={() => setIsDrunkModalOpen(false)}
        />
      )}
    </div>
  );
}
