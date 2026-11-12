'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Beer,
  BookOpen,
  ChevronRight,
  Eye,
  EyeOff,
  Gavel,
  LayoutGrid,
  Moon,
  MoreVertical,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  ScrollText,
  Sparkles,
  Sun,
  Trophy,
  Undo2,
  Users,
} from 'lucide-react';
import { ALL_TB_ROLES, ROLE_MAP } from '@/lib/botc-data';
import {
  DayNomination,
  DayTimerState,
  GamePhase,
  PlayerSeat,
  calculateNominationThresholds,
  calculateVoteThreshold,
  getPlayerAlignment,
  isPlayerPoisoned,
} from '@/lib/botc-engine';
import type { TimerAction } from '@/context/GameContext';
import {
  ART_ASSETS,
  BOARD_CHROME,
  GRIMOIRE_PALETTE,
  SEAT_METRICS,
  VelvetColour,
} from '@/lib/grimoire-theme';
import { fitRing, placeSeatMenu, reminderStack, stackAngle } from '@/lib/ring-geometry';
import { SilentCardPayload } from './FullscreenCardModal';
import DesignateDrunkModal from './DesignateDrunkModal';
import PeekCardModal from './PeekCardModal';
import VelvetBackdrop, { VelvetColourSelector } from './grimoire/VelvetBackdrop';
import ParchmentSurface from './grimoire/ParchmentSurface';
import { CharacterTokenFront, ReminderDisc } from './grimoire/TokenPrimitives';
import SeatContextMenu from './grimoire/SeatContextMenu';
import ReminderPicker from './grimoire/ReminderPicker';
import ShowSheetModal from './grimoire/ShowSheetModal';
import ReferenceDrawer from './grimoire/ReferenceDrawer';
import GameTimerWidget from './grimoire/GameTimerWidget';
import {
  DayNominationControls,
  DayNominationsSummary,
  VotingArcSvg,
} from './grimoire/VotingOverlay';
import { useLockBodyScroll } from './grimoire/useLockBodyScroll';

export interface GrimoireBoardProps {
  players: PlayerSeat[];
  phase: GamePhase;
  dayNumber: number;
  executedTodayPlayerId: string | null;
  demonBluffIds?: string[];
  isDrunkActive?: boolean;
  winner?: 'good' | 'evil' | null;
  velvetColour?: VelvetColour;
  nominationsToday?: DayNomination[];
  dayTimer?: DayTimerState | null;
  phaseStartedAt?: number;
  onTimerAction?: (action: TimerAction) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onVelvetColourChange?: (colour: VelvetColour) => void;
  onUpdateBluffs?: (bluffs: string[]) => void;
  onSetDrunkPlayer?: (playerId: string) => void;
  onSwapSeats: (fromIndex: number, toIndex: number) => void;
  onMoveSeat: (seatIndex: number, direction: 'cw' | 'ccw') => void;
  onRotateRing?: (dir: 'cw' | 'ccw') => void;
  onAddSeat?: (atIndex?: number) => void;
  onRemoveSeat?: (playerId: string) => void;
  onRenamePlayer?: (playerId: string, name: string) => void;
  onSetPlayerAlignment?: (playerId: string, alignment: 'good' | 'evil') => void;
  onKillPlayer?: (playerId: string, cause: 'demon' | 'execution' | 'slayer') => void;
  onResurrectPlayer?: (playerId: string) => void;
  onChangeDeathCause?: (playerId: string, cause: 'demon' | 'execution' | 'slayer') => void;
  onToggleAlive: (playerId: string, cause?: 'demon' | 'execution' | 'slayer') => void;
  onToggleGhostVote: (playerId: string) => void;
  onAddReminder: (playerId: string, reminderId: string) => void;
  onAddCustomNoteReminder?: (playerId: string, noteText: string) => void;
  onEditCustomNoteReminder?: (playerId: string, instanceId: string, noteText: string) => void;
  onMoveReminder?: (fromPlayerId: string, instanceId: string, toPlayerId: string) => void;
  onRemoveReminder: (playerId: string, instanceId: string) => void;
  onMarkExecutedToday: (playerId: string | null) => void;
  onChangePlayerTrueRole: (playerId: string, newTrueRoleId: string) => void;
  onAdvancePhase?: () => void;
  onSetWinnerManual?: (winner: 'good' | 'evil' | null) => void;
  onStartNomination?: (nominatorId: string, nomineeId: string) => void | string;
  onToggleNominationVote?: (nominationId: string, seatId: string) => void;
  onResetNominationVotes?: (nominationId: string) => void;
  onMarkNominationExecution?: (nominationId: string, mark: boolean) => void;
  onCancelNomination?: (nominationId: string) => void;
  onShowSilentCard: (card: SilentCardPayload) => void;
}

