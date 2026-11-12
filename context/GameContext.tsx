'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { ROLE_MAP } from '@/lib/botc-data';
import {
  DayNomination,
  DayTimerState,
  GamePhase,
  PlayerSeat,
  addPlayerSeat,
  applyDayNominationMark,
  canSeatNominate,
  computeTimerRemainingMs,
  countAliveNonTravellers,
  createDemoSession,
  evaluateBoardWinner,
  getSeatVoteWeight,
  isPlayerPoisoned,
  movePlayerSeat,
  removePlayerSeat,
  resolveVoteTieStatus,
  rotatePlayerSeats,
  sanitizePlayerSeats,
  swapPlayerSeats,
} from '@/lib/botc-engine';
import type { VelvetColour } from '@/lib/grimoire-theme';
import {
  type HistoryStack,
  createEmptyHistory,
  pushHistorySnapshot,
  stepHistoryRedo,
  stepHistoryUndo,
} from '@/lib/history-stack';
import { SilentCardPayload } from '@/components/FullscreenCardModal';

export const ROOMS_STORAGE_KEY = 'botc_tb_rooms_v3';
export const LEGACY_STORAGE_KEY = 'botc_tb_game_session_v2';
export const MAX_ROOMS = 3;

export interface GameStoryEntry {
  id: string;
  round: string;
  timestamp: number;
  text: string;
  category: 'death' | 'execution' | 'slayer' | 'starpass' | 'win' | 'start';
}

export interface InitialPlayerRoster {
  id: string;
  name: string;
  seatIndex: number;
  roleId: string;
  perceivedRoleId: string;
  team: string;
}

export type TimerAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'setDuration'; seconds: number }
  | { type: 'adjustSeconds'; deltaSeconds: number }
  | { type: 'clear' };

export interface PersistedGameSession {
  hasActiveGame: boolean;
  playerCount: number;
  isDrunkActive?: boolean;
  selectedRoleIds: string[];
  drunkFakeRoleId: string | null;
  demonBluffIds: string[];
  players: PlayerSeat[];
  initialPlayers?: InitialPlayerRoster[];
  phase: GamePhase;
  dayNumber: number;
  executedTodayPlayerId: string | null;
  lastNightDeaths: string[];
  gameAlertBanner: string | null;
  winner: 'good' | 'evil' | null;
  storyHistory: GameStoryEntry[];
  velvetColour?: VelvetColour;
  startedAt?: number;
  phaseStartedAt?: number;
  dayTimer?: DayTimerState | null;
  nominationsToday?: DayNomination[];
}

export interface GameRoom {
  id: string;
  name: string;
  createdAt: number;
  lastActiveAt: number;
  session: PersistedGameSession;
}

export interface StarpassPendingData {
  dyingDemon: PlayerSeat;
  aliveMinions: PlayerSeat[];
}

function createEmptySession(name = 'Game Baru'): PersistedGameSession {
  return {
    hasActiveGame: false,
    playerCount: 8,
    isDrunkActive: false,
    selectedRoleIds: [],
    drunkFakeRoleId: null,
    demonBluffIds: [],
    players: [],
    initialPlayers: [],
    phase: 'first_night',
    dayNumber: 1,
    executedTodayPlayerId: null,
    lastNightDeaths: [],
    gameAlertBanner: null,
    winner: null,
    storyHistory: [],
    velvetColour: 'midnight',
    startedAt: undefined,
    phaseStartedAt: undefined,
    dayTimer: { durationMs: 300_000, remainingMs: 300_000, deadline: null },
    nominationsToday: [],
  };
}

function formatSessionRoundLabel(phase: GamePhase, dayNumber: number): string {
  if (phase === 'first_night') return 'Malam Pertama';
  if (phase === 'day') return `Siang #${dayNumber}`;
  return `Malam #${Math.max(2, dayNumber)}`;
}

