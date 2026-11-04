'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Gavel,
  Ghost,
  HeartPulse,
  Skull,
  Trash2,
} from 'lucide-react';
import { REMINDER_MAP, REMINDER_TOKENS, ROLE_MAP, ROLES } from '@/lib/botc-data';
import {
  GamePhase,
  PlayerSeat,
  calculateVoteThreshold,
} from '@/lib/botc-engine';
import { CharacterToken, ReminderTokenChip, RoleGlyph } from './TokenArtwork';
import { SilentCardPayload } from './FullscreenCardModal';

interface GrimoireBoardProps {
  players: PlayerSeat[];
  phase: GamePhase;
  dayNumber: number;
  executedTodayPlayerId: string | null;
  onSwapSeats: (fromIndex: number, toIndex: number) => void;
  onMoveSeat: (seatIndex: number, direction: 'cw' | 'ccw') => void;
  onToggleAlive: (playerId: string) => void;
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

  const selectedPlayer =
    players.find((p) => p.id === selectedPlayerId) ?? players[0] ?? null;

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

  const displayedReminders =
    reminderFilter === 'all'
      ? REMINDER_TOKENS
      : REMINDER_TOKENS.filter(
          (rem) =>
            inPlayRoleSet.has(rem.roleId) ||
            rem.id === 'poisoned' ||
            rem.id === 'die_imp' ||
            rem.id === 'executed' ||
            rem.id === 'is_the_drunk'
        );

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

        <div className="flex items-center gap-2">
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

            {/* Center Clocktower Hub */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[26%] h-[26%] rounded-full bg-[#13101A]/95 border-2 border-[#38314A] flex flex-col items-center justify-center text-center p-2 pointer-events-none shadow-xl">
              <span className="font-display text-[10px] sm:text-xs font-black tracking-widest text-[#D4AF37] leading-tight">
                GRIMOIRE
              </span>
              <span className="text-[9px] sm:text-[11px] font-bold text-[#E2DCD2] mt-0.5 truncate max-w-full">
                {phaseLabel}
              </span>
              <span className="font-mono text-[9px] sm:text-[11px] font-bold text-[#6EE7B7] mt-0.5 tabular-nums">
                {voteStats.aliveCount}H · {voteStats.votesNeeded}V
              </span>
            </div>

            {/* Circular Player Seats & Inner-Ring Reminder Tokens */}
            {players.map((player, index) => {
              const angle = (index / totalSeats) * 2 * Math.PI - Math.PI / 2;
              const leftPct = 50 + radiusPct * Math.cos(angle);
              const topPct = 50 + radiusPct * Math.sin(angle);

              // Place attached reminder tokens inward toward center of Grimoire (authentic physical Grimoire layout)
              const innerReminderRadius = Math.max(18, radiusPct - 14.5);
              const remLeftPct = 50 + innerReminderRadius * Math.cos(angle);
              const remTopPct = 50 + innerReminderRadius * Math.sin(angle);

              const isSelected = !spyCleanMode && selectedPlayer?.id === player.id;
              const isSwapSource = swapModeSourceIdx === index;
              const isDragTarget = dragOverSeatIdx === index;
              const isDrunk = player.trueRoleId === 'drunk';
              const displayRoleId = spyCleanMode ? player.trueRoleId : player.perceivedRoleId;

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
                        isDrunkSecret={isDrunk}
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

                    {/* Player Name Label - Bolder, clearer, higher contrast */}
                    <span
                      className={`mt-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black tracking-wide max-w-[80px] sm:max-w-[110px] truncate text-center shadow-lg border leading-tight ${
                        player.isAlive
                          ? 'bg-[#15121F]/95 text-white border-[#4E4466]'
                          : 'bg-[#100D16]/95 text-[#A1A1AA] border-[#3F3F46] line-through'
                      }`}
                    >
                      {player.name}
                    </span>
                  </div>

                  {/* Placed Miniature Reminder Tokens on Inner Ring */}
                  {player.reminders.length > 0 && (
                    <div
                      style={{
                        left: `${remLeftPct}%`,
                        top: `${remTopPct}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-wrap items-center justify-center gap-0.5 max-w-[64px] z-20"
                    >
                      {player.reminders.map((rem) => (
                        <ReminderTokenChip
                          key={rem.instanceId}
                          reminderId={rem.reminderId}
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!spyCleanMode) {
                              onRemoveReminder(player.id, rem.instanceId);
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
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
                      isDrunkSecret={selectedPlayer.trueRoleId === 'drunk'}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-[#A8A092]">
                        <span className="font-mono tabular-nums">
                          Kursi {selectedPlayer.seatIndex + 1}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {selectedPlayer.isAlive ? 'Masih Hidup' : 'Sudah Mati'}
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

                {/* Primary Status Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleAlive(selectedPlayer.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      selectedPlayer.isAlive
                        ? 'bg-[#2C1619] hover:bg-[#3D1E22] border border-[#EF4444]/50 text-[#FECACA]'
                        : 'bg-[#142922] hover:bg-[#1B382E] border border-[#10B981]/50 text-[#A7F3D0]'
                    }`}
                  >
                    {selectedPlayer.isAlive ? (
                      <>
                        <Skull className="w-4 h-4 text-[#F87171]" />
                        <span>Tandai Mati (Dead)</span>
                      </>
                    ) : (
                      <>
                        <HeartPulse className="w-4 h-4 text-[#34D399]" />
                        <span>Hidupkan Kembali</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (executedTodayPlayerId === selectedPlayer.id) {
                        onMarkExecutedToday(null);
                      } else {
                        onMarkExecutedToday(selectedPlayer.id);
                      }
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border cursor-pointer transition-colors ${
                      executedTodayPlayerId === selectedPlayer.id
                        ? 'bg-[#D4AF37] text-[#121016] border-[#D4AF37]'
                        : 'bg-[#231F30] hover:bg-[#2E2940] text-[#EDE7DB] border-[#38324C]'
                    }`}
                  >
                    <Gavel className="w-4 h-4" />
                    <span>
                      {executedTodayPlayerId === selectedPlayer.id
                        ? 'Dieksekusi Siang Ini'
                        : 'Eksekusi Siang Ini'}
                    </span>
                  </button>
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
                        subheading: `${selectedPlayer.name} (Kursi ${
                          selectedPlayer.seatIndex + 1
                        })`,
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
                    Seret ke lingkaran atau ketuk token lalu ketuk kursi pemain.
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
                      setIsSwapModeActive(false);
                      setSwapModeSourceIdx(null);
                      setActiveBrushReminderId((prev) =>
                        prev === rem.id ? null : rem.id
                      );
                    }}
                  />
                ))}
              </div>

              {selectedPlayer && (
                <div className="pt-3 border-t border-[#292535] flex items-center justify-between gap-2 text-xs text-[#A8A092]">
                  <span>
                    Tempel cepat ke <strong>{selectedPlayer.name}</strong>:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAddReminder(selectedPlayer.id, 'poisoned')}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#2B171B] hover:bg-[#3A1F24] text-[#FECACA] font-medium cursor-pointer"
                    >
                      + Poisoned
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddReminder(selectedPlayer.id, 'protected')}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#162636] hover:bg-[#1E344A] text-[#BAE6FD] font-medium cursor-pointer"
                    >
                      + Protected
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddReminder(selectedPlayer.id, 'die_imp')}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#2E1417] hover:bg-[#401B20] text-[#FCA5A5] font-medium cursor-pointer"
                    >
                      + Die
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
