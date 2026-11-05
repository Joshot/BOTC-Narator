'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Beer,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FlaskConical,
  Gavel,
  Ghost,
  HeartPulse,
  Skull,
  Swords,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { REMINDER_MAP, REMINDER_TOKENS, ROLE_MAP, ROLES } from '@/lib/botc-data';
import {
  GamePhase,
  PlayerSeat,
  calculateVoteThreshold,
} from '@/lib/botc-engine';
import { CharacterToken, ReminderTokenChip, RoleGlyph } from './TokenArtwork';
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

  return (
    <div className="space-y-6">
      {/* Drunk Alert Banner if Drunk is active but no player designated yet */}
      {isDrunkActive && !currentDrunkPlayer && !spyCleanMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3.5 rounded-2xl bg-[#2C1808] border-2 border-[#F59E0B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#FDE68A] shadow-xl"
        >
          <div className="flex items-center gap-2.5">
            <Beer className="w-5 h-5 text-[#F59E0B] shrink-0" />
            <div>
              <strong className="block font-bold text-white">
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
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#F59E0B] text-[#121016] text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer transition-colors shadow"
          >
            Pilih Drunk Sekarang
          </button>
        </motion.div>
      )}

      {/* Top Toolbar above Grimoire */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#181520] border border-[#2A2636] rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#C8C0B3]">
          <span className="font-semibold text-[#F5EFE6]">{phaseLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            Hidup: <strong className="text-[#6EE7B7]">{voteStats.aliveCount}</strong>/{voteStats.totalPlayers}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            Ambang Eksekusi: <strong className="text-[#FDE68A]">{voteStats.votesNeeded} suara</strong>
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
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#2D1B08] hover:bg-[#3D250C] border border-[#F59E0B] text-[#FDE68A] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors whitespace-nowrap"
            >
              <Beer className="w-4 h-4 text-[#F59E0B]" />
              <span>
                {currentDrunkPlayer ? `Drunk: ${currentDrunkPlayer.name}` : 'Tentukan Drunk'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPeekPlayerIndex(selectedPlayer ? selectedPlayer.seatIndex : 0);
              setIsPeekModalOpen(true);
            }}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all whitespace-nowrap"
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
                : 'bg-[#221E2E] hover:bg-[#2E293E] text-[#EDE7DB] border-[#363049]'
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
                : 'bg-[#221E2E] hover:bg-[#2E293E] text-[#EDE7DB] border-[#363049]'
            }`}
          >
            {spyCleanMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{spyCleanMode ? 'Keluar Mode Spy' : 'Mode Spy'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Mode Instruction Banner */}
      {(isSwapModeActive || activeBrushReminderId) && (
        <div className="px-4 py-3 rounded-xl bg-[#272115] border border-[#D4AF37]/60 flex items-center justify-between gap-3 text-xs sm:text-sm text-[#FDE68A]">
          {isSwapModeActive ? (
            <span>
              {swapModeSourceIdx === null
                ? 'Mode Tukar Kursi: Ketuk pemain pertama di lingkaran Grimoire yang ingin dipindah.'
                : `Pemain Kursi ${swapModeSourceIdx + 1} (${players[swapModeSourceIdx]?.name}) dipilih — sekarang ketuk kursi tujuan untuk menukar posisi!`}
            </span>
          ) : (
            <span>
              Mode Pasang Token <strong>{REMINDER_MAP[activeBrushReminderId!]?.label}</strong> ({REMINDER_MAP[activeBrushReminderId!]?.indonesianLabel}): Ketuk kursi pemain di lingkaran Grimoire untuk menempelkannya!
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSwapModeActive(false);
              setSwapModeSourceIdx(null);
              setActiveBrushReminderId(null);
            }}
            className="px-2.5 py-1 rounded-lg bg-black/30 text-xs font-semibold text-white cursor-pointer shrink-0"
          >
            Batal
          </button>
        </div>
      )}

      {/* Main Split: Circular Grimoire Canvas + Inspector / Reminder Tray */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center: Velvet Circular Grimoire Arena */}
        <div className="lg:col-span-7 bg-[#15121D] border border-[#2D283B] rounded-3xl p-3 sm:p-6 shadow-2xl">
          <div
            data-testid="grimoire-circle"
            className="relative w-full aspect-square max-w-[580px] sm:max-w-[620px] mx-auto rounded-full bg-radial from-[#221C2F] via-[#171320] to-[#0E0C13] border-2 border-[#3E3752] shadow-2xl"
          >
            {/* Subtle clocktower compass ring */}
            <div className="absolute inset-[15%] rounded-full border-2 border-dashed border-[#D4AF37]/20 pointer-events-none" />

            {/* Center Clocktower Hub with subtle floating animation */}
            <motion.div
              animate={{ scale: [1, 1.025, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[26%] h-[26%] rounded-full bg-[#13101A]/95 border-2 border-[#38314A] flex flex-col items-center justify-center text-center p-2 pointer-events-none shadow-xl"
            >
              <span className="font-display text-[10px] sm:text-xs font-black tracking-widest text-[#D4AF37] leading-tight">
                GRIMOIRE
              </span>
              <span className="text-[9px] sm:text-[11px] font-bold text-[#E2DCD2] mt-0.5 truncate max-w-full">
                {phaseLabel}
              </span>
              <span className="font-mono text-[9px] sm:text-[11px] font-bold text-[#6EE7B7] mt-0.5 tabular-nums">
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
              const nonDrunkReminders = player.reminders.filter((r) => r.reminderId !== 'is_the_drunk');

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
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.03, duration: 0.25 }}
                      className="flex flex-col items-center"
                    >
                      <button
                        type="button"
                        onClick={() => handleSeatClick(player)}
                        aria-label={`Kursi ${index + 1}: ${player.name}, peran ${
                          ROLE_MAP[player.perceivedRoleId]?.name
                        }${isDrunk ? ' (Sebenarnya Drunk)' : ''}, status ${
                          player.isAlive ? 'Hidup' : 'Mati'
                        }`}
                        className={`group relative rounded-full p-0.5 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24] ${
                          isSelected
                            ? 'ring-[3.5px] ring-[#D4AF37] scale-105 shadow-[0_0_20px_rgba(212,175,55,0.45)]'
                            : isSwapSource || isDragTarget
                            ? 'ring-[3.5px] ring-[#38BDF8] scale-110 shadow-[0_0_20px_rgba(56,189,248,0.45)]'
                            : 'hover:scale-105'
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

                        {/* Seat Number Tag - High contrast and bold */}
                        <span className="absolute -top-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#121018] border-2 border-[#D4AF37] font-mono text-[10px] sm:text-xs font-black text-[#FDE68A] flex items-center justify-center tabular-nums shadow-md z-20">
                          {index + 1}
                        </span>

                        {/* Ghost Vote Pip when Dead */}
                        {!player.isAlive && player.hasGhostVote && (
                          <span
                            title="Suara Hantu masih tersedia"
                            className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1E293B] border-2 border-[#94A3B8] flex items-center justify-center shadow-md z-20"
                          >
                            <Ghost className="w-3 h-3 text-[#E2E8F0]" />
                          </span>
                        )}
                      </button>

                      {/* Player Name, Status Badges, and Attached Reminder Tokens - Vertically stacked, zero overlaps! */}
                      <div className="flex flex-col items-center gap-1 mt-1.5">
                        {/* Name Pill */}
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-black tracking-wide max-w-[90px] sm:max-w-[120px] truncate text-center shadow-lg border leading-tight ${
                            player.isAlive
                              ? 'bg-[#15121F]/95 text-white border-[#4E4466]'
                              : 'bg-[#100D16]/95 text-[#A1A1AA] border-[#3F3F46] line-through'
                          }`}
                        >
                          {player.name}
                        </span>

                        {/* Distinct Status Badges: Dead / Drunk / Poisoned */}
                        {!spyCleanMode && (
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[130px]">
                            {!player.isAlive && (
                              player.deathCause === 'demon' ? (
                                <span className="text-[8px] sm:text-[9px] font-black text-[#FECACA] bg-[#450A0A] border border-[#DC2626] px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                                  DIBUNUH DEMON
                                </span>
                              ) : player.deathCause === 'execution' ? (
                                <span className="text-[8px] sm:text-[9px] font-black text-[#FDE68A] bg-[#3B2808] border border-[#D4AF37] px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                                  DIGANTUNG
                                </span>
                              ) : (
                                <span className="text-[8px] sm:text-[9px] font-black text-[#E4E4E7] bg-[#18181B] border border-[#52525B] px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                                  MATI
                                </span>
                              )
                            )}

                            {isDrunk && (
                              <span className="text-[8px] sm:text-[9px] font-black text-[#FDE68A] bg-[#451A03] border border-[#F59E0B] px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow flex items-center gap-1">
                                <Beer className="w-3 h-3 text-[#F59E0B]" />
                                <span>ASLI: DRUNK</span>
                              </span>
                            )}

                            {isPoisoned && (
                              <span className="text-[8px] sm:text-[9px] font-black text-[#FECACA] bg-[#7F1D1D] border border-[#EF4444] px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow flex items-center gap-1 animate-pulse">
                                <FlaskConical className="w-3 h-3 text-[#F87171]" />
                                <span>DIRACUN</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Attached Reminder Tokens (Excluding is_the_drunk to prevent duplicate indicator) */}
                        {!spyCleanMode && nonDrunkReminders.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[120px] mt-0.5">
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
            <p className="text-center text-[11px] text-[#9C9486] mt-3">
              Tips: Seret (drag) kursi untuk menukar tempat duduk, atau seret token pengingat dari baki ke atas kursi pemain. Di layar HP, ketuk token pengingat lalu ketuk kursi pemain.
            </p>
          )}
        </div>

        {/* Right Column: Selected Player Quick Control + Reminder Token Tray */}
        {!spyCleanMode && (
          <div className="lg:col-span-5 space-y-5">
            {/* Selected Seat Inspector Card */}
            {selectedPlayer && (
              <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CharacterToken
                      roleId={selectedPlayer.perceivedRoleId}
                      size="sm"
                      isDead={!selectedPlayer.isAlive}
                      deathCause={selectedPlayer.deathCause}
                      isDrunkSecret={selectedPlayer.trueRoleId === 'drunk'}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-[#A8A092]">
                        <span className="font-mono tabular-nums">
                          Kursi {selectedPlayer.seatIndex + 1}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            !selectedPlayer.isAlive
                              ? selectedPlayer.deathCause === 'demon'
                                ? 'text-[#FCA5A5] font-semibold'
                                : selectedPlayer.deathCause === 'execution'
                                ? 'text-[#FDE68A] font-semibold'
                                : 'text-[#F87171] font-semibold'
                              : 'text-[#86EFAC]'
                          }
                        >
                          {selectedPlayer.isAlive
                            ? 'Masih Hidup'
                            : selectedPlayer.deathCause === 'demon'
                            ? 'Mati: Dibunuh Demon (Malam)'
                            : selectedPlayer.deathCause === 'execution'
                            ? 'Mati: Digantung (Eksekusi Siang)'
                            : selectedPlayer.deathCause === 'slayer'
                            ? 'Mati: Ditembak Slayer'
                            : 'Telah Mati'}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-[#F5EFE6] truncate">
                        {selectedPlayer.name}
                      </h3>
                      <p className="text-xs text-[#D4AF37] font-medium">
                        {selectedPlayer.trueRoleId === 'drunk' ? (
                          <>
                            Asli: <strong>Drunk</strong> · Mengira:{' '}
                            <strong>
                              {ROLE_MAP[selectedPlayer.perceivedRoleId]?.name}
                            </strong>
                          </>
                        ) : (
                          <>
                            {ROLE_MAP[selectedPlayer.trueRoleId]?.name} (
                            {ROLE_MAP[selectedPlayer.trueRoleId]?.indonesianName})
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Seat Shift Left / Right Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMoveSeat(selectedPlayer.seatIndex, 'ccw')}
                      title="Geser Kursi Berlawanan Jarum Jam"
                      aria-label={`Geser kursi ${selectedPlayer.name} ke kiri`}
                      className="min-w-[40px] min-h-[40px] rounded-lg bg-[#231F30] hover:bg-[#2F2A40] flex items-center justify-center text-[#EDE7DB] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveSeat(selectedPlayer.seatIndex, 'cw')}
                      title="Geser Kursi Searah Jarum Jam"
                      aria-label={`Geser kursi ${selectedPlayer.name} ke kanan`}
                      className="min-w-[40px] min-h-[40px] rounded-lg bg-[#231F30] hover:bg-[#2F2A40] flex items-center justify-center text-[#EDE7DB] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#CEC6B8] leading-relaxed">
                  {ROLE_MAP[selectedPlayer.trueRoleId]?.ability}
                </p>

                {/* Intip Kartu Rahasia Pemain Ini */}
                <button
                  type="button"
                  onClick={() => {
                    setPeekPlayerIndex(selectedPlayer.seatIndex);
                    setIsPeekModalOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/25 to-[#F59E0B]/25 hover:from-[#D4AF37]/35 hover:to-[#F59E0B]/35 border border-[#D4AF37]/70 text-xs sm:text-sm font-bold text-[#FDE68A] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4 text-[#D4AF37]" />
                  <span>Intip Kartu Rahasia {selectedPlayer.name}</span>
                </button>

                {/* Drunk Alert Banner in Inspector */}
                {selectedPlayer.trueRoleId === 'drunk' && (
                  <div className="p-3 rounded-xl bg-[#281C10] border border-[#D97706]/70 text-xs text-[#FDE68A] flex items-start gap-2.5">
                    <Beer className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#FDE68A]">Pemain Ini Adalah THE DRUNK!</strong>
                      <span className="leading-relaxed">
                        Pemain mengira dirinya adalah <strong>{ROLE_MAP[selectedPlayer.perceivedRoleId]?.name}</strong>. Kemampuannya tidak berfungsi nyata atau berikan info palsu.
                      </span>
                    </div>
                  </div>
                )}

                {/* Primary Status Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  {selectedPlayer.isAlive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onToggleAlive(selectedPlayer.id, 'demon')}
                        className="min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-[#2C1619] hover:bg-[#3D1E22] border border-[#EF4444]/60 text-[#FECACA]"
                      >
                        <Swords className="w-4 h-4 text-[#F87171] shrink-0" />
                        <span>Mati Dibunuh Demon</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onMarkExecutedToday(selectedPlayer.id);
                          onToggleAlive(selectedPlayer.id, 'execution');
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-[#2B2011] hover:bg-[#3A2C18] border border-[#F59E0B]/60 text-[#FDE68A]"
                      >
                        <Gavel className="w-4 h-4 text-[#F59E0B] shrink-0" />
                        <span>Mati Digantung</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onToggleAlive(selectedPlayer.id)}
                        className="min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-[#142922] hover:bg-[#1B382E] border border-[#10B981]/50 text-[#A7F3D0]"
                      >
                        <HeartPulse className="w-4 h-4 text-[#34D399] shrink-0" />
                        <span>Hidupkan Kembali</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextCause =
                            selectedPlayer.deathCause === 'demon' ? 'execution' : 'demon';
                          onToggleAlive(selectedPlayer.id, nextCause);
                          if (nextCause === 'execution') {
                            onMarkExecutedToday(selectedPlayer.id);
                          } else if (executedTodayPlayerId === selectedPlayer.id) {
                            onMarkExecutedToday(null);
                          }
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors bg-[#231F30] hover:bg-[#2F2A40] border border-[#38324C] text-[#EDE7DB]"
                      >
                        {selectedPlayer.deathCause === 'demon' ? (
                          <>
                            <Gavel className="w-4 h-4 text-[#F59E0B] shrink-0" />
                            <span>Ubah: Digantung</span>
                          </>
                        ) : (
                          <>
                            <Swords className="w-4 h-4 text-[#F87171] shrink-0" />
                            <span>Ubah: Dibunuh Demon</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Secondary Actions: Ghost Vote + Silent Show Card + Emergency Role Change */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#292535]">
                  {!selectedPlayer.isAlive && (
                    <button
                      type="button"
                      onClick={() => onToggleGhostVote(selectedPlayer.id)}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#221E2E] hover:bg-[#2E293F] text-xs font-medium text-[#D6CFC2] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Ghost className="w-3.5 h-3.5 text-[#93C5FD]" />
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
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#221E2E] hover:bg-[#2E293F] text-xs font-medium text-[#EDE7DB] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Tunjuk Token di Layar</span>
                  </button>

                  {/* Role change dropdown (e.g. Imp Starpass or Scarlet Woman becoming Imp) */}
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="change-true-role"
                      className="text-[11px] text-[#A8A092]"
                    >
                      Ubah Peran:
                    </label>
                    <select
                      id="change-true-role"
                      value={selectedPlayer.trueRoleId}
                      onChange={(e) =>
                        onChangePlayerTrueRole(selectedPlayer.id, e.target.value)
                      }
                      className="min-h-[38px] rounded-lg bg-[#14111B] border border-[#322D42] px-2 py-1 text-xs text-[#EDE7DB]"
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
                <div className="pt-2 border-t border-[#292535] space-y-2">
                  <div className="text-xs font-medium text-[#B8B0A2]">
                    Token Pengingat di Kursi {selectedPlayer.name}:
                  </div>
                  {selectedPlayer.reminders.length === 0 ? (
                    <p className="text-xs text-[#7D758A]">
                      Belum ada token pengingat menempel di kursi ini.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayer.reminders.map((rem) => {
                        const def = REMINDER_MAP[rem.reminderId];
                        if (!def) return null;
                        return (
                          <button
                            key={rem.instanceId}
                            type="button"
                            onClick={() =>
                              onRemoveReminder(selectedPlayer.id, rem.instanceId)
                            }
                            className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#242031] hover:bg-[#351D22] border border-[#39334B] text-xs text-[#EDE7DB] flex items-center gap-1.5 cursor-pointer"
                          >
                            <RoleGlyph roleId={def.roleId} className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>{def.indonesianLabel}</span>
                            <Trash2 className="w-3 h-3 text-[#F87171] ml-0.5" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Baki Token Pengingat (Reminder Tokens Tray) */}
            <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-[#F5EFE6]">
                    Baki Token Pengingat (Reminder Tokens)
                  </h3>
                  <p className="text-xs text-[#A8A092]">
                    {selectedPlayer
                      ? `Ketuk token mana saja untuk langsung menempelkannya ke ${selectedPlayer.name} (Kursi ${selectedPlayer.seatIndex + 1}).`
                      : 'Pilih kursi pemain terlebih dahulu, atau ketuk token lalu ketuk kursi di lingkaran.'}
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#121018] rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setReminderFilter('active')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      reminderFilter === 'active'
                        ? 'bg-[#2C263B] text-[#F5EFE6]'
                        : 'text-[#9C9486]'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderFilter('all')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      reminderFilter === 'all'
                        ? 'bg-[#2C263B] text-[#F5EFE6]'
                        : 'text-[#9C9486]'
                    }`}
                  >
                    Semua (16)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {displayedReminders.map((rem) => (
                  <ReminderTokenChip
                    key={rem.id}
                    reminderId={rem.id}
                    draggable
                    isSelected={activeBrushReminderId === rem.id}
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