function makeStoryRecord(
  round: string,
  text: string,
  category: GameStoryEntry['category']
): GameStoryEntry {
  return {
    id: `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    round,
    timestamp: Date.now(),
    text,
    category,
  };
}

function applyEvaluatedWinner(
  s: PersistedGameSession,
  nextPlayers: PlayerSeat[],
  roundLabel: string,
  baseStory: GameStoryEntry[] = s.storyHistory || []
): {
  winner: 'good' | 'evil' | null;
  storyHistory: GameStoryEntry[];
  gameAlertBanner: string | null;
} {
  const nextWinner = evaluateBoardWinner(nextPlayers);
  if (nextWinner && nextWinner !== s.winner) {
    const winText =
      nextWinner === 'good'
        ? 'Tim Good Menang — Seluruh Demon telah mati.'
        : 'Tim Evil Menang — Hanya tersisa 2 pemain non-Traveller hidup dan Demon bertahan.';
    return {
      winner: nextWinner,
      storyHistory: [...baseStory, makeStoryRecord(roundLabel, winText, 'win')],
      gameAlertBanner: null,
    };
  }
  return {
    winner: nextWinner,
    storyHistory: baseStory,
    gameAlertBanner: s.gameAlertBanner,
  };
}

export interface GameContextType {
  mounted: boolean;
  // Rooms
  rooms: GameRoom[];
  activeRoomId: string;
  activeRoom: GameRoom;
  createNewRoom: (customName?: string) => string;
  switchRoom: (roomId: string) => void;
  deleteRoom: (roomId: string) => void;
  renameRoom: (roomId: string, newName: string) => void;

  // Active session data
  hasActiveGame: boolean;
  playerCount: number;
  isDrunkActive: boolean;
  selectedRoleIds: string[];
  drunkFakeRoleId: string | null;
  demonBluffIds: string[];
  players: PlayerSeat[];
  initialPlayers: InitialPlayerRoster[];
  phase: GamePhase;
  dayNumber: number;
  executedTodayPlayerId: string | null;
  lastNightDeaths: string[];
  gameAlertBanner: string | null;
  winner: 'good' | 'evil' | null;
  storyHistory: GameStoryEntry[];
  velvetColour: VelvetColour;
  startedAt?: number;
  phaseStartedAt?: number;
  dayTimer: DayTimerState | null;
  nominationsToday: DayNomination[];
  canUndo: boolean;
  canRedo: boolean;
  silentCard: SilentCardPayload | null;
  isRefModalOpen: boolean;
  isStoryModalOpen: boolean;
  starpassPending: StarpassPendingData | null;

  // Actions
  startDemoGame: () => void;
  resetSession: () => void;
  undoLastAction: () => void;
  redoLastAction: () => void;
  setVelvetColour: (colour: VelvetColour) => void;
  handleUpdateTimer: (action: TimerAction) => void;
  completeSetup: (payload: {
    playerCount: number;
    isDrunkActive: boolean;
    selectedRoleIds: string[];
    drunkFakeRoleId: string | null;
    demonBluffIds: string[];
    players: PlayerSeat[];
  }) => void;
  setPhase: (phase: GamePhase) => void;
  setGameAlertBanner: (banner: string | null) => void;
  setDemonBluffIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSilentCard: (card: SilentCardPayload | null) => void;
  setIsRefModalOpen: (open: boolean) => void;
  setIsStoryModalOpen: (open: boolean) => void;
  handleChooseStarpassMinion: (chosenMinionId: string) => void;
  handleDismissStarpassModal: () => void;

  handleSwapSeats: (fromIdx: number, toIdx: number) => void;
  handleMoveSeat: (seatIdx: number, dir: 'cw' | 'ccw') => void;
  handleRotateRing: (dir: 'cw' | 'ccw') => void;
  handleAddSeat: (atIndex?: number) => void;
  handleRemoveSeat: (playerId: string) => void;
  handleRenamePlayer: (playerId: string, name: string) => void;
  handleSetPlayerAlignment: (playerId: string, alignment: 'good' | 'evil') => void;
  handleKillPlayer: (playerId: string, cause: 'demon' | 'execution' | 'slayer') => void;
  handleResurrectPlayer: (playerId: string) => void;
  handleChangeDeathCause: (playerId: string, cause: 'demon' | 'execution' | 'slayer') => void;
  handleToggleAlive: (playerId: string, cause?: 'demon' | 'execution' | 'slayer') => void;
  handleToggleGhostVote: (playerId: string) => void;
  handleAddReminder: (playerId: string, reminderId: string) => void;
  handleAddCustomNoteReminder: (playerId: string, noteText: string) => void;
  handleEditCustomNoteReminder: (playerId: string, instanceId: string, noteText: string) => void;
  handleMoveReminder: (fromPlayerId: string, instanceId: string, toPlayerId: string) => void;
  handleRemoveReminder: (playerId: string, instanceId: string) => void;
  handleSetSingleReminderTarget: (reminderId: string, targetPlayerId: string) => void;
  handleChangePlayerTrueRole: (playerId: string, newTrueRoleId: string) => void;
  handleSetDrunkPlayer: (playerId: string) => void;
  handleResolveImpAttack: (targetPlayerId: string) => { outcomeMessage: string };
  handleTransitionNightToDay: () => void;
  handleTransitionDayToNextNight: () => void;
  handleExecutePlayerInDay: (playerId: string | null) => void;
  handleEndGameManual: (winner: 'good' | 'evil' | null) => void;
  handleNominatePlayer: (nominatorId: string, nomineeId: string) => string;
  handleToggleVoteForNomination: (nominationId: string, seatId: string) => void;
  handleResetNominationVotes: (nominationId: string) => void;
  handleMarkNomination: (nominationId: string, mark: boolean) => void;
  handleCancelNomination: (nominationId: string) => void;
  handleTriggerSlayerShot: (slayerPlayerId: string, targetPlayerId: string) => string;
  handleTriggerVirginNomination: (virginPlayerId: string, nominatorPlayerId: string) => string;
}

const GameContext = createContext<GameContextType | null>(null);

function loadPersistedRooms(): { rooms: GameRoom[]; activeRoomId: string } {
  if (typeof window === 'undefined') {
    const defaultRoom: GameRoom = {
      id: 'room-1',
      name: 'Room 1',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      session: createEmptySession('Room 1'),
    };
    return { rooms: [defaultRoom], activeRoomId: defaultRoom.id };
  }

  try {
    const raw = window.localStorage.getItem(ROOMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { rooms: GameRoom[]; activeRoomId: string };
      if (parsed && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
        const validRooms = parsed.rooms.slice(0, MAX_ROOMS).map((r) => ({
          ...r,
          session: {
            ...r.session,
            storyHistory: Array.isArray(r.session.storyHistory) ? r.session.storyHistory : [],
            players: sanitizePlayerSeats(r.session.players || []),
          },
        }));
        const activeExists = validRooms.some((r) => r.id === parsed.activeRoomId);
        return {
          rooms: validRooms,
          activeRoomId: activeExists ? parsed.activeRoomId : validRooms[0].id,
        };
      }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw) as PersistedGameSession;
      if (legacyParsed && Array.isArray(legacyParsed.players)) {
        const migratedRoom: GameRoom = {
          id: 'room-1',
          name: 'Room 1',
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          session: {
            ...legacyParsed,
            storyHistory: [],
            players: sanitizePlayerSeats(legacyParsed.players),
          },
        };
        return { rooms: [migratedRoom], activeRoomId: migratedRoom.id };
      }
    }
  } catch {
    // Ignore storage parse error
  }

  const initialRoom: GameRoom = {
    id: `room-${Date.now()}`,
    name: 'Room 1',
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    session: createEmptySession('Room 1'),
  };
  return { rooms: [initialRoom], activeRoomId: initialRoom.id };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const initialData = useMemo(() => loadPersistedRooms(), []);
  const [rooms, setRooms] = useState<GameRoom[]>(initialData.rooms);
  const [activeRoomId, setActiveRoomId] = useState<string>(initialData.activeRoomId);

  const activeRoom = useMemo(() => {
    return (
      rooms.find((r) => r.id === activeRoomId) ??
      rooms[0] ?? {
        id: 'fallback',
        name: 'Room 1',
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        session: createEmptySession(),
      }
    );
  }, [rooms, activeRoomId]);

  const session = activeRoom.session;

  const [silentCard, setSilentCard] = useState<SilentCardPayload | null>(null);
  const [isRefModalOpen, setIsRefModalOpen] = useState<boolean>(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [starpassPending, setStarpassPending] = useState<StarpassPendingData | null>(null);
  const [historyStacks, setHistoryStacks] = useState<
    Record<string, HistoryStack<PersistedGameSession>>
  >({});
  const sessionRef = React.useRef(session);
  sessionRef.current = session;

  // Sync to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(
        ROOMS_STORAGE_KEY,
        JSON.stringify({ rooms, activeRoomId })
      );
    } catch {
      // Ignore quota errors
    }
  }, [mounted, rooms, activeRoomId]);

  const updateSession = useCallback(
    (
      updater: (prev: PersistedGameSession) => PersistedGameSession,
      options?: { recordUndo?: boolean }
    ) => {
      const shouldRecord = options?.recordUndo !== false;
      const current = sessionRef.current;
      if (shouldRecord && current.hasActiveGame) {
        const snapshot = JSON.parse(JSON.stringify(current)) as PersistedGameSession;
        setHistoryStacks((stacks) => ({
          ...stacks,
          [activeRoomId]: pushHistorySnapshot(stacks[activeRoomId], snapshot),
        }));
      }
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          if (r.id !== activeRoomId) return r;
          const nextSession = updater(r.session);
          return {
            ...r,
            lastActiveAt: Date.now(),
            session: nextSession,
          };
        })
      );
    },
    [activeRoomId]
  );

  const canUndo = (historyStacks[activeRoomId]?.undo.length ?? 0) > 0;
  const canRedo = (historyStacks[activeRoomId]?.redo.length ?? 0) > 0;

  const applyHistoryStep = useCallback(
    (direction: 'undo' | 'redo') => {
      const currentSnapshot = JSON.parse(
        JSON.stringify(sessionRef.current)
      ) as PersistedGameSession;
      const roomStack = historyStacks[activeRoomId];
      const { nextStack, restored } =
        direction === 'undo'
          ? stepHistoryUndo(roomStack, currentSnapshot)
          : stepHistoryRedo(roomStack, currentSnapshot);
      if (!restored) return;
      setHistoryStacks((stacks) => ({ ...stacks, [activeRoomId]: nextStack }));
      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r.id === activeRoomId ? { ...r, lastActiveAt: Date.now(), session: restored } : r
        )
      );
    },
    [activeRoomId, historyStacks]
  );

  const undoLastAction = useCallback(() => applyHistoryStep('undo'), [applyHistoryStep]);
  const redoLastAction = useCallback(() => applyHistoryStep('redo'), [applyHistoryStep]);

  const setVelvetColour = useCallback(
    (colour: VelvetColour) => {
      updateSession((s) => ({ ...s, velvetColour: colour }), { recordUndo: false });
    },
    [updateSession]
  );

  const handleUpdateTimer = useCallback(
    (action: TimerAction) => {
      const now = Date.now();
      updateSession(
        (s) => {
          const current: DayTimerState = s.dayTimer ?? {
            durationMs: 300_000,
            remainingMs: 300_000,
            deadline: null,
          };
          const remaining = computeTimerRemainingMs(current, now);
          if (action.type === 'clear') {
            return { ...s, dayTimer: null };
          }
          if (action.type === 'start') {
            const baseRemaining = remaining > 0 ? remaining : current.durationMs;
            return {
              ...s,
              dayTimer: {
                durationMs: current.durationMs,
                remainingMs: baseRemaining,
                deadline: now + baseRemaining,
              },
            };
          }
          if (action.type === 'pause') {
            return {
              ...s,
              dayTimer: {
                durationMs: current.durationMs,
                remainingMs: remaining,
                deadline: null,
              },
            };
          }
          if (action.type === 'reset') {
            return {
              ...s,
              dayTimer: {
                durationMs: current.durationMs,
                remainingMs: current.durationMs,
                deadline: null,
              },
            };
          }
          if (action.type === 'setDuration') {
            const nextMs = Math.max(30_000, Math.min(3_600_000, action.seconds * 1000));
            return {
              ...s,
              dayTimer: {
                durationMs: nextMs,
                remainingMs: nextMs,
                deadline: null,
              },
            };
          }
          if (action.type === 'adjustSeconds') {
            const deltaMs = action.deltaSeconds * 1000;
            const isRunning = current.deadline !== null;
            const nextDuration = Math.max(
              30_000,
              Math.min(3_600_000, current.durationMs + deltaMs)
            );
            const nextRemaining = Math.max(
              0,
              Math.min(3_600_000, remaining + deltaMs)
            );
            return {
              ...s,
              dayTimer: {
                durationMs: nextDuration,
                remainingMs: nextRemaining,
                deadline: isRunning && nextRemaining > 0 ? now + nextRemaining : null,
              },
            };
          }
          return s;
        },
        { recordUndo: false }
      );
    },
    [updateSession]
  );

  const appendStory = useCallback(
    (
      round: string,
      text: string,
      category: 'death' | 'execution' | 'slayer' | 'starpass' | 'win' | 'start'
    ) => {
      const entry: GameStoryEntry = {
        id: `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        round,
        timestamp: Date.now(),
        text,
        category,
      };
      updateSession((s) => ({
        ...s,
        storyHistory: [...(s.storyHistory || []), entry],
      }));
    },
    [updateSession]
  );

  const createNewRoom = useCallback(
    (customName?: string): string => {
      const now = Date.now();
      let nextRooms = [...rooms];

      if (nextRooms.length >= MAX_ROOMS) {
        nextRooms.sort((a, b) => a.createdAt - b.createdAt);
        nextRooms.shift();
      }

      const newId = `room-${now}-${Math.random().toString(36).slice(2, 6)}`;
      const roomNum = nextRooms.length + 1;
      const roomName = customName?.trim() || `Room ${roomNum}`;

      const newRoom: GameRoom = {
        id: newId,
        name: roomName,
        createdAt: now,
        lastActiveAt: now,
        session: createEmptySession(roomName),
      };

      nextRooms.push(newRoom);
      setRooms(nextRooms);
      setActiveRoomId(newId);
      return newId;
    },
    [rooms]
  );

  const switchRoom = useCallback((targetRoomId: string) => {
    setActiveRoomId(targetRoomId);
    setRooms((prev) =>
      prev.map((r) => (r.id === targetRoomId ? { ...r, lastActiveAt: Date.now() } : r))
    );
  }, []);

  const deleteRoom = useCallback(
    (targetRoomId: string) => {
      if (rooms.length <= 1) return;
      const remaining = rooms.filter((r) => r.id !== targetRoomId);
      setRooms(remaining);
      if (activeRoomId === targetRoomId) {
        setActiveRoomId(remaining[0].id);
      }
    },
    [rooms, activeRoomId]
  );

  const renameRoom = useCallback((targetRoomId: string, newName: string) => {
    if (!newName.trim()) return;
    setRooms((prev) =>
      prev.map((r) => (r.id === targetRoomId ? { ...r, name: newName.trim() } : r))
    );
  }, []);

  const evaluateWinConditions = useCallback(
    (updatedPlayers: PlayerSeat[], contextMsg?: string) => {
      const alive = updatedPlayers.filter((p) => p.isAlive);
      const aliveDemons = alive.filter((p) => ROLE_MAP[p.trueRoleId]?.team === 'demon');

      if (contextMsg) {
        updateSession((s) => ({ ...s, gameAlertBanner: contextMsg }));
        return;
      }

      const currentPhaseName = formatSessionRoundLabel(session.phase, session.dayNumber);

      if (aliveDemons.length === 0) {
        const msg = 'Tim Good Menang — Seluruh Demon telah mati.';
        updateSession(
          (s) => ({
            ...s,
            winner: 'good',
            gameAlertBanner: null,
            storyHistory: [
              ...(s.storyHistory || []),
              makeStoryRecord(currentPhaseName, msg, 'win'),
            ],
          }),
          { recordUndo: false }
        );
      } else if (countAliveNonTravellers(updatedPlayers) <= 2) {
        const msg =
          'Tim Evil Menang — Hanya tersisa 2 pemain non-Traveller hidup dan Demon bertahan.';
        updateSession(
          (s) => ({
            ...s,
            winner: 'evil',
            gameAlertBanner: null,
            storyHistory: [
              ...(s.storyHistory || []),
              makeStoryRecord(currentPhaseName, msg, 'win'),
            ],
          }),
          { recordUndo: false }
        );
      } else {
        updateSession(
          (s) => ({ ...s, winner: null, gameAlertBanner: null }),
          { recordUndo: false }
        );
      }
    },
    [session.dayNumber, session.phase, updateSession]
  );

  const startDemoGame = useCallback(() => {
    const demo = createDemoSession(8);
    const initialStory: GameStoryEntry = {
      id: `story-${Date.now()}`,
      round: 'Setup',
      timestamp: Date.now(),
      text: `Permainan dimulai (8 Pemain). Demon: ${
        demo.players.find((p) => ROLE_MAP[p.trueRoleId]?.team === 'demon')?.name
      }.`,
      category: 'start',
    };
    const initialRoster: InitialPlayerRoster[] = demo.players.map((p) => ({
      id: p.id,
      name: p.name,
      seatIndex: p.seatIndex,
      roleId: p.trueRoleId,
      perceivedRoleId: p.perceivedRoleId,
      team: ROLE_MAP[p.trueRoleId]?.team || 'townsfolk',
    }));
    setHistoryStacks((stacks) => ({ ...stacks, [activeRoomId]: createEmptyHistory() }));
    updateSession((s) => ({
      ...s,
      hasActiveGame: true,
      playerCount: demo.playerCount,
      selectedRoleIds: demo.selectedRoleIds,
      drunkFakeRoleId: demo.drunkFakeRoleId,
      demonBluffIds: demo.demonBluffIds,
      players: demo.players,
      initialPlayers: initialRoster,
      phase: 'first_night',
      dayNumber: 1,
      executedTodayPlayerId: null,
      lastNightDeaths: [],
      gameAlertBanner: null,
      winner: null,
      storyHistory: [initialStory],
      isDrunkActive: demo.players.some((p) => p.trueRoleId === 'drunk'),
      velvetColour: s.velvetColour || 'midnight',
      startedAt: Date.now(),
      phaseStartedAt: Date.now(),
      dayTimer: { durationMs: 300_000, remainingMs: 300_000, deadline: null },
      nominationsToday: [],
    }), { recordUndo: false });
  }, [activeRoomId, updateSession]);

  const resetSession = useCallback(() => {
    setHistoryStacks((stacks) => ({ ...stacks, [activeRoomId]: createEmptyHistory() }));
    updateSession((s) => ({ ...createEmptySession(activeRoom.name), velvetColour: s.velvetColour || 'midnight' }), { recordUndo: false });
    setStarpassPending(null);
  }, [activeRoom.name, activeRoomId, updateSession]);

  const completeSetup = useCallback(
    (payload: {
      playerCount: number;
      isDrunkActive: boolean;
      selectedRoleIds: string[];
      drunkFakeRoleId: string | null;
      demonBluffIds: string[];
      players: PlayerSeat[];
    }) => {
      const sanitized = sanitizePlayerSeats(payload.players);
      const initialRoster: InitialPlayerRoster[] = sanitized.map((p) => ({
        id: p.id,
        name: p.name,
        seatIndex: p.seatIndex,
        roleId: p.trueRoleId,
        perceivedRoleId: p.perceivedRoleId,
        team: ROLE_MAP[p.trueRoleId]?.team || 'townsfolk',
      }));
      const initialStory: GameStoryEntry = {
        id: `story-${Date.now()}`,
        round: 'Setup',
        timestamp: Date.now(),
        text: `Permainan baru dimulai dengan ${payload.playerCount} pemain.`,
        category: 'start',
      };

      setHistoryStacks((stacks) => ({ ...stacks, [activeRoomId]: createEmptyHistory() }));
      updateSession((s) => ({
        ...s,
        hasActiveGame: true,
        playerCount: payload.playerCount,
        isDrunkActive: payload.isDrunkActive,
        selectedRoleIds: payload.selectedRoleIds,
        drunkFakeRoleId: payload.drunkFakeRoleId,
        demonBluffIds: payload.demonBluffIds,
        players: sanitized,
        initialPlayers: initialRoster,
        phase: 'first_night',
        dayNumber: 1,
        executedTodayPlayerId: null,
        lastNightDeaths: [],
        gameAlertBanner: null,
        winner: null,
        storyHistory: [initialStory],
        velvetColour: s.velvetColour || 'midnight',
        startedAt: Date.now(),
        phaseStartedAt: Date.now(),
        dayTimer: { durationMs: 300_000, remainingMs: 300_000, deadline: null },
        nominationsToday: [],
      }), { recordUndo: false });
    },
    [activeRoomId, updateSession]
  );

  const handleSwapSeats = useCallback(
    (fromIdx: number, toIdx: number) => {
      updateSession((s) => ({
        ...s,
        players: swapPlayerSeats(s.players, fromIdx, toIdx),
      }));
    },
    [updateSession]
  );

  const handleMoveSeat = useCallback(
    (seatIdx: number, dir: 'cw' | 'ccw') => {
      updateSession((s) => ({
        ...s,
        players: movePlayerSeat(s.players, seatIdx, dir),
      }));
    },
    [updateSession]
  );

  const handleSetDrunkPlayer = useCallback(
    (targetPlayerId: string) => {
      updateSession((s) => {
        const target = s.players.find((p) => p.id === targetPlayerId);
        const isAlreadyDrunk = target?.trueRoleId === 'drunk';

        const next = s.players.map((p) => {
          const withoutDrunkRem = p.reminders.filter((r) => r.reminderId !== 'is_the_drunk');
          if (p.id === targetPlayerId) {
            if (isAlreadyDrunk) {
              return {
                ...p,
                trueRoleId: p.perceivedRoleId,
                reminders: withoutDrunkRem,
              };
            } else {
              return {
                ...p,
                trueRoleId: 'drunk',
                reminders: [
                  ...withoutDrunkRem,
                  { instanceId: `rem-drunk-${Date.now()}`, reminderId: 'is_the_drunk' },
                ],
              };
            }
          }
          if (!isAlreadyDrunk && p.trueRoleId === 'drunk') {
            return {
              ...p,
              trueRoleId: p.perceivedRoleId,
              reminders: withoutDrunkRem,
            };
          }
          return p;
        });

        return {
          ...s,
          players: sanitizePlayerSeats(next),
          gameAlertBanner: null,
        };
      });
    },
    [updateSession]
  );

  // Starpass manual selection from modal
  const handleChooseStarpassMinion = useCallback(
    (chosenMinionId: string) => {
      updateSession((s) => {
        const chosen = s.players.find((p) => p.id === chosenMinionId);
        if (!chosen) return s;
        const roundLabel = formatSessionRoundLabel(s.phase, s.dayNumber);
        const next = sanitizePlayerSeats(
          s.players.map((p) => {
            if (p.id === chosenMinionId) {
              return {
                ...p,
                trueRoleId: 'imp',
                perceivedRoleId: 'imp',
                reminders: [
                  ...p.reminders.filter((r) => r.reminderId !== 'die_imp'),
                  { instanceId: `rem-sw-imp-${Date.now()}`, reminderId: 'is_demon_sw' },
                ],
              };
            }
            return p;
          })
        );
        const story = [
          ...(s.storyHistory || []),
          makeStoryRecord(
            roundLabel,
            `Demon bunuh diri (Starpass). Minion ${chosen.name} (Kursi ${chosen.seatIndex + 1}) dipilih menjadi IMP baru.`,
            'starpass'
          ),
        ];
        const evaluated = applyEvaluatedWinner(s, next, roundLabel, story);
        return {
          ...s,
          players: next,
          winner: evaluated.winner,
          storyHistory: evaluated.storyHistory,
          gameAlertBanner: `STARPASS SELESAI! ${chosen.name} (Kursi ${chosen.seatIndex + 1}) sekarang adalah IMP baru!`,
        };
      });
      setStarpassPending(null);
    },
    [updateSession]
  );

  const handleDismissStarpassModal = useCallback(() => {
    setStarpassPending(null);
  }, []);

  const handleKillPlayer = useCallback(
    (playerId: string, cause: 'demon' | 'execution' | 'slayer') => {
      const target = session.players.find((p) => p.id === playerId);
      if (!target) return;

      const currentRoundLabel = formatSessionRoundLabel(session.phase, session.dayNumber);
      const roleName = ROLE_MAP[target.perceivedRoleId]?.name || 'Unknown';
      const isTargetDemon = ROLE_MAP[target.trueRoleId]?.team === 'demon';

      // Check for Demon Suicide / Starpass if multiple alive Minions need picker modal
      if (isTargetDemon && cause === 'demon') {
        const aliveMinions = session.players.filter(
          (p) => p.isAlive && p.id !== playerId && ROLE_MAP[p.trueRoleId]?.team === 'minion'
        );

        if (aliveMinions.length === 1) {
          const singleMinion = aliveMinions[0];
          updateSession((s) => {
            const next = sanitizePlayerSeats(
              s.players.map((p) => {
                if (p.id === playerId) {
                  return {
                    ...p,
                    isAlive: false,
                    deathCause: 'demon' as const,
                    hasGhostVote: true,
                  };
                }
                if (p.id === singleMinion.id) {
                  return {
                    ...p,
                    trueRoleId: 'imp',
                    perceivedRoleId: 'imp',
                    reminders: [
                      ...p.reminders.filter((r) => r.reminderId !== 'die_imp'),
                      { instanceId: `rem-sw-imp-${Date.now()}`, reminderId: 'is_demon_sw' },
                    ],
                  };
                }
                return p;
              })
            );
            const story = [
              ...(s.storyHistory || []),
              makeStoryRecord(
                currentRoundLabel,
                `STARPASS: Demon ${target.name} (${roleName}) bunuh diri. Minion ${singleMinion.name} (Kursi ${singleMinion.seatIndex + 1}) otomatis berubah menjadi IMP baru!`,
                'starpass'
              ),
            ];
            const evaluated = applyEvaluatedWinner(s, next, currentRoundLabel, story);
            return {
              ...s,
              players: next,
              winner: evaluated.winner,
              storyHistory: evaluated.storyHistory,
              gameAlertBanner: `STARPASS! Demon (${target.name}) bunuh diri. Minion ${singleMinion.name} (Kursi ${singleMinion.seatIndex + 1}) otomatis berubah menjadi IMP baru!`,
            };
          });
          return;
        }

        if (aliveMinions.length > 1) {
          updateSession((s) => {
            const next = sanitizePlayerSeats(
              s.players.map((p) =>
                p.id === playerId
                  ? { ...p, isAlive: false, deathCause: 'demon' as const, hasGhostVote: true }
                  : p
              )
            );
            const story = [
              ...(s.storyHistory || []),
              makeStoryRecord(
                currentRoundLabel,
                `Pewarisan Imp: Terdapat ${aliveMinions.length} Minion hidup (${aliveMinions.map((m) => m.name).join(', ')}). Storyteller membuka pemilihan Minion pewaris Imp.`,
                'starpass'
              ),
            ];
            return {
              ...s,
              players: next,
              storyHistory: story,
            };
          });
          setStarpassPending({
            dyingDemon: target,
            aliveMinions,
          });
          return;
        }
      }

      updateSession((s) => {
        const currentTarget = s.players.find((p) => p.id === playerId);
        if (!currentTarget) return s;
        const roundLabel = formatSessionRoundLabel(s.phase, s.dayNumber);
        const aliveBeforeNonTravellers = countAliveNonTravellers(s.players);
        const currRoleName = ROLE_MAP[currentTarget.perceivedRoleId]?.name || 'Unknown';
        const currIsDemon = ROLE_MAP[currentTarget.trueRoleId]?.team === 'demon';

        const actionStoryText =
          cause === 'execution'
            ? `${currentTarget.name} (${currRoleName}) dieksekusi mati oleh warga kota.`
            : cause === 'slayer'
            ? `${currentTarget.name} (${currRoleName}) tewas seketika akibat tembakan Slayer!`
            : currIsDemon
            ? `Demon ${currentTarget.name} (${currRoleName}) tewas di malam hari.`
            : `${currentTarget.name} (${currRoleName}) tewas diserang oleh Demon malam ini.`;
        const actionCategory: GameStoryEntry['category'] =
          cause === 'execution'
            ? 'execution'
            : cause === 'slayer'
            ? 'slayer'
            : currIsDemon
            ? 'starpass'
            : 'death';
        let nextStory: GameStoryEntry[] = [
          ...(s.storyHistory || []),
          makeStoryRecord(roundLabel, actionStoryText, actionCategory),
        ];

        // Saint check on execution
        if (cause === 'execution' && currentTarget.trueRoleId === 'saint' && !isPlayerPoisoned(currentTarget)) {
          const next = sanitizePlayerSeats(
            s.players.map((p) => {
              const cleaned = p.reminders.filter((r) => r.reminderId !== 'executed');
              if (p.id !== playerId) return { ...p, reminders: cleaned };
              return {
                ...p,
                isAlive: false,
                deathCause: 'execution' as const,
                hasGhostVote: true,
                reminders: cleaned,
              };
            })
          );
          nextStory = [
            ...nextStory,
            makeStoryRecord(
              roundLabel,
              `SAINT DIEKSEKUSI! ${currentTarget.name} adalah Saint asli yang sehat. Tim Evil langsung menang!`,
              'win'
            ),
          ];
          return {
            ...s,
            winner: 'evil',
            executedTodayPlayerId: playerId,
            players: next,
            storyHistory: nextStory,
            gameAlertBanner: null,
          };
        }

        // Scarlet Woman check on Demon execution or Slayer shot (5+ non-Traveller alive before death)
        if ((cause === 'execution' || cause === 'slayer') && currIsDemon && aliveBeforeNonTravellers >= 5) {
          const healthySW = s.players.find(
            (p) =>
              p.isAlive &&
              p.id !== playerId &&
              p.trueRoleId === 'scarlet_woman' &&
              !isPlayerPoisoned(p)
          );

          if (healthySW) {
            const next = sanitizePlayerSeats(
              s.players.map((p) => {
                const cleaned = p.reminders.filter((r) => r.reminderId !== 'executed');
                if (p.id === playerId) {
                  return {
                    ...p,
                    isAlive: false,
                    deathCause: cause,
                    hasGhostVote: true,
                    reminders: cleaned,
                  };
                }
                if (p.id === healthySW.id) {
                  return {
                    ...p,
                    trueRoleId: 'imp',
                    perceivedRoleId: 'imp',
                    reminders: [
                      ...cleaned,
                      { instanceId: `rem-sw-demon-${Date.now()}`, reminderId: 'is_demon_sw' },
                    ],
                  };
                }
                return { ...p, reminders: cleaned };
              })
            );
            const causeText = cause === 'slayer' ? 'ditembak mati oleh Slayer' : 'dieksekusi warga';
            nextStory = [
              ...nextStory,
              makeStoryRecord(
                roundLabel,
                `Demon (${currentTarget.name}) ${causeText} saat ada ${aliveBeforeNonTravellers} pemain aktif. Scarlet Woman (${healthySW.name}) otomatis menjadi IMP baru!`,
                'starpass'
              ),
            ];
            return {
              ...s,
              executedTodayPlayerId: cause === 'execution' ? playerId : s.executedTodayPlayerId,
              players: next,
              storyHistory: nextStory,
              gameAlertBanner: `SCARLET WOMAN AKTIF! ${healthySW.name} diam-diam mewarisi peran IMP baru!`,
            };
          }
        }

        const next = sanitizePlayerSeats(
          s.players.map((p) => {
            const cleaned = p.reminders.filter((r) => r.reminderId !== 'executed');
            if (p.id !== playerId) return { ...p, reminders: cleaned };
            return {
              ...p,
              isAlive: false,
              deathCause: cause,
              hasGhostVote: true,
              reminders: cleaned,
            };
          })
        );

        const evaluated = applyEvaluatedWinner(s, next, roundLabel, nextStory);
        return {
          ...s,
          executedTodayPlayerId: cause === 'execution' ? playerId : s.executedTodayPlayerId,
          players: next,
          winner: evaluated.winner,
          storyHistory: evaluated.storyHistory,
          gameAlertBanner: evaluated.gameAlertBanner,
        };
      });
    },
    [session.dayNumber, session.phase, session.players, updateSession]
  );

  const handleResurrectPlayer = useCallback(
    (playerId: string) => {
      updateSession((s) => {
        const target = s.players.find((p) => p.id === playerId);
        if (!target) return s;
        const roundLabel = formatSessionRoundLabel(s.phase, s.dayNumber);
        const next = sanitizePlayerSeats(
          s.players.map((p) =>
            p.id !== playerId
              ? p
              : {
                  ...p,
                  isAlive: true,
                  deathCause: undefined,
                }
          )
        );
        const story = [
          ...(s.storyHistory || []),
          makeStoryRecord(
            roundLabel,
            `${target.name} (${ROLE_MAP[target.perceivedRoleId]?.name}) dihidupkan kembali oleh Storyteller.`,
            'start'
          ),
        ];
        const evaluated = applyEvaluatedWinner(s, next, roundLabel, story);
        return {
          ...s,
          executedTodayPlayerId:
            s.executedTodayPlayerId === playerId ? null : s.executedTodayPlayerId,
          players: next,
          winner: evaluated.winner,
          storyHistory: evaluated.storyHistory,
          gameAlertBanner: evaluated.gameAlertBanner,
        };
      });
    },
    [updateSession]
  );

  const handleChangeDeathCause = useCallback(
    (playerId: string, cause: 'demon' | 'execution' | 'slayer') => {
      updateSession((s) => {
        const roundLabel = formatSessionRoundLabel(s.phase, s.dayNumber);
        const next = sanitizePlayerSeats(
          s.players.map((p) => {
            const cleaned = p.reminders.filter((r) => r.reminderId !== 'executed');
            if (p.id !== playerId) return { ...p, reminders: cleaned };
            return {
              ...p,
              isAlive: false,
              deathCause: cause,
              reminders: cleaned,
            };
          })
        );
        const evaluated = applyEvaluatedWinner(s, next, roundLabel);
        return {
          ...s,
          executedTodayPlayerId: cause === 'execution' ? playerId : s.executedTodayPlayerId,
          players: next,
          winner: evaluated.winner,
          storyHistory: evaluated.storyHistory,
        };
      });
    },
    [updateSession]
  );

  const handleToggleAlive = useCallback(
    (playerId: string, cause?: 'demon' | 'execution' | 'slayer') => {
      const target = session.players.find((p) => p.id === playerId);
      if (!target) return;
      if (target.isAlive) {
        handleKillPlayer(playerId, cause ?? 'demon');
      } else {
        handleResurrectPlayer(playerId);
      }
    },
    [handleKillPlayer, handleResurrectPlayer, session.players]
  );

  const handleToggleGhostVote = useCallback(
    (playerId: string) => {
      updateSession((s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === playerId ? { ...p, hasGhostVote: !p.hasGhostVote } : p
        ),
      }));
    },
    [updateSession]
  );

  const handleAddReminder = useCallback(
    (playerId: string, reminderId: string) => {
      if (reminderId === 'is_the_drunk') {
        handleSetDrunkPlayer(playerId);
        return;
      }

      updateSession((s) => {
        const next = s.players.map((p) => {
          if (p.id !== playerId) {
            if (
              reminderId === 'poisoned' ||
              reminderId === 'protected' ||
              reminderId === 'die_imp'
            ) {
              return {
                ...p,
                reminders: p.reminders.filter((r) => r.reminderId !== reminderId),
              };
            }
            return p;
          }

          const alreadyHas = p.reminders.some((r) => r.reminderId === reminderId);
          if (alreadyHas) {
            return {
              ...p,
              reminders: p.reminders.filter((r) => r.reminderId !== reminderId),
            };
          }

          const withoutThis = p.reminders.filter((r) => r.reminderId !== reminderId);
          return {
            ...p,
            reminders: [
              ...withoutThis,
              {
                instanceId: `rem-${reminderId}-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 6)}`,
                reminderId,
              },
            ],
          };
        });
        return {
          ...s,
          players: sanitizePlayerSeats(next),
        };
      });
    },
    [handleSetDrunkPlayer, updateSession]
  );

  const handleSetSingleReminderTarget = useCallback(
    (reminderId: string, targetPlayerId: string) => {
      updateSession((s) => ({
        ...s,
        ...(reminderId === 'executed'
          ? { executedTodayPlayerId: targetPlayerId || null }
          : {}),
        players: s.players.map((p) => {
          const cleaned = p.reminders.filter((r) => r.reminderId !== reminderId);
          if (!targetPlayerId || p.id !== targetPlayerId) {
            return { ...p, reminders: cleaned };
          }
          return {
            ...p,
            reminders: [
              ...cleaned,
              { instanceId: `rem-${reminderId}-${Date.now()}`, reminderId },
            ],
          };
        }),
      }));
    },
    [updateSession]
  );

  const handleRemoveReminder = useCallback(
    (playerId: string, instanceId: string) => {
      updateSession((s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === playerId
            ? { ...p, reminders: p.reminders.filter((r) => r.instanceId !== instanceId) }
            : p
        ),
      }));
    },
    [updateSession]
  );

  const handleAddCustomNoteReminder = useCallback(
    (playerId: string, noteText: string) => {
      const cleaned = noteText.trim();
      if (!cleaned) return;
      updateSession((s) => ({
        ...s,
        players: sanitizePlayerSeats(
          s.players.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  reminders: [
                    ...p.reminders,
                    {
                      instanceId: `rem-note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      reminderId: `note:${cleaned}`,
                      customNote: cleaned,
                    },
                  ],
                }
              : p
          )
        ),
      }));
    },
    [updateSession]
  );

  const handleEditCustomNoteReminder = useCallback(
    (playerId: string, instanceId: string, noteText: string) => {
      const cleaned = noteText.trim();
      if (!cleaned) {
        handleRemoveReminder(playerId, instanceId);
        return;
      }
      updateSession((s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                reminders: p.reminders.map((r) =>
                  r.instanceId === instanceId
                    ? { ...r, reminderId: `note:${cleaned}`, customNote: cleaned }
                    : r
                ),
              }
            : p
        ),
      }));
    },
    [handleRemoveReminder, updateSession]
  );

  const handleMoveReminder = useCallback(
    (fromPlayerId: string, instanceId: string, toPlayerId: string) => {
      if (fromPlayerId === toPlayerId) return;
      updateSession((s) => {
        const sourceSeat = s.players.find((p) => p.id === fromPlayerId);
        const token = sourceSeat?.reminders.find((r) => r.instanceId === instanceId);
        if (!token) return s;

        const next = s.players.map((p) => {
          if (p.id === fromPlayerId) {
            return {
              ...p,
              reminders: p.reminders.filter((r) => r.instanceId !== instanceId),
            };
          }
          if (p.id === toPlayerId) {
            const withoutSameId = token.reminderId.startsWith('note:')
              ? p.reminders
              : p.reminders.filter((r) => r.reminderId !== token.reminderId);
            return {
              ...p,
              reminders: [...withoutSameId, token],
            };
          }
          return p;
        });

        return {
          ...s,
          players: sanitizePlayerSeats(next),
        };
      });
    },
    [updateSession]
  );

  const handleRotateRing = useCallback(
    (dir: 'cw' | 'ccw') => {
      updateSession((s) => ({
        ...s,
        players: rotatePlayerSeats(s.players, dir),
      }));
    },
    [updateSession]
  );

  const handleAddSeat = useCallback(
    (atIndex?: number) => {
      updateSession((s) => {
        const nextPlayers = addPlayerSeat(s.players, atIndex ?? s.players.length);
        return {
          ...s,
          playerCount: nextPlayers.length,
          players: nextPlayers,
        };
      });
    },
    [updateSession]
  );

  const handleRemoveSeat = useCallback(
    (playerId: string) => {
      updateSession((s) => {
        const nextPlayers = removePlayerSeat(s.players, playerId);
        return {
          ...s,
          playerCount: nextPlayers.length,
          players: nextPlayers,
        };
      });
    },
    [updateSession]
  );

  const handleRenamePlayer = useCallback(
    (playerId: string, name: string) => {
      const cleaned = name.trim();
      if (!cleaned) return;
      updateSession((s) => ({
        ...s,
        players: s.players.map((p) => (p.id === playerId ? { ...p, name: cleaned } : p)),
      }));
    },
    [updateSession]
  );

  const handleSetPlayerAlignment = useCallback(
    (playerId: string, alignment: 'good' | 'evil') => {
      updateSession((s) => ({
        ...s,
        players: s.players.map((p) => (p.id === playerId ? { ...p, alignment } : p)),
      }));
    },
    [updateSession]
  );

  const handleChangePlayerTrueRole = useCallback(
    (playerId: string, newTrueRoleId: string) => {
      updateSession((s) => {
        if (newTrueRoleId === 'drunk') {
          const existing = s.players.find(
            (p) => p.id !== playerId && p.trueRoleId === 'drunk'
          );
          if (existing) {
            return {
              ...s,
              gameAlertBanner: `ERROR: Hanya boleh ada 1 Drunk! Kursi ${existing.seatIndex + 1} (${existing.name}) sudah terdaftar sebagai Drunk.`,
            };
          }
        }

        const roundLabel = formatSessionRoundLabel(s.phase, s.dayNumber);
        const next = sanitizePlayerSeats(
          s.players.map((p) => {
            if (p.id !== playerId) return p;
            return {
              ...p,
              trueRoleId: newTrueRoleId,
              perceivedRoleId: newTrueRoleId === 'drunk' ? p.perceivedRoleId : newTrueRoleId,
            };
          })
        );
        const evaluated = applyEvaluatedWinner(s, next, roundLabel);
        return {
          ...s,
          players: next,
          winner: evaluated.winner,
          storyHistory: evaluated.storyHistory,
        };
      });
    },
    [updateSession]
  );

  const handleResolveImpAttack = useCallback(
    (targetPlayerId: string): { outcomeMessage: string } => {
      const impPlayer = session.players.find((p) => p.trueRoleId === 'imp' && p.isAlive);
      const target = session.players.find((p) => p.id === targetPlayerId);
      if (!target) return { outcomeMessage: 'Target tidak ditemukan.' };

      if (impPlayer && isPlayerPoisoned(impPlayer)) {
        updateSession((s) => ({
          ...s,
          players: s.players.map((p) => ({
            ...p,
            reminders: p.reminders.filter((r) => r.reminderId !== 'die_imp'),
          })),
        }));
        return {
          outcomeMessage: `Imp (${impPlayer.name}) sedang terkena racun! Serangan gagal malam ini.`,
        };
      }

      if (impPlayer && target.id === impPlayer.id) {
        // Starpass check
        const aliveMinions = session.players.filter(
          (p) => p.isAlive && ROLE_MAP[p.trueRoleId]?.team === 'minion'
        );

        if (aliveMinions.length === 1) {
          const singleMinion = aliveMinions[0];

          updateSession((s) => {
            const roundLabel = formatSessionRoundLabel(s.phase, s.dayNumber);
            return {
              ...s,
              players: s.players.map((p) => {
                const withoutDie = p.reminders.filter((r) => r.reminderId !== 'die_imp');
                if (p.id === impPlayer.id) {
                  return {
                    ...p,
                    reminders: [
                      ...withoutDie,
                      { instanceId: `rem-die-${Date.now()}`, reminderId: 'die_imp' },
                    ],
                  };
                }
                if (p.id === singleMinion.id) {
                  return {
                    ...p,
                    trueRoleId: 'imp',
                    perceivedRoleId: 'imp',
                    reminders: [
                      ...withoutDie,
                      { instanceId: `rem-sw-imp-${Date.now()}`, reminderId: 'is_demon_sw' },
                    ],
                  };
                }
                return { ...p, reminders: withoutDie };
              }),
              storyHistory: [
                ...(s.storyHistory || []),
                makeStoryRecord(
                  roundLabel,
                  `STARPASS: Demon (${impPlayer.name}) bunuh diri. Minion ${singleMinion.name} (Kursi ${singleMinion.seatIndex + 1}) otomatis berubah menjadi IMP baru!`,
                  'starpass'
                ),
              ],
            };
          });

          return {
            outcomeMessage: `STARPASS! ${impPlayer.name} bunuh diri. ${singleMinion.name} otomatis menjadi IMP baru!`,
          };
        }

        if (aliveMinions.length > 1) {
          setStarpassPending({
            dyingDemon: impPlayer,
            aliveMinions,
          });
          return {
            outcomeMessage: `STARPASS! ${impPlayer.name} bunuh diri. Silakan pilih Minion yang mewarisi Imp pada jendela yang muncul.`,
          };
        }

        handleSetSingleReminderTarget('die_imp', impPlayer.id);
        return {
          outcomeMessage: `${impPlayer.name} bunuh diri tanpa Minion hidup tersisa! Setelah fajar, Tim Good akan menang.`,
        };
      }

      const isProtected = target.reminders.some((r) => r.reminderId === 'protected');
      if (isProtected) {
        updateSession((s) => ({
          ...s,
          players: s.players.map((p) => ({
            ...p,
            reminders: p.reminders.filter((r) => r.reminderId !== 'die_imp'),
          })),
        }));
        return {
          outcomeMessage: `${target.name} AMAN karena dilindungi Monk (Protected)!`,
        };
      }

      if (target.trueRoleId === 'soldier' && !isPlayerPoisoned(target)) {
        updateSession((s) => ({
          ...s,
          players: s.players.map((p) => ({
            ...p,
            reminders: p.reminders.filter((r) => r.reminderId !== 'die_imp'),
          })),
        }));
        return {
          outcomeMessage: `${target.name} adalah SOLDIER sehat! Serangan Imp mental.`,
        };
      }

      handleSetSingleReminderTarget('die_imp', target.id);
      return {
        outcomeMessage: `Token "Die" dipasang pada ${target.name} (Kursi ${
          target.seatIndex + 1
        }).`,
      };
    },
    [
      appendStory,
      handleSetSingleReminderTarget,
      session.dayNumber,
      session.phase,
      session.players,
      updateSession,
    ]
  );

  const handleTransitionNightToDay = useCallback(() => {
    updateSession((s) => {
      const roundLabel = formatSessionRoundLabel(s.phase, s.dayNumber);
      const victims = s.players.filter((p) =>
        p.reminders.some((r) => r.reminderId === 'die_imp')
      );
      const victimNames = victims.map((v) => v.name);

      const next = sanitizePlayerSeats(
        s.players.map((p) => {
          const diedTonight = p.reminders.some((r) => r.reminderId === 'die_imp');
          const cleaned = p.reminders.filter(
            (r) =>
              r.reminderId !== 'die_imp' &&
              r.reminderId !== 'protected' &&
              r.reminderId !== 'executed'
          );
          return {
            ...p,
            isAlive: diedTonight ? false : p.isAlive,
            deathCause: diedTonight ? ('demon' as const) : p.deathCause,
            hasGhostVote: diedTonight && p.isAlive ? true : p.hasGhostVote,
            reminders: cleaned,
          };
        })
      );

      const dawnText =
        victims.length > 0
          ? `Fajar terbit: ${victims
              .map((v) => `${v.name} (${ROLE_MAP[v.perceivedRoleId]?.name})`)
              .join(', ')} ditemukan tewas.`
          : 'Fajar terbit: Tidak ada korban tewas malam ini.';

      const story = [
        ...(s.storyHistory || []),
        makeStoryRecord(
          roundLabel,
          dawnText,
          victims.length > 0 ? 'death' : 'start'
        ),
      ];
      const evaluated = applyEvaluatedWinner(s, next, roundLabel, story);
      const nextDayNum = s.phase === 'first_night' ? 1 : Math.max(2, s.dayNumber);

      return {
        ...s,
        phase: 'day',
        dayNumber: nextDayNum,
        phaseStartedAt: Date.now(),
        executedTodayPlayerId: null,
        lastNightDeaths: victimNames,
        nominationsToday: [],
        players: next,
        winner: evaluated.winner,
        storyHistory: evaluated.storyHistory,
        gameAlertBanner: evaluated.gameAlertBanner,
      };
    });
  }, [updateSession]);

  const handleExecutePlayerInDay = useCallback(
    (playerId: string | null) => {
      if (!playerId) {
        updateSession((s) => {
          const aliveNonTravellers = countAliveNonTravellers(s.players);
          const healthyMayor = s.players.find(
            (p) =>
              p.isAlive &&
              p.trueRoleId === 'mayor' &&
              !isPlayerPoisoned(p)
          );
          if (aliveNonTravellers === 3 && healthyMayor) {
            const winMsg = `Tim Good Menang (Mayor) — Tersisa 3 pemain non-Traveller hidup tanpa eksekusi.`;
            return {
              ...s,
              winner: 'good',
              executedTodayPlayerId: null,
              gameAlertBanner: null,
              storyHistory: [
                ...(s.storyHistory || []),
                makeStoryRecord(`Siang #${s.dayNumber}`, winMsg, 'win'),
              ],
            };
          }
          return {
            ...s,
            executedTodayPlayerId: null,
          };
        });
        return;
      }

      handleKillPlayer(playerId, 'execution');
    },
    [handleKillPlayer, updateSession]
  );

  const handleTransitionDayToNextNight = useCallback(() => {
    updateSession((s) => {
      const nextDay = s.dayNumber + 1;
      return {
        ...s,
        dayNumber: nextDay,
        phase: 'other_night',
        phaseStartedAt: Date.now(),
        nominationsToday: [],
      };
    });
  }, [updateSession]);

  const handleEndGameManual = useCallback(
    (winnerChoice: 'good' | 'evil' | null) => {
      updateSession((s) => {
        const roundLabel = formatSessionRoundLabel(s.phase, s.dayNumber);
        const story = winnerChoice
          ? [
              ...(s.storyHistory || []),
              makeStoryRecord(
                roundLabel,
                `Permainan dinyatakan berakhir oleh Storyteller: Tim ${
                  winnerChoice === 'good' ? 'Good' : 'Evil'
                } Menang!`,
                'win'
              ),
            ]
          : s.storyHistory || [];
        return {
          ...s,
          winner: winnerChoice,
          gameAlertBanner: null,
          storyHistory: story,
        };
      });
    },
    [updateSession]
  );

  const handleNominatePlayer = useCallback(
    (nominatorId: string, nomineeId: string): string => {
      const currentNoms = session.nominationsToday || [];
      if (!canSeatNominate(currentNoms, nominatorId, nomineeId, session.players)) {
        return '';
      }
      const id = `nom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      updateSession((s) => {
        const current = s.nominationsToday || [];
        if (!canSeatNominate(current, nominatorId, nomineeId, s.players)) {
          return s;
        }
        const newNom: DayNomination = {
          id,
          dayNumber: s.dayNumber,
          nominatorId,
          nomineeId,
          voterIds: [],
          voteTotal: 0,
          markedForExecution: false,
        };
        return {
          ...s,
          nominationsToday: [...current, newNom],
        };
      });
      return id;
    },
    [session.nominationsToday, session.players, updateSession]
  );

  const handleToggleVoteForNomination = useCallback(
    (nominationId: string, seatId: string) => {
      updateSession((s) => {
        const seat = s.players.find((p) => p.id === seatId);
        if (!seat) return s;
        const current = s.nominationsToday || [];
        const nom = current.find((n) => n.id === nominationId);
        if (!nom || nom.cancelled) return s;

        const hasVoted = nom.voterIds.includes(seatId);
        // Prevent dead players without remaining ghost vote from adding a vote
        if (!hasVoted && !seat.isAlive && !seat.hasGhostVote) {
          return s;
        }

        const nextVoters = hasVoted
          ? nom.voterIds.filter((v) => v !== seatId)
          : [...nom.voterIds, seatId];

        const updatedPlayers = !seat.isAlive
          ? s.players.map((p) =>
              p.id === seatId ? { ...p, hasGhostVote: hasVoted ? true : false } : p
            )
          : s.players;

        const voteTotal = nextVoters.reduce(
          (sum, vid) => sum + getSeatVoteWeight(updatedPlayers.find((p) => p.id === vid)),
          0
        );

        const nextNominationsRaw = current.map((n) =>
          n.id === nominationId ? { ...n, voterIds: nextVoters, voteTotal } : n
        );
        const tieStatus = resolveVoteTieStatus(nextNominationsRaw, updatedPlayers);
        const nextNominations = tieStatus.isTie
          ? nextNominationsRaw.map((n) => ({ ...n, markedForExecution: false }))
          : nextNominationsRaw;

        return {
          ...s,
          players: updatedPlayers,
          nominationsToday: nextNominations,
        };
      });
    },
    [updateSession]
  );

  const handleResetNominationVotes = useCallback(
    (nominationId: string) => {
      updateSession((s) => {
        const current = s.nominationsToday || [];
        const nom = current.find((n) => n.id === nominationId);
        if (!nom) return s;
        const refundedSet = new Set(nom.voterIds);
        return {
          ...s,
          players: s.players.map((p) =>
            !p.isAlive && refundedSet.has(p.id) ? { ...p, hasGhostVote: true } : p
          ),
          nominationsToday: current.map((n) =>
            n.id === nominationId
              ? { ...n, voterIds: [], voteTotal: 0, markedForExecution: false }
              : n
          ),
        };
      });
    },
    [updateSession]
  );

  const handleMarkNomination = useCallback(
    (nominationId: string, mark: boolean) => {
      updateSession((s) => {
        const current = s.nominationsToday || [];
        const { nominations, isTieCleared } = applyDayNominationMark(
          current,
          nominationId,
          mark,
          s.players
        );
        return {
          ...s,
          nominationsToday: nominations,
          gameAlertBanner: isTieCleared
            ? 'SERI (TIE): Lebih dari 1 nominasi mencapai suara tertinggi yang sama — tidak ada yang dieksekusi di atas blok.'
            : s.gameAlertBanner,
        };
      });
    },
    [updateSession]
  );

  const handleCancelNomination = useCallback(
    (nominationId: string) => {
      updateSession((s) => {
        const current = s.nominationsToday || [];
        const target = current.find((n) => n.id === nominationId);
        const refundedSet = new Set(target?.voterIds || []);
        return {
          ...s,
          players: s.players.map((p) =>
            !p.isAlive && refundedSet.has(p.id) ? { ...p, hasGhostVote: true } : p
          ),
          nominationsToday: current.map((n) =>
            n.id === nominationId
              ? { ...n, cancelled: true, markedForExecution: false, voterIds: [], voteTotal: 0 }
              : n
          ),
        };
      });
    },
    [updateSession]
  );

  const handleTriggerSlayerShot = useCallback(
    (slayerPlayerId: string, targetPlayerId: string): string => {
      const shooter = session.players.find((p) => p.id === slayerPlayerId);
      const target = session.players.find((p) => p.id === targetPlayerId);
      if (!shooter || !target) return 'Pemain tidak ditemukan.';
      if (!shooter.isAlive) {
        return `Pemain yang sudah mati (${shooter.name}) tidak memiliki kemampuan Slayer.`;
      }
      if (!target.isAlive) {
        return `${target.name} sudah mati. Umumkan: "Tidak terjadi apa-apa."`;
      }

      const alreadyUsed = shooter.reminders.some((r) => r.reminderId === 'used_slayer');
      const isRealHealthySlayer =
        shooter.trueRoleId === 'slayer' &&
        !isPlayerPoisoned(shooter) &&
        !alreadyUsed;

      const isDemonTarget = ROLE_MAP[target.trueRoleId]?.team === 'demon';
      const isRecluseTarget =
        target.trueRoleId === 'recluse' && !isPlayerPoisoned(target);

      const roundLabel = `Siang #${session.dayNumber}`;
      const usedSlayerRem = {
        instanceId: `rem-slayer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        reminderId: 'used_slayer',
      };

      if (isRealHealthySlayer && isDemonTarget) {
        const aliveBeforeNonTravellers = countAliveNonTravellers(session.players);
        const healthySW = session.players.find(
          (p) =>
            p.isAlive &&
            p.id !== target.id &&
            p.trueRoleId === 'scarlet_woman' &&
            !isPlayerPoisoned(p)
        );

        updateSession((s) => {
          const next = sanitizePlayerSeats(
            s.players.map((p) => {
              let updatedP = p;
              if (p.id === shooter.id && !p.reminders.some((r) => r.reminderId === 'used_slayer')) {
                updatedP = { ...updatedP, reminders: [...updatedP.reminders, usedSlayerRem] };
              }
              if (p.id === target.id) {
                return {
                  ...updatedP,
                  isAlive: false,
                  deathCause: 'slayer' as const,
                  hasGhostVote: true,
                };
              }
              if (aliveBeforeNonTravellers >= 5 && healthySW && p.id === healthySW.id) {
                return {
                  ...updatedP,
                  trueRoleId: 'imp',
                  perceivedRoleId: 'imp',
                  reminders: [
                    ...updatedP.reminders,
                    { instanceId: `rem-sw-slay-${Date.now()}`, reminderId: 'is_demon_sw' },
                  ],
                };
              }
              return updatedP;
            })
          );

          const story = [
            ...(s.storyHistory || []),
            makeStoryRecord(
              roundLabel,
              `Slayer (${shooter.name}) menembak ${target.name}. Tembakan tepat sasaran, ${target.name} (${ROLE_MAP[target.trueRoleId]?.name}) tewas!`,
              'slayer'
            ),
            ...(aliveBeforeNonTravellers >= 5 && healthySW
              ? [
                  makeStoryRecord(
                    roundLabel,
                    `Scarlet Woman (${healthySW.name}) mewarisi tahta Demon Imp secara diam-diam!`,
                    'starpass' as const
                  ),
                ]
              : []),
          ];

          const evaluated = applyEvaluatedWinner(s, next, roundLabel, story);
          return {
            ...s,
            players: next,
            winner: evaluated.winner,
            storyHistory: evaluated.storyHistory,
            gameAlertBanner:
              aliveBeforeNonTravellers >= 5 && healthySW
                ? `TEMBAKAN SLAYER BERHASIL! ${target.name} tewas, namun Scarlet Woman (${healthySW.name}) diam-diam menjadi Imp baru!`
                : evaluated.gameAlertBanner,
          };
        });

        return `TEMBAKAN SLAYER BERHASIL! Umumkan: "${target.name} tewas seketika!"`;
      }

      updateSession((s) => ({
        ...s,
        players: s.players.map((p) => {
          if (
            p.id === shooter.id &&
            p.perceivedRoleId === 'slayer' &&
            !p.reminders.some((r) => r.reminderId === 'used_slayer')
          ) {
            return { ...p, reminders: [...p.reminders, usedSlayerRem] };
          }
          return p;
        }),
        storyHistory: [
          ...(s.storyHistory || []),
          makeStoryRecord(
            roundLabel,
            `Slayer (${shooter.name}) menembak ${target.name}. Tembakan tidak membunuh Demon.`,
            'slayer'
          ),
        ],
      }));

      if (isRealHealthySlayer && isRecluseTarget) {
        return `Target adalah RECLUSE sehat (${target.name}). Storyteller BOLEH menganggap tembakan membunuh Recluse (jika mau misregister sebagai Demon — matikan via papan Grimoire) atau umumkan "Tidak terjadi apa-apa."`;
      }

      return `Tembakan tidak membuahkan hasil. Umumkan: "Tidak terjadi apa-apa."`;
    },
    [session.dayNumber, session.players, updateSession]
  );

  const handleTriggerVirginNomination = useCallback(
    (virginPlayerId: string, nominatorPlayerId: string): string => {
      const virgin = session.players.find((p) => p.id === virginPlayerId);
      const nominator = session.players.find((p) => p.id === nominatorPlayerId);
      if (!virgin || !nominator) return 'Pemain tidak ditemukan.';
      if (!virgin.isAlive) {
        return `Virgin (${virgin.name}) sudah mati — kemampuan tidak aktif lagi.`;
      }

      const alreadyUsed = virgin.reminders.some(
        (r) => r.reminderId === 'used_virgin'
      );
      if (alreadyUsed) {
        return `Kemampuan Virgin (${virgin.name}) sudah pernah terpicu sebelumnya (hanya aktif 1x per permainan). Lanjutkan pemungutan suara seperti biasa.`;
      }

      handleAddReminder(virgin.id, 'used_virgin');

      const isRealHealthyVirgin =
        virgin.trueRoleId === 'virgin' && !isPlayerPoisoned(virgin);
      const isNominatorRealTownsfolk =
        ROLE_MAP[nominator.trueRoleId]?.team === 'townsfolk';

      if (isRealHealthyVirgin && isNominatorRealTownsfolk) {
        handleExecutePlayerInDay(nominator.id);
        return `KEMAMPUAN VIRGIN AKTIF! Karena ${nominator.name} adalah Townsfolk asli (${
          ROLE_MAP[nominator.trueRoleId]?.name
        }), umumkan: "${nominator.name} langsung dieksekusi saat ini juga!"`;
      }

      if (isRealHealthyVirgin && nominator.trueRoleId === 'spy') {
        return `Penominasi adalah SPY (${nominator.name}). Sebagai Storyteller, Anda BOLEH memilih untuk memicu kemampuan Virgin (eksekusi Spy di papan Grimoire) jika ingin menyamarkannya sebagai Townsfolk, atau biarkan tidak terpicu.`;
      }

      return `Kemampuan Virgin TIDAK terpicu. Lanjutkan pemungutan suara seperti biasa.`;
    },
    [handleAddReminder, handleExecutePlayerInDay, session.players]
  );

  const setPhase = useCallback(
    (newPhase: GamePhase) => {
      updateSession((s) => ({
        ...s,
        phase: newPhase,
        phaseStartedAt: Date.now(),
        dayNumber:
          newPhase === 'other_night' && s.phase === 'day'
            ? s.dayNumber + 1
            : newPhase === 'other_night' && s.dayNumber < 2
            ? 2
            : newPhase === 'first_night'
            ? 1
            : s.dayNumber,
      }));
    },
    [updateSession]
  );

  const setGameAlertBanner = useCallback(
    (banner: string | null) => {
      updateSession((s) => ({ ...s, gameAlertBanner: banner }));
    },
    [updateSession]
  );

  const setDemonBluffIds = useCallback(
    (action: React.SetStateAction<string[]>) => {
      updateSession((s) => ({
        ...s,
        demonBluffIds:
          typeof action === 'function' ? action(s.demonBluffIds) : action,
      }));
    },
    [updateSession]
  );

  const value = useMemo<GameContextType>(
    () => ({
      mounted,
      rooms,
      activeRoomId,
      activeRoom,
      createNewRoom,
      switchRoom,
      deleteRoom,
      renameRoom,

      hasActiveGame: session.hasActiveGame,
      playerCount: session.playerCount,
      isDrunkActive: Boolean(session.isDrunkActive),
      selectedRoleIds: session.selectedRoleIds,
      drunkFakeRoleId: session.drunkFakeRoleId,
      demonBluffIds: session.demonBluffIds,
      players: session.players,
      initialPlayers: session.initialPlayers || [],
      phase: session.phase,
      dayNumber: session.dayNumber,
      executedTodayPlayerId: session.executedTodayPlayerId,
      lastNightDeaths: session.lastNightDeaths,
      gameAlertBanner: session.gameAlertBanner,
      winner: session.winner || null,
      storyHistory: session.storyHistory || [],
      velvetColour: session.velvetColour || 'midnight',
      startedAt: session.startedAt,
      phaseStartedAt: session.phaseStartedAt,
      dayTimer: session.dayTimer === undefined ? { durationMs: 300_000, remainingMs: 300_000, deadline: null } : session.dayTimer,
      nominationsToday: session.nominationsToday || [],
      canUndo,
      canRedo,
      silentCard,
      isRefModalOpen,
      isStoryModalOpen,
      starpassPending,

      startDemoGame,
      resetSession,
      undoLastAction,
      redoLastAction,
      setVelvetColour,
      handleUpdateTimer,
      completeSetup,
      setPhase,
      setGameAlertBanner,
      setDemonBluffIds,
      setSilentCard,
      setIsRefModalOpen,
      setIsStoryModalOpen,
      handleChooseStarpassMinion,
      handleDismissStarpassModal,

      handleSwapSeats,
      handleMoveSeat,
      handleRotateRing,
      handleAddSeat,
      handleRemoveSeat,
      handleRenamePlayer,
      handleSetPlayerAlignment,
      handleKillPlayer,
      handleResurrectPlayer,
      handleChangeDeathCause,
      handleToggleAlive,
      handleToggleGhostVote,
      handleAddReminder,
      handleAddCustomNoteReminder,
      handleEditCustomNoteReminder,
      handleMoveReminder,
      handleRemoveReminder,
      handleSetSingleReminderTarget,
      handleChangePlayerTrueRole,
      handleSetDrunkPlayer,
      handleResolveImpAttack,
      handleTransitionNightToDay,
      handleTransitionDayToNextNight,
      handleExecutePlayerInDay,
      handleEndGameManual,
      handleNominatePlayer,
      handleToggleVoteForNomination,
      handleResetNominationVotes,
      handleMarkNomination,
      handleCancelNomination,
      handleTriggerSlayerShot,
      handleTriggerVirginNomination,
    }),
    [
      mounted,
      rooms,
      activeRoomId,
      activeRoom,
      createNewRoom,
      switchRoom,
      deleteRoom,
      renameRoom,
      session,
      canUndo,
      canRedo,
      silentCard,
      isRefModalOpen,
      isStoryModalOpen,
      starpassPending,
      startDemoGame,
      resetSession,
      undoLastAction,
      redoLastAction,
      setVelvetColour,
      handleUpdateTimer,
      completeSetup,
      setPhase,
      setGameAlertBanner,
      setDemonBluffIds,
      setIsStoryModalOpen,
      handleChooseStarpassMinion,
      handleDismissStarpassModal,
      handleSwapSeats,
      handleMoveSeat,
      handleRotateRing,
      handleAddSeat,
      handleRemoveSeat,
      handleRenamePlayer,
      handleSetPlayerAlignment,
      handleKillPlayer,
      handleResurrectPlayer,
      handleChangeDeathCause,
      handleToggleAlive,
      handleToggleGhostVote,
      handleAddReminder,
      handleAddCustomNoteReminder,
      handleEditCustomNoteReminder,
      handleMoveReminder,
      handleRemoveReminder,
      handleSetSingleReminderTarget,
      handleChangePlayerTrueRole,
      handleSetDrunkPlayer,
      handleResolveImpAttack,
      handleTransitionNightToDay,
      handleTransitionDayToNextNight,
      handleExecutePlayerInDay,
      handleEndGameManual,
      handleNominatePlayer,
      handleToggleVoteForNomination,
      handleResetNominationVotes,
      handleMarkNomination,
      handleCancelNomination,
      handleTriggerSlayerShot,
      handleTriggerVirginNomination,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameSession(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGameSession must be used within a GameProvider');
  }
  return ctx;
}