export default function GrimoireBoard({
  players,
  phase,
  dayNumber,
  executedTodayPlayerId,
  demonBluffIds = [],
  isDrunkActive = false,
  winner = null,
  velvetColour = 'midnight',
  nominationsToday = [],
  dayTimer = null,
  phaseStartedAt,
  onTimerAction,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onVelvetColourChange,
  onUpdateBluffs,
  onSetDrunkPlayer,
  onSwapSeats,
  onMoveSeat,
  onRotateRing,
  onAddSeat,
  onRemoveSeat,
  onRenamePlayer,
  onSetPlayerAlignment,
  onKillPlayer,
  onResurrectPlayer,
  onToggleAlive,
  onToggleGhostVote,
  onAddReminder,
  onAddCustomNoteReminder,
  onEditCustomNoteReminder,
  onMoveReminder,
  onRemoveReminder,
  onChangePlayerTrueRole,
  onAdvancePhase,
  onSetWinnerManual,
  onStartNomination,
  onToggleNominationVote,
  onResetNominationVotes,
  onMarkNominationExecution,
  onCancelNomination,
  onShowSilentCard,
}: GrimoireBoardProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 880, height: 580 });

  const [menuSeatId, setMenuSeatId] = useState<string | null>(null);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [reminderPickerSeatId, setReminderPickerSeatId] = useState<string | null>(null);
  const [swapSourceSeatIdx, setSwapSourceSeatIdx] = useState<number | null>(null);
  const [arrangeGapsVisible, setArrangeGapsVisible] = useState(false);
  const [spyStealth, setSpyStealth] = useState(false);
  const [viewMode, setViewMode] = useState<'circle' | 'cards'>('circle');

  const [isShowSheetOpen, setIsShowSheetOpen] = useState(false);
  const [showSheetInitialRoleId, setShowSheetInitialRoleId] = useState<string | undefined>(undefined);
  const [isRefDrawerOpen, setIsRefDrawerOpen] = useState(false);
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const [peekIndex, setPeekIndex] = useState(0);

  const [pendingNomineeId, setPendingNomineeId] = useState<string | null>(null);
  const [focusedNomId, setFocusedNomId] = useState<string | null>(null);
  const [dismissedNomIds, setDismissedNomIds] = useState<string[]>([]);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [bluffEditorOpen, setBluffEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    playerId: string;
    instanceId: string;
    text: string;
  } | null>(null);

  useLockBodyScroll(Boolean(bluffEditorOpen || editingNote));

  const [dragReminder, setDragReminder] = useState<{
    fromPlayerId: string;
    instanceId: string;
  } | null>(null);
  const [dragTargetSeatId, setDragTargetSeatId] = useState<string | null>(null);

  const currentDrunkPlayer = players.find((p) => p.trueRoleId === 'drunk') ?? null;
  const [isDrunkModalOpen, setIsDrunkModalOpen] = useState(() =>
    Boolean(isDrunkActive && !currentDrunkPlayer)
  );

  // Measure the velvet stage dynamically so tokens never overflow laptop viewports
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 120 && rect.height > 120) {
        setStageSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode]);

  // Keyboard Ctrl+Z Undo, Ctrl+Y / Ctrl+Shift+Z Redo & Escape close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (isTyping) return;
        if (onUndo && canUndo) {
          e.preventDefault();
          onUndo();
        }
      } else if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key.toLowerCase() === 'z' && e.shiftKey) || (e.key.toLowerCase() === 'y' && !e.shiftKey))
      ) {
        if (isTyping) return;
        if (onRedo && canRedo) {
          e.preventDefault();
          onRedo();
        }
      } else if (e.key === 'Escape') {
        setMenuSeatId(null);
        setMoreMenuOpen(false);
        setSwapSourceSeatIdx(null);
        setArrangeGapsVisible(false);
        setReminderPickerSeatId(null);
        setPendingNomineeId(null);
        setEditingNote(null);
        setBluffEditorOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canRedo, canUndo, onRedo, onUndo]);

  const voteStats = calculateVoteThreshold(players);
  const thresholds = calculateNominationThresholds(players, nominationsToday);
  const validNominationsToday = useMemo(
    () => nominationsToday.filter((n) => !n.cancelled),
    [nominationsToday]
  );
  const activeNomination = useMemo(() => {
    if (phase !== 'day') return null;
    if (focusedNomId) {
      const explicit = validNominationsToday.find((n) => n.id === focusedNomId);
      if (explicit) return explicit;
    }
    return (
      validNominationsToday.find(
        (n) => !n.markedForExecution && !dismissedNomIds.includes(n.id)
      ) ?? null
    );
  }, [phase, focusedNomId, validNominationsToday, dismissedNomIds]);

  const handleDismissNomination = (nominationId: string) => {
    setDismissedNomIds((prev) => (prev.includes(nominationId) ? prev : [...prev, nominationId]));
    setFocusedNomId((prev) => (prev === nominationId ? null : prev));
  };

  const handleReopenNomination = (nominationId: string) => {
    setDismissedNomIds((prev) => prev.filter((id) => id !== nominationId));
    setPendingNomineeId(null);
    setFocusedNomId(nominationId);
  };

  const handleCreateNomination = (nominatorId: string, nomineeId: string) => {
    if (!onStartNomination) return;
    const createdId = onStartNomination(nominatorId, nomineeId);
    if (typeof createdId === 'string' && createdId.length > 0) {
      setDismissedNomIds((prev) => prev.filter((id) => id !== createdId));
      setFocusedNomId(createdId);
    } else {
      setFocusedNomId(null);
    }
  };

  const inPlayRoleIds = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      set.add(p.trueRoleId);
      set.add(p.perceivedRoleId);
    });
    return set;
  }, [players]);

  const ring = useMemo(() => {
    const padX = stageSize.width < 640 ? 20 : 140;
    const padY = stageSize.width < 640 ? 96 : 112;
    const bandWidth = Math.max(260, stageSize.width - padX);
    const bandHeight = Math.max(280, stageSize.height - padY);
    const maxToken = stageSize.width < 640 ? 64 : 96;
    return fitRing({ width: bandWidth, height: bandHeight }, players.length, maxToken);
  }, [players.length, stageSize.height, stageSize.width]);

  const ringOffsetLeft = (stageSize.width - ring.band.width) / 2;
  const ringOffsetTop = (stageSize.height - ring.band.height) / 2;
  const centreInStage = { x: stageSize.width / 2, y: stageSize.height / 2 };

  const menuSeatIndex = players.findIndex((p) => p.id === menuSeatId);
  const menuSeat = menuSeatIndex >= 0 ? players[menuSeatIndex] : null;
  const menuAnchor =
    menuSeat && ring.positions[menuSeatIndex]
      ? placeSeatMenu({
          at: {
            x: ringOffsetLeft + ring.positions[menuSeatIndex].x,
            y: ringOffsetTop + ring.positions[menuSeatIndex].y,
          },
          size: ring.size,
          centre: centreInStage,
          room: {
            left: 8,
            top: 8,
            right: stageSize.width - 8,
            bottom: stageSize.height - 8,
          },
          others: ring.positions.map((pos) => ({
            x: ringOffsetLeft + pos.x,
            y: ringOffsetTop + pos.y,
          })),
          menu: { width: 268, height: 390 },
        })
      : null;

  const phaseLabel =
    phase === 'first_night'
      ? 'Malam Pertama'
      : phase === 'day'
      ? `Siang Hari ke-${dayNumber}`
      : `Malam ke-${Math.max(2, dayNumber)}`;

  const nextPhaseShortLabel =
    phase === 'first_night'
      ? 'Lanjut Siang 1'
      : phase === 'other_night'
      ? `Lanjut Siang ${Math.max(2, dayNumber)}`
      : `Lanjut Malam ${dayNumber + 1}`;

  const handleSeatInteraction = (player: PlayerSeat) => {
    if (swapSourceSeatIdx !== null) {
      if (swapSourceSeatIdx !== player.seatIndex) {
        onSwapSeats(swapSourceSeatIdx, player.seatIndex);
      }
      setSwapSourceSeatIdx(null);
      return;
    }

    // During active vote, clicking a seat in the clock can toggle their hand!
    if (phase === 'day' && activeNomination && onToggleNominationVote) {
      const canVote =
        player.isAlive || player.hasGhostVote || activeNomination.voterIds.includes(player.id);
      if (canVote) {
        onToggleNominationVote(activeNomination.id, player.id);
        return;
      }
    }

    setMenuSeatId((prev) => (prev === player.id ? null : player.id));
  };

  const reminderPickerSeat = players.find((p) => p.id === reminderPickerSeatId) ?? null;

  return (
    <div className="space-y-3">
      {/* Unassigned Drunk Warning Strip (only if Drunk active and not yet picked) */}
      {isDrunkActive && !currentDrunkPlayer && !spyStealth && (
        <div className="px-4 py-2.5 rounded-2xl bg-[#2a2018] border border-[#c9963a] flex flex-wrap items-center justify-between gap-2 text-xs text-[#efe6d2] shadow-md">
          <div className="flex items-center gap-2">
            <Beer className="w-4 h-4 text-[#c9963a] shrink-0" />
            <span>
              <strong>The Drunk</strong> aktif di kantong, belum dipilih ke kursi pemain mana.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDrunkModalOpen(true)}
            className="px-3 py-1 rounded-xl bg-[#c9963a] text-[#2a2018] font-bold cursor-pointer hover:bg-[#d8a74c]"
          >
            Pilih Pemain Drunk
          </button>
        </div>
      )}

      {/* Main Velvet Grimoire Felt Surface */}
      <VelvetBackdrop
        colour={velvetColour}
        className="rounded-3xl shadow-2xl border border-[#c9963a]/30"
        style={{
          minHeight: viewMode === 'circle' ? '540px' : undefined,
          height: viewMode === 'circle' ? 'calc(100vh - 138px)' : undefined,
        }}
      >
        {viewMode === 'cards' ? (
          /* Mobile / Accessibility Warm Card List Mode */
          <div className="p-3 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-black/50 border border-[#c9963a]/40 font-display text-xs sm:text-sm font-bold text-[#efe6d2]">
                  {phaseLabel} · {voteStats.aliveCount}H / {voteStats.votesNeeded} Suara
                </span>
                {onTimerAction && (
                  <GameTimerWidget
                    timer={dayTimer}
                    phaseStartedAt={phaseStartedAt}
                    onAction={onTimerAction}
                    variant="compact"
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {onAdvancePhase && (
                  <button
                    type="button"
                    onClick={onAdvancePhase}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#c9963a] hover:bg-[#e0b254] text-[#2a2018] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    {phase === 'day' ? (
                      <Moon className="w-3.5 h-3.5" />
                    ) : (
                      <Sun className="w-3.5 h-3.5" />
                    )}
                    <span>{nextPhaseShortLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowSheetInitialRoleId(undefined);
                    setIsShowSheetOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-[#c9963a]/45 text-[#c9963a] hover:bg-black/70 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tunjuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('circle')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#efe6d2] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c9963a]" />
                  <span>Lingkaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRefDrawerOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-[#c9963a]/35 text-[#efe6d2] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#c9963a]" />
                  <span>Skrip</span>
                </button>
                {(onUndo || onRedo) && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMoreMenuOpen((prev) => !prev)}
                      aria-label="Menu Titik Tiga (Undo & Redo)"
                      title="Menu Lainnya (Undo / Redo)"
                      className="p-1.5 rounded-xl bg-black/50 border border-[#c9963a]/35 text-[#efe6d2] hover:bg-black/70 cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4 text-[#c9963a]" />
                    </button>
                    {moreMenuOpen && (
                      <div
                        className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl p-1.5 z-50 shadow-2xl border border-[#c9963a]/40 bg-[#141a1d]/95 backdrop-blur-md space-y-1"
                        role="menu"
                      >
                        {onUndo && (
                          <button
                            type="button"
                            role="menuitem"
                            disabled={!canUndo}
                            onClick={() => {
                              onUndo();
                              setMoreMenuOpen(false);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-[#efe6d2] hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Undo2 className="w-3.5 h-3.5 text-[#c9963a]" />
                              Urungkan (Undo)
                            </span>
                            <span className="text-[10px] font-mono text-[#a89f8c]">Ctrl+Z</span>
                          </button>
                        )}
                        {onRedo && (
                          <button
                            type="button"
                            role="menuitem"
                            disabled={!canRedo}
                            onClick={() => {
                              onRedo();
                              setMoreMenuOpen(false);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-[#efe6d2] hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Redo2 className="w-3.5 h-3.5 text-[#c9963a]" />
                              Ulangi (Redo)
                            </span>
                            <span className="text-[10px] font-mono text-[#a89f8c]">Ctrl+Y</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {phase === 'day' && (activeNomination || pendingNomineeId || validNominationsToday.length > 0) && onStartNomination && onToggleNominationVote && onResetNominationVotes && onMarkNominationExecution && onCancelNomination && (
              <div className="flex flex-col items-center gap-2">
                {activeNomination || pendingNomineeId ? (
                  <DayNominationControls
                    players={players}
                    nominationsToday={nominationsToday}
                    activeNomination={activeNomination}
                    pendingNomineeId={pendingNomineeId}
                    onSelectNomineeForSetup={setPendingNomineeId}
                    onStartNomination={handleCreateNomination}
                    onToggleVoter={onToggleNominationVote}
                    onResetVotes={onResetNominationVotes}
                    onMarkExecution={onMarkNominationExecution}
                    onDone={handleDismissNomination}
                    onCancelNomination={onCancelNomination}
                  />
                ) : (
                  <DayNominationsSummary
                    players={players}
                    nominationsToday={validNominationsToday}
                    onReopenNomination={handleReopenNomination}
                    onCancelNomination={onCancelNomination}
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {players.map((player) => {
                const role = ROLE_MAP[spyStealth ? player.perceivedRoleId : player.trueRoleId];
                const isPoisoned = isPlayerPoisoned(player);
                const alignment = getPlayerAlignment(player);

                return (
                  <ParchmentSurface
                    key={player.id}
                    className="rounded-2xl p-3.5 space-y-2.5 cursor-pointer"
                  >
                    <div
                      onClick={() => setMenuSeatId(player.id)}
                      className="flex items-center gap-3"
                    >
                      {role && (
                        <CharacterTokenFront
                          role={role}
                          size={58}
                          alignment={alignment}
                          dead={!player.isAlive}
                          isPoisoned={isPoisoned && !spyStealth}
                          hasGhostVote={player.hasGhostVote}
                          deathCause={player.deathCause}
                          showSetupLeaf={!spyStealth}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#5c4a37]">
                          Kursi #{player.seatIndex + 1} · {player.isAlive ? 'Hidup' : 'Mati'}
                        </div>
                        <div className="font-display text-base font-bold text-[#2a2018] truncate">
                          {player.name}
                        </div>
                        <div className="text-xs font-semibold text-[#5c4a37] truncate">
                          {role?.name}
                        </div>
                      </div>
                    </div>

                    {!spyStealth && player.reminders.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#655342]/20">
                        {player.reminders.map((rem) => (
                          <ReminderDisc
                            key={rem.instanceId}
                            reminderId={rem.reminderId}
                            customNote={rem.customNote}
                            size={34}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setReminderPickerSeatId(player.id)}
                        className="flex-1 py-1.5 rounded-xl bg-[#2a2018] text-[#efe6d2] text-xs font-bold cursor-pointer"
                      >
                        + Pengingat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (player.isAlive) {
                            if (onKillPlayer) onKillPlayer(player.id, 'demon');
                            else onToggleAlive(player.id, 'demon');
                          } else {
                            if (onResurrectPlayer) onResurrectPlayer(player.id);
                            else onToggleAlive(player.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#655342]/30 text-xs font-bold text-[#2a2018] cursor-pointer"
                      >
                        {player.isAlive ? 'Matikan' : 'Hidupkan'}
                      </button>
                    </div>
                  </ParchmentSurface>
                );
              })}
            </div>
          </div>
        ) : (
          /* Authentic Measured Elliptical Velvet Grimoire Ring */
          <div
            ref={stageRef}
            onClick={() => {
              setMenuSeatId(null);
              setMoreMenuOpen(false);
            }}
            className="relative w-full flex-1 min-h-[540px] select-none overflow-hidden"
          >
            {/* Top-Left Block: Rotate, Add Seats, Layout toggle & Titik-3 Menu (Undo/Redo) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-md"
              style={{
                backgroundColor: BOARD_CHROME.blockBg,
                border: `1px solid ${BOARD_CHROME.blockBorder}`,
                boxShadow: BOARD_CHROME.liftedShadow,
              }}
            >
              {onRotateRing && (
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onRotateRing('ccw')}
                    title="Putar semua kursi berlawanan jarum jam"
                    className="p-1.5 rounded-lg text-[#efe6d2] hover:bg-white/10 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRotateRing('cw')}
                    title="Putar semua kursi searah jarum jam"
                    className="p-1.5 rounded-lg text-[#efe6d2] hover:bg-white/10 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {onAddSeat && (
                <button
                  type="button"
                  onClick={() => setArrangeGapsVisible((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    arrangeGapsVisible
                      ? 'bg-[#c9963a] text-[#2a2018]'
                      : 'text-[#efe6d2] hover:bg-white/10'
                  }`}
                  title="Tambahkan kursi Traveller / pemain baru di celah cincin"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kursi</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 text-[#efe6d2] hover:bg-white/10 cursor-pointer"
                title="Buka tampilan daftar kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#c9963a]" />
                <span className="hidden md:inline">Daftar</span>
              </button>

              {(onUndo || onRedo) && (
                <div className="relative border-l border-[#c9963a]/25 pl-1">
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen((prev) => !prev)}
                    aria-label="Menu Titik Tiga (Undo & Redo)"
                    title="Menu Riwayat (Undo / Redo)"
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                      moreMenuOpen
                        ? 'bg-[#c9963a]/25 text-[#f4e4bc]'
                        : 'text-[#efe6d2] hover:bg-white/10'
                    }`}
                  >
                    <MoreVertical className="w-3.5 h-3.5 text-[#c9963a]" />
                  </button>
                  {moreMenuOpen && (
                    <div
                      className="absolute left-0 top-full mt-2 w-52 rounded-2xl p-1.5 z-50 shadow-2xl border border-[#c9963a]/40 bg-[#141a1d]/95 backdrop-blur-md space-y-1"
                      role="menu"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#a89f8c] border-b border-white/10">
                        Riwayat Aksi
                      </div>
                      {onUndo && (
                        <button
                          type="button"
                          role="menuitem"
                          disabled={!canUndo}
                          onClick={() => {
                            onUndo();
                            setMoreMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-[#efe6d2] hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Undo2 className="w-3.5 h-3.5 text-[#c9963a]" />
                            Urungkan (Undo)
                          </span>
                          <span className="text-[10px] font-mono text-[#a89f8c]">Ctrl+Z</span>
                        </button>
                      )}
                      {onRedo && (
                        <button
                          type="button"
                          role="menuitem"
                          disabled={!canRedo}
                          onClick={() => {
                            onRedo();
                            setMoreMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-[#efe6d2] hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Redo2 className="w-3.5 h-3.5 text-[#c9963a]" />
                            Ulangi (Redo)
                          </span>
                          <span className="text-[10px] font-mono text-[#a89f8c]">Ctrl+Y</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Top-Right Block: Show Cards, Script Reference, Velvet Swatches, Stealth Spy */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex flex-wrap items-center justify-end gap-1.5 p-1.5 rounded-2xl backdrop-blur-md"
              style={{
                backgroundColor: BOARD_CHROME.blockBg,
                border: `1px solid ${BOARD_CHROME.blockBorder}`,
                boxShadow: BOARD_CHROME.liftedShadow,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowSheetInitialRoleId(undefined);
                  setIsShowSheetOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Tunjuk</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRefDrawerOpen(true)}
                className="px-2.5 py-1.5 rounded-xl text-[#efe6d2] hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ScrollText className="w-3.5 h-3.5 text-[#c9963a]" />
                <span className="hidden sm:inline">Skrip</span>
              </button>

              {onVelvetColourChange && (
                <div className="hidden sm:flex items-center pl-1 border-l border-[#c9963a]/25">
                  <VelvetColourSelector
                    value={velvetColour}
                    onChange={onVelvetColourChange}
                    compact
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setSpyStealth((prev) => !prev)}
                title={spyStealth ? 'Matikan mode stealth' : 'Sembunyikan reminder & rahasia Drunk'}
                className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                  spyStealth
                    ? 'bg-emerald-600 text-white'
                    : 'text-[#efe6d2] hover:bg-white/10'
                }`}
              >
                {spyStealth ? <EyeOff className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Mode Swap Hint Bar */}
            {swapSourceSeatIdx !== null && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-[#c9963a] text-[#2a2018] text-xs font-bold flex items-center gap-2 shadow-xl">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Klik kursi tujuan untuk tukar posisi dengan Kursi #{swapSourceSeatIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => setSwapSourceSeatIdx(null)}
                  className="underline ml-1 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}

            {/* Measured Ring Coordinate Box */}
            <div
              className="absolute"
              style={{
                left: ringOffsetLeft,
                top: ringOffsetTop,
                width: ring.band.width,
                height: ring.band.height,
              }}
            >
              {/* Faint brass ellipse guide connecting all seats */}
              <svg
                width={ring.band.width}
                height={ring.band.height}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
              >
                <ellipse
                  cx={ring.band.width / 2}
                  cy={ring.band.height / 2}
                  rx={ring.rx}
                  ry={ring.ry}
                  fill="none"
                  stroke="rgba(201, 150, 58, 0.16)"
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                />
              </svg>

              {/* Active Day Clockwork Voting Sweep SVG */}
              {phase === 'day' && activeNomination && (
                <VotingArcSvg
                  ring={ring}
                  players={players}
                  nomination={activeNomination}
                  nominationsToday={validNominationsToday}
                />
              )}

              {/* Gap Add-Seat Buttons when toggled */}
              {arrangeGapsVisible &&
                onAddSeat &&
                ring.positions.map((pos, idx) => {
                  const nextPos = ring.positions[(idx + 1) % ring.positions.length];
                  if (!nextPos) return null;
                  const gx = (pos.x + nextPos.x) / 2;
                  const gy = (pos.y + nextPos.y) / 2;
                  return (
                    <button
                      key={`gap_${idx}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSeat(idx + 1);
                      }}
                      title={`Sisipkan pemain baru antara #${idx + 1} dan #${
                        ((idx + 1) % players.length) + 1
                      }`}
                      style={{
                        left: gx - 14,
                        top: gy - 14,
                        width: 28,
                        height: 28,
                      }}
                      className="absolute z-20 rounded-full bg-[#c9963a] hover:bg-[#f2c56b] text-[#2a2018] flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  );
                })}

              {/* Center-of-Ring Focal Content */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-none absolute inset-0 flex items-center justify-center z-20"
              >
                <div className="pointer-events-auto flex flex-col items-center text-center gap-2 max-w-[290px]">
                  {winner ? (
                    /* Center-of-Ring Victory Announcement (zero intrusive edge banners!) */
                    <div
                      className="rounded-3xl px-5 py-4 backdrop-blur-md shadow-2xl space-y-2 border"
                      style={{
                        backgroundColor: 'rgba(18, 22, 20, 0.88)',
                        borderColor:
                          winner === 'good'
                            ? 'rgba(95, 163, 230, 0.65)'
                            : 'rgba(224, 87, 75, 0.65)',
                      }}
                    >
                      <Trophy
                        className="w-8 h-8 mx-auto"
                        style={{ color: winner === 'good' ? '#5fa3e6' : '#e0574b' }}
                      />
                      <h3
                        className="font-display text-2xl font-bold tracking-wide"
                        style={{ color: winner === 'good' ? '#7ec3ff' : '#ffa299' }}
                      >
                        {winner === 'good' ? 'TIM GOOD MENANG' : 'TIM EVIL MENANG'}
                      </h3>
                      <p className="text-[11px] text-[#a89f8c]">
                        {winner === 'good'
                          ? 'Demon berhasil dieksekusi di Ravenswood Bluff.'
                          : 'Kegelapan menguasai Ravenswood Bluff.'}
                      </p>
                      {onSetWinnerManual && (
                        <button
                          type="button"
                          onClick={() => onSetWinnerManual(null)}
                          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-mono uppercase tracking-wider text-[#efe6d2] cursor-pointer"
                        >
                          Bersihkan Status
                        </button>
                      )}
                    </div>
                  ) : phase === 'day' && (activeNomination || pendingNomineeId) && onStartNomination && onToggleNominationVote && onResetNominationVotes && onMarkNominationExecution && onCancelNomination ? (
                    <DayNominationControls
                      players={players}
                      nominationsToday={nominationsToday}
                      activeNomination={activeNomination}
                      pendingNomineeId={pendingNomineeId}
                      onSelectNomineeForSetup={setPendingNomineeId}
                      onStartNomination={handleCreateNomination}
                      onToggleVoter={onToggleNominationVote}
                      onResetVotes={onResetNominationVotes}
                      onMarkExecution={onMarkNominationExecution}
                      onDone={handleDismissNomination}
                      onCancelNomination={onCancelNomination}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 opacity-95">
                      <img
                        src={ART_ASSETS.editionTb}
                        alt="Trouble Brewing"
                        draggable={false}
                        className="w-11 h-11 sm:w-14 sm:h-14 object-contain drop-shadow"
                      />
                      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#efe6d2]">
                        {players.length} Pemain · {voteStats.aliveCount} Hidup
                      </div>
                      {phase === 'day' && onCancelNomination && (
                        <DayNominationsSummary
                          players={players}
                          nominationsToday={validNominationsToday}
                          onReopenNomination={handleReopenNomination}
                          onCancelNomination={onCancelNomination}
                        />
                      )}
                      {phase === 'day' && onStartNomination && (
                        <button
                          type="button"
                          onClick={() => setPendingNomineeId(players[0]?.id ?? null)}
                          className="mt-0.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-[#c9963a]/50 text-[11px] font-bold text-[#c9963a] flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span>Mulai Nominasi (Butuh {thresholds.execute})</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Player Seats Around Ellipse */}
              {players.map((player, idx) => {
                const pos = ring.positions[idx];
                if (!pos) return null;

                const trueRole = ROLE_MAP[player.trueRoleId];
                const perceivedRole = ROLE_MAP[player.perceivedRoleId];
                const displayRole = spyStealth ? perceivedRole || trueRole : trueRole;
                const alignment = getPlayerAlignment(player);
                const isPoisoned = isPlayerPoisoned(player);
                const isDrunkSecret = player.trueRoleId === 'drunk' && !spyStealth;
                const isMenuOpen = menuSeatId === player.id;
                const isHovered = hoveredSeatId === player.id || isMenuOpen;
                const isSwapSource = swapSourceSeatIdx === player.seatIndex;
                const isDragTarget = dragTargetSeatId === player.id;

                // Reminder chips leaned cleanly toward ring center via reminderStack
                const stackAngleDeg = stackAngle(
                  pos,
                  { x: ring.band.width / 2, y: ring.band.height / 2 },
                  ring.rx,
                  ring.ry,
                  { size: ring.size, chip: SEAT_METRICS.reminderSize(ring.size) }
                );
                const visibleReminders = spyStealth ? [] : player.reminders;
                const stack = reminderStack(
                  ring.size,
                  stackAngleDeg,
                  visibleReminders.length,
                  isHovered
                );

                return (
                  <React.Fragment key={player.id}>
                    {/* Seat Token Container */}
                    <div
                      style={{
                        left: pos.x - ring.size / 2,
                        top: pos.y - ring.size / 2,
                        width: ring.size,
                      }}
                      onMouseEnter={() => setHoveredSeatId(player.id)}
                      onMouseLeave={() => setHoveredSeatId((prev) => (prev === player.id ? null : prev))}
                      onDragOver={(e) => {
                        if (dragReminder) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragTargetSeatId(player.id);
                        }
                      }}
                      onDragLeave={() =>
                        setDragTargetSeatId((prev) => (prev === player.id ? null : prev))
                      }
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragReminder && onMoveReminder && dragReminder.fromPlayerId !== player.id) {
                          onMoveReminder(dragReminder.fromPlayerId, dragReminder.instanceId, player.id);
                        }
                        setDragReminder(null);
                        setDragTargetSeatId(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeatInteraction(player);
                      }}
                      className={`absolute flex flex-col items-center cursor-pointer transition-transform duration-150 ${
                        isMenuOpen ? 'z-30 scale-[1.06]' : 'z-20 hover:scale-[1.04]'
                      }`}
                    >
                      <div
                        className={`relative rounded-full ${
                          isDragTarget
                            ? 'ring-3 ring-[#c9963a]'
                            : isSwapSource
                            ? 'ring-3 ring-amber-400 animate-pulse'
                            : ''
                        }`}
                      >
                        {displayRole && (
                          <CharacterTokenFront
                            role={displayRole}
                            size={ring.size}
                            alignment={spyStealth ? undefined : alignment}
                            dead={!player.isAlive}
                            selected={isMenuOpen}
                            isPoisoned={isPoisoned && !spyStealth}
                            hasGhostVote={player.hasGhostVote}
                            deathCause={player.deathCause}
                            showSetupLeaf={!spyStealth}
                          />
                        )}

                        {/* Drunk indicator badge on seat corner (hidden in spy mode) */}
                        {isDrunkSecret && (
                          <span
                            title={`Drunk mengira dirinya ${perceivedRole?.name}`}
                            className="absolute -top-1 -right-1 z-20 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2a2018] border border-[#c9963a] text-[#f2c56b] shadow"
                          >
                            <Beer className="w-3 h-3" />
                          </span>
                        )}

                        {/* Executed today ribbon */}
                        {executedTodayPlayerId === player.id && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 rounded-full bg-[#760a0d] border border-[#c9963a]/70 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase text-[#efe6d2] whitespace-nowrap">
                            Eksekusi
                          </span>
                        )}
                      </div>

                      {/* Seat Name Label under Token */}
                      <div
                        style={{
                          marginTop: SEAT_METRICS.nameGap,
                          fontSize: SEAT_METRICS.seatNameSize(ring.size),
                        }}
                        className={`max-w-[116px] px-2 py-0.5 rounded-full font-sans font-bold tracking-tight truncate text-center shadow ${
                          player.isAlive
                            ? 'bg-black/65 text-[#efe6d2] border border-white/10'
                            : 'bg-black/45 text-[#a89f8c] line-through border border-white/5'
                        }`}
                      >
                        <span className="font-mono text-[#c9963a] mr-1">{player.seatIndex + 1}</span>
                        {player.name}
                      </div>
                    </div>

                    {/* Inward Stacked Reminder Chips (Draggable between seats!) */}
                    {visibleReminders.map((rem, rIdx) => {
                      const pt = stack.points[rIdx];
                      if (!pt) return null;
                      const cx = pos.x + pt.x;
                      const cy = pos.y + pt.y;
                      const isCustom = rem.reminderId.startsWith('note:');

                      return (
                        <div
                          key={rem.instanceId}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDragReminder({
                              fromPlayerId: player.id,
                              instanceId: rem.instanceId,
                            });
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDragReminder(null);
                            setDragTargetSeatId(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCustom && onEditCustomNoteReminder) {
                              setEditingNote({
                                playerId: player.id,
                                instanceId: rem.instanceId,
                                text:
                                  rem.customNote ||
                                  (rem.reminderId.startsWith('note:')
                                    ? rem.reminderId.slice(5)
                                    : ''),
                              });
                            } else {
                              onRemoveReminder(player.id, rem.instanceId);
                            }
                          }}
                          title={
                            isCustom
                              ? 'Klik untuk edit/hapus catatan, atau seret ke pemain lain'
                              : 'Klik untuk melepas, atau seret ke pemain lain'
                          }
                          style={{
                            left: cx - stack.chipSize / 2,
                            top: cy - stack.chipSize / 2,
                            zIndex: 22 + rIdx,
                            transition: 'left 180ms ease, top 180ms ease, transform 150ms ease',
                          }}
                          className="absolute cursor-grab active:cursor-grabbing hover:scale-110"
                        >
                          <ReminderDisc
                            reminderId={rem.reminderId}
                            customNote={rem.customNote}
                            size={stack.chipSize}
                            showTooltip
                          />
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Bottom-Left Block: 3 Demon Bluff Wells */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-30 flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl backdrop-blur-md"
              style={{
                backgroundColor: BOARD_CHROME.blockBg,
                border: `1px solid ${BOARD_CHROME.blockBorder}`,
                boxShadow: BOARD_CHROME.liftedShadow,
              }}
            >
              <div className="hidden sm:flex flex-col pr-1.5 border-r border-[#c9963a]/25">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#c9963a]">
                  Demon Bluffs
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSheetInitialRoleId(undefined);
                    setIsShowSheetOpen(true);
                  }}
                  className="text-[11px] font-bold text-[#efe6d2] hover:underline text-left cursor-pointer"
                >
                  Tunjuk Bluff
                </button>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {[0, 1, 2].map((slot) => {
                  const bid = demonBluffIds[slot];
                  const role = bid ? ROLE_MAP[bid] : null;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => !spyStealth && setBluffEditorOpen(true)}
                      title={role && !spyStealth ? `Bluff: ${role.name}` : 'Atur Bluff'}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                      style={{
                        backgroundColor: BOARD_CHROME.wellBg,
                        border: `1px solid ${BOARD_CHROME.wellBorder}`,
                      }}
                    >
                      {role && !spyStealth ? (
                        <CharacterTokenFront role={role} size={32} showSetupLeaf={false} />
                      ) : (
                        <span className="text-[10px] font-mono text-[#a89f8c]">?</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom-Right Block: Dawn / Dusk Phase Clock Plaque, Timer & Prominent Next Day CTA */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-30 flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl backdrop-blur-md"
              style={{
                backgroundColor: BOARD_CHROME.blockBg,
                border: `1px solid ${BOARD_CHROME.blockBorder}`,
                boxShadow: BOARD_CHROME.liftedShadow,
              }}
            >
              <img
                src={phase === 'day' ? ART_ASSETS.generic.dawn : ART_ASSETS.generic.dusk}
                alt=""
                className="w-8 h-8 object-contain shrink-0 hidden md:block"
              />
              <div className="hidden md:block min-w-[96px]">
                <div className="font-display text-sm font-bold text-[#efe6d2] leading-tight">
                  {phaseLabel}
                </div>
                <div className="text-[10px] font-mono text-[#a89f8c] tabular-nums">
                  {voteStats.aliveCount}H · {voteStats.votesNeeded} Mayoritas
                </div>
              </div>

              {onTimerAction && (
                <GameTimerWidget
                  timer={dayTimer}
                  phaseStartedAt={phaseStartedAt}
                  onAction={onTimerAction}
                  variant="compact"
                />
              )}

              {onAdvancePhase && (
                <button
                  type="button"
                  onClick={onAdvancePhase}
                  className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 rounded-xl bg-[#c9963a] hover:bg-[#e0b254] active:scale-[0.98] text-[#2a2018] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all whitespace-nowrap"
                >
                  {phase === 'day' ? (
                    <Moon className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{nextPhaseShortLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              )}

              {onSetWinnerManual && !winner && (
                <div className="hidden lg:flex items-center border-l border-[#c9963a]/25 pl-2 gap-1">
                  <button
                    type="button"
                    onClick={() => onSetWinnerManual('good')}
                    title="Tandai Tim Good Menang"
                    className="px-2 py-1 rounded-lg bg-[#0064ac]/35 hover:bg-[#0064ac]/60 text-[#efe6d2] text-[10px] font-bold cursor-pointer"
                  >
                    Good
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetWinnerManual('evil')}
                    title="Tandai Tim Evil Menang"
                    className="px-2 py-1 rounded-lg bg-[#760a0d]/45 hover:bg-[#760a0d]/70 text-[#efe6d2] text-[10px] font-bold cursor-pointer"
                  >
                    Evil
                  </button>
                </div>
              )}
            </div>

            {/* Collision-avoidant Floating Seat Context Popover */}
            {menuSeat && menuAnchor && (
              <SeatContextMenu
                seat={menuSeat}
                totalSeats={players.length}
                isDayPhase={phase === 'day'}
                style={{
                  position: 'absolute',
                  left: menuAnchor.left,
                  top: menuAnchor.top,
                }}
                onOpenReminderPicker={() => setReminderPickerSeatId(menuSeat.id)}
                onStartNomination={() => setPendingNomineeId(menuSeat.id)}
                onKill={(cause) => {
                  if (onKillPlayer) onKillPlayer(menuSeat.id, cause);
                  else onToggleAlive(menuSeat.id, cause);
                }}
                onResurrect={() => {
                  if (onResurrectPlayer) onResurrectPlayer(menuSeat.id);
                  else onToggleAlive(menuSeat.id);
                }}
                onToggleGhostVote={() => onToggleGhostVote(menuSeat.id)}
                onToggleAlignment={() => {
                  const next = getPlayerAlignment(menuSeat) === 'good' ? 'evil' : 'good';
                  if (onSetPlayerAlignment) onSetPlayerAlignment(menuSeat.id, next);
                }}
                onChangeRole={(newRoleId) => onChangePlayerTrueRole(menuSeat.id, newRoleId)}
                onRename={(newName) => onRenamePlayer?.(menuSeat.id, newName)}
                onMoveSeat={(dir) => onMoveSeat(menuSeat.seatIndex, dir)}
                onStartSwap={() => setSwapSourceSeatIdx(menuSeat.seatIndex)}
                onPeekSeat={() => {
                  setPeekIndex(menuSeatIndex >= 0 ? menuSeatIndex : 0);
                  setIsPeekOpen(true);
                }}
                onShowSeatToken={() =>
                  onShowSilentCard({
                    heading: 'PERAN ANDA ADALAH',
                    roleIds: [menuSeat.perceivedRoleId],
                    requireTapToReveal: true,
                    footerNote:
                      'Ketuk di atas jika siap melihat peran, lalu tekan Tutup sebelum mengembalikan perangkat.',
                  })
                }
                onRemoveSeat={() => onRemoveSeat?.(menuSeat.id)}
                onClose={() => setMenuSeatId(null)}
              />
            )}
          </div>
        )}
      </VelvetBackdrop>

      {/* Modals & Drawers */}
      {reminderPickerSeat && (
        <ReminderPicker
          targetPlayerName={reminderPickerSeat.name}
          inPlayRoleIds={inPlayRoleIds}
          hasDrunkAssigned={Boolean(currentDrunkPlayer)}
          onPickReminder={(remId) => onAddReminder(reminderPickerSeat.id, remId)}
          onAddCustomNote={(txt) => {
            if (onAddCustomNoteReminder) {
              onAddCustomNoteReminder(reminderPickerSeat.id, txt);
            } else {
              onAddReminder(reminderPickerSeat.id, `note:${txt}`);
            }
          }}
          onClose={() => setReminderPickerSeatId(null)}
        />
      )}

      {/* Inline Custom Note Editor Modal */}
      {editingNote && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 overflow-hidden"
          onClick={() => setEditingNote(null)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <ParchmentSurface className="rounded-2xl p-4 space-y-3">
              <h4 className="font-display text-lg font-bold text-[#2a2018]">
                Ubah Catatan Pengingat
              </h4>
              <input
                type="text"
                autoFocus
                maxLength={32}
                value={editingNote.text}
                onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#655342]/35 bg-white/80 text-sm text-[#2a2018]"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onRemoveReminder(editingNote.playerId, editingNote.instanceId);
                    setEditingNote(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#760a0d] text-[#efe6d2] text-xs font-bold cursor-pointer"
                >
                  Hapus Chip
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNote(null)}
                    className="px-3 py-1.5 rounded-xl border border-[#655342]/30 text-xs font-semibold text-[#5c4a37] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingNote.text.trim() && onEditCustomNoteReminder) {
                        onEditCustomNoteReminder(
                          editingNote.playerId,
                          editingNote.instanceId,
                          editingNote.text.trim()
                        );
                      }
                      setEditingNote(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#2a2018] text-[#efe6d2] text-xs font-bold cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </ParchmentSurface>
          </div>
        </div>
      )}

      {/* Quick Bluff Editor Modal */}
      {bluffEditorOpen && onUpdateBluffs && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 overflow-hidden"
          onClick={() => setBluffEditorOpen(false)}
        >
          <div className="w-full max-w-2xl max-h-[94dvh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <ParchmentSurface className="rounded-2xl p-3 sm:p-4 space-y-2.5 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-display text-base sm:text-lg font-bold text-[#2a2018]">
                    Pilih 3 Peran Bluff Demon
                  </h4>
                  <p className="text-[11px] text-[#5c4a37]">
                    Karakter Townsfolk/Outsider yang tidak dimainkan ({demonBluffIds.length}/3 dipilih).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBluffEditorOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#2a2018] text-[#efe6d2] text-xs font-bold cursor-pointer shrink-0"
                >
                  Selesai
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {ALL_TB_ROLES.filter((r) => r.team === 'townsfolk' || r.team === 'outsider').map(
                  (role) => {
                    const isSelected = demonBluffIds.includes(role.id);
                    const isUsed = inPlayRoleIds.has(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            onUpdateBluffs(demonBluffIds.filter((id) => id !== role.id));
                          } else {
                            const next = [...demonBluffIds, role.id].slice(-3);
                            onUpdateBluffs(next);
                          }
                        }}
                        className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl border text-center cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#c9963a] bg-[#c9963a]/25 ring-1 ring-[#c9963a]'
                            : isUsed
                            ? 'opacity-45 border-[#655342]/15 bg-[#66533f]/[0.03]'
                            : 'border-[#655342]/25 bg-[#66533f]/[0.06] hover:bg-[#66533f]/[0.15]'
                        }`}
                      >
                        <CharacterTokenFront role={role} size={36} showSetupLeaf={false} />
                        <span className="text-[10px] font-bold text-[#2a2018] truncate w-full leading-tight">
                          {role.name}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </ParchmentSurface>
          </div>
        </div>
      )}

      <ShowSheetModal
        isOpen={isShowSheetOpen}
        players={players}
        demonBluffIds={demonBluffIds}
        velvetColour={velvetColour}
        initialRoleId={showSheetInitialRoleId}
        onClose={() => setIsShowSheetOpen(false)}
      />

      <ReferenceDrawer
        isOpen={isRefDrawerOpen}
        inPlayRoleIds={inPlayRoleIds}
        onClose={() => setIsRefDrawerOpen(false)}
      />

      <PeekCardModal
        isOpen={isPeekOpen}
        players={players}
        initialPlayerIndex={peekIndex}
        demonBluffIds={demonBluffIds}
        onClose={() => setIsPeekOpen(false)}
      />

      {onSetDrunkPlayer && (
        <DesignateDrunkModal
          isOpen={isDrunkModalOpen}
          players={players}
          currentDrunkPlayerId={currentDrunkPlayer?.id ?? null}
          onSelectDrunkPlayer={(pid) => {
            onSetDrunkPlayer(pid);
            setIsDrunkModalOpen(false);
          }}
          onClose={() => setIsDrunkModalOpen(false)}
        />
      )}
    </div>
  );
}
