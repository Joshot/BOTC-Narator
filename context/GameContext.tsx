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
  GamePhase,
  PlayerSeat,
  createDemoSession,
  isPlayerPoisoned,
  movePlayerSeat,
  sanitizePlayerSeats,
  swapPlayerSeats,
} from '@/lib/botc-engine';
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
  silentCard: SilentCardPayload | null;
  isRefModalOpen: boolean;
  isStoryModalOpen: boolean;
  starpassPending: StarpassPendingData | null;

  // Actions
  startDemoGame: () => void;
  resetSession: () => void;
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
  handleKillPlayer: (playerId: string, cause: 'demon' | 'execution' | 'slayer') => void;
  handleResurrectPlayer: (playerId: string) => void;
  handleChangeDeathCause: (playerId: string, cause: 'demon' | 'execution' | 'slayer') => void;
  handleToggleAlive: (playerId: string, cause?: 'demon' | 'execution' | 'slayer') => void;
  handleToggleGhostVote: (playerId: string) => void;
  handleAddReminder: (playerId: string, reminderId: string) => void;
  handleRemoveReminder: (playerId: string, instanceId: string) => void;
  handleSetSingleReminderTarget: (reminderId: string, targetPlayerId: string) => void;
  handleChangePlayerTrueRole: (playerId: string, newTrueRoleId: string) => void;
  handleSetDrunkPlayer: (playerId: string) => void;
  handleResolveImpAttack: (targetPlayerId: string) => { outcomeMessage: string };
  handleTransitionNightToDay: () => void;
  handleTransitionDayToNextNight: () => void;
  handleExecutePlayerInDay: (playerId: string | null) => void;
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
    (updater: (prev: PersistedGameSession) => PersistedGameSession) => {
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

      const currentPhaseName =
        session.phase === 'first_night'
          ? 'Malam Pertama'
          : session.phase === 'day'
          ? `Siang Hari #${session.dayNumber}`
          : `Malam #${session.dayNumber + 1}`;

      if (aliveDemons.length === 0) {
        const msg =
          'KONDISI KEMENANGAN: Seluruh Demon telah mati dan tidak ada pengganti aktif. TIM GOOD (WARGA BAIK) MENANG!';
        updateSession((s) => ({
          ...s,
          winner: 'good',
          gameAlertBanner: msg,
        }));
        appendStory(currentPhaseName, msg, 'win');
        setIsStoryModalOpen(true);
      } else if (alive.length <= 2) {
        const msg =
          'KONDISI KEMENANGAN: Hanya tersisa 2 pemain hidup dan Demon masih bertahan. TIM EVIL (JAHAT) MENANG!';
        updateSession((s) => ({
          ...s,
          winner: 'evil',
          gameAlertBanner: msg,
        }));
        appendStory(currentPhaseName, msg, 'win');
        setIsStoryModalOpen(true);
      } else {
        updateSession((s) => ({ ...s, gameAlertBanner: null }));
      }
    },
    [appendStory, session.dayNumber, session.phase, updateSession]
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
    updateSession(() => ({
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
    }));
  }, [updateSession]);

  const resetSession = useCallback(() => {
    updateSession(() => createEmptySession(activeRoom.name));
    setStarpassPending(null);
  }, [activeRoom.name, updateSession]);

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
      }));
    },
    [updateSession]
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
      const chosen = session.players.find((p) => p.id === chosenMinionId);
      if (!chosen) return;

      const currentRoundLabel =
        session.phase === 'first_night'
          ? 'Malam Pertama'
          : session.phase === 'day'
          ? `Siang #${session.dayNumber}`
          : `Malam #${session.dayNumber + 1}`;

      updateSession((s) => {
        const next = s.players.map((p) => {
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
        });

        return {
          ...s,
          players: sanitizePlayerSeats(next),
          gameAlertBanner: `STARPASS SELESAI! ${chosen.name} (Kursi ${
            chosen.seatIndex + 1
          }) sekarang adalah IMP baru!`,
        };
      });

      appendStory(
        currentRoundLabel,
        `Demon bunuh diri (Starpass). Minion ${chosen.name} (Kursi ${
          chosen.seatIndex + 1
        }) dipilih menjadi IMP baru.`,
        'starpass'
      );

      setStarpassPending(null);
    },
    [appendStory, session.dayNumber, session.phase, session.players, updateSession]
  );

  const handleDismissStarpassModal = useCallback(() => {
    setStarpassPending(null);
  }, []);

  const handleKillPlayer = useCallback(
    (playerId: string, cause: 'demon' | 'execution' | 'slayer') => {
      const target = session.players.find((p) => p.id === playerId);
      if (!target) return;

      const currentRoundLabel =
        session.phase === 'first_night'
          ? 'Malam Pertama'
          : session.phase === 'day'
          ? `Siang #${session.dayNumber}`
          : `Malam #${session.dayNumber + 1}`;

      const roleName = ROLE_MAP[target.perceivedRoleId]?.name || 'Unknown';
      const trueRoleName = ROLE_MAP[target.trueRoleId]?.name || 'Unknown';
      const isTargetDemon = ROLE_MAP[target.trueRoleId]?.team === 'demon';

      // Record in story history
      if (cause === 'execution') {
        appendStory(
          currentRoundLabel,
          `${target.name} (${roleName}) dieksekusi mati oleh warga kota.`,
          'execution'
        );
      } else if (cause === 'slayer') {
        appendStory(
          currentRoundLabel,
          `${target.name} (${roleName}) tewas seketika akibat tembakan Slayer!`,
          'slayer'
        );
      } else if (isTargetDemon && cause === 'demon') {
        appendStory(
          currentRoundLabel,
          `STARPASS: Demon ${target.name} (${roleName}) sengaja melakukan bunuh diri malam ini untuk mengalihkan kekuatan Imp ke Minion!`,
          'starpass'
        );
      } else {
        appendStory(
          currentRoundLabel,
          `${target.name} (${roleName}) tewas diserang oleh Demon malam ini.`,
          'death'
        );
      }

      // Check for Demon Suicide / Starpass
      if (isTargetDemon && cause === 'demon') {
        const aliveMinions = session.players.filter(
          (p) => p.isAlive && p.id !== playerId && ROLE_MAP[p.trueRoleId]?.team === 'minion'
        );

        if (aliveMinions.length === 1) {
          // Exactly 1 alive minion -> auto becomes Imp!
          const singleMinion = aliveMinions[0];
          updateSession((s) => {
            const next = s.players.map((p) => {
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
            });
            return {
              ...s,
              players: sanitizePlayerSeats(next),
              gameAlertBanner: `STARPASS! Demon (${target.name}) bunuh diri. Minion ${singleMinion.name} (Kursi ${singleMinion.seatIndex + 1}) otomatis berubah menjadi IMP baru!`,
            };
          });

          appendStory(
            currentRoundLabel,
            `Pewarisan Imp Berhasil: Karena hanya ada 1 Minion hidup (${singleMinion.name} - Kursi ${singleMinion.seatIndex + 1}), ia otomatis mewarisi tahta dan resmi menjadi IMP baru!`,
            'starpass'
          );
          return;
        }

        if (aliveMinions.length > 1) {
          // Multiple alive minions -> trigger in-app selection modal!
          updateSession((s) => {
            const next = s.players.map((p) => {
              if (p.id === playerId) {
                return {
                  ...p,
                  isAlive: false,
                  deathCause: 'demon' as const,
                  hasGhostVote: true,
                };
              }
              return p;
            });
            return {
              ...s,
              players: sanitizePlayerSeats(next),
            };
          });

          appendStory(
            currentRoundLabel,
            `Pewarisan Imp: Terdapat ${aliveMinions.length} Minion hidup (${aliveMinions.map(m => m.name).join(', ')}). Storyteller membuka pemilihan Minion pewaris Imp.`,
            'starpass'
          );

          setStarpassPending({
            dyingDemon: target,
            aliveMinions,
          });
          return;
        }
      }

      updateSession((s) => {
        const aliveBefore = s.players.filter((p) => p.isAlive).length;

        if (cause === 'execution') {
          // Saint check
          if (target.trueRoleId === 'saint' && !isPlayerPoisoned(target)) {
            const next = s.players.map((p) => {
              const cleaned = p.reminders.filter((r) => r.reminderId !== 'executed');
              if (p.id !== playerId) return { ...p, reminders: cleaned };
              return {
                ...p,
                isAlive: false,
                deathCause: 'execution' as const,
                hasGhostVote: true,
                reminders: cleaned,
              };
            });
            const winMsg = `SAINT DIEKSEKUSI! ${target.name} adalah Saint asli yang sehat. Sesuai aturan, TIM EVIL LANGSUNG MENANG!`;
            appendStory(currentRoundLabel, winMsg, 'win');
            setIsStoryModalOpen(true);
            return {
              ...s,
              winner: 'evil',
              executedTodayPlayerId: playerId,
              players: sanitizePlayerSeats(next),
              gameAlertBanner: winMsg,
            };
          }

          // Scarlet Woman check on Demon execution
          const healthySW = s.players.find(
            (p) =>
              p.isAlive &&
              p.id !== playerId &&
              p.trueRoleId === 'scarlet_woman' &&
              !isPlayerPoisoned(p)
          );

          if (isTargetDemon && aliveBefore >= 5 && healthySW) {
            const next = s.players.map((p) => {
              const cleaned = p.reminders.filter((r) => r.reminderId !== 'executed');
              if (p.id === playerId) {
                return {
                  ...p,
                  isAlive: false,
                  deathCause: 'execution' as const,
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
            });

            appendStory(
              currentRoundLabel,
              `Demon (${target.name}) dieksekusi saat ada ${aliveBefore} pemain hidup. Scarlet Woman (${healthySW.name}) otomatis berubah menjadi IMP baru!`,
              'starpass'
            );

            return {
              ...s,
              executedTodayPlayerId: playerId,
              players: sanitizePlayerSeats(next),
              gameAlertBanner: `SCARLET WOMAN AKTIF! Demon (${target.name}) dieksekusi saat ada ${aliveBefore} pemain hidup. ${healthySW.name} otomatis berubah menjadi IMP baru!`,
            };
          }
        }

        const next = s.players.map((p) => {
          const cleaned = p.reminders.filter((r) => r.reminderId !== 'executed');
          if (p.id !== playerId) return { ...p, reminders: cleaned };
          return {
            ...p,
            isAlive: false,
            deathCause: cause,
            hasGhostVote: true,
            reminders: cleaned,
          };
        });

        evaluateWinConditions(next);
        return {
          ...s,
          executedTodayPlayerId: cause === 'execution' ? playerId : s.executedTodayPlayerId,
          players: sanitizePlayerSeats(next),
        };
      });
    },
    [appendStory, evaluateWinConditions, session.dayNumber, session.phase, session.players, updateSession]
  );

  const handleResurrectPlayer = useCallback(
    (playerId: string) => {
      const target = session.players.find((p) => p.id === playerId);
      if (!target) return;

      const currentRoundLabel =
        session.phase === 'first_night'
          ? 'Malam Pertama'
          : session.phase === 'day'
          ? `Siang #${session.dayNumber}`
          : `Malam #${session.dayNumber + 1}`;

      appendStory(
        currentRoundLabel,
        `${target.name} (${ROLE_MAP[target.perceivedRoleId]?.name}) dihidupkan kembali oleh Storyteller.`,
        'start'
      );

      updateSession((s) => {
        const next = s.players.map((p) => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            isAlive: true,
            deathCause: undefined,
          };
        });
        evaluateWinConditions(next);
        return {
          ...s,
          executedTodayPlayerId:
            s.executedTodayPlayerId === playerId ? null : s.executedTodayPlayerId,
          players: sanitizePlayerSeats(next),
        };
      });
    },
    [appendStory, evaluateWinConditions, session.dayNumber, session.phase, session.players, updateSession]
  );

  const handleChangeDeathCause = useCallback(
    (playerId: string, cause: 'demon' | 'execution' | 'slayer') => {
      updateSession((s) => {
        const next = s.players.map((p) => {
          const cleaned = p.reminders.filter((r) => r.reminderId !== 'executed');
          if (p.id !== playerId) return { ...p, reminders: cleaned };
          return {
            ...p,
            isAlive: false,
            deathCause: cause,
            reminders: cleaned,
          };
        });
        evaluateWinConditions(next);
        return {
          ...s,
          executedTodayPlayerId: cause === 'execution' ? playerId : s.executedTodayPlayerId,
          players: sanitizePlayerSeats(next),
        };
      });
    },
    [evaluateWinConditions, updateSession]
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
        players: s.players.map((p) => {
          const cleaned = p.reminders.filter((r) => r.reminderId !== reminderId);
          if (p.id !== targetPlayerId) {
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

        const next = s.players.map((p) => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            trueRoleId: newTrueRoleId,
            perceivedRoleId: newTrueRoleId === 'drunk' ? p.perceivedRoleId : newTrueRoleId,
          };
        });
        evaluateWinConditions(next);
        return { ...s, players: next };
      });
    },
    [evaluateWinConditions, updateSession]
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
          updateSession((s) => ({
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
          }));

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
    [handleSetSingleReminderTarget, session.players, updateSession]
  );

  const handleTransitionNightToDay = useCallback(() => {
    updateSession((s) => {
      const victims = s.players.filter((p) =>
        p.reminders.some((r) => r.reminderId === 'die_imp')
      );
      const victimNames = victims.map((v) => v.name);

      const next = s.players.map((p) => {
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
          reminders: cleaned,
        };
      });

      evaluateWinConditions(next);
      return {
        ...s,
        phase: 'day',
        executedTodayPlayerId: null,
        lastNightDeaths: victimNames,
        players: sanitizePlayerSeats(next),
      };
    });

    const currentNightLabel =
      session.phase === 'first_night'
        ? 'Malam Pertama'
        : `Malam #${session.dayNumber + 1}`;

    const victims = session.players.filter((p) =>
      p.reminders.some((r) => r.reminderId === 'die_imp')
    );

    if (victims.length > 0) {
      appendStory(
        currentNightLabel,
        `Fajar terbit: ${victims
          .map((v) => `${v.name} (${ROLE_MAP[v.perceivedRoleId]?.name})`)
          .join(', ')} ditemukan tewas.`,
        'death'
      );
    } else {
      appendStory(
        currentNightLabel,
        `Fajar terbit: Tidak ada korban tewas malam ini.`,
        'start'
      );
    }
  }, [appendStory, evaluateWinConditions, session.dayNumber, session.phase, session.players, updateSession]);

  const handleExecutePlayerInDay = useCallback(
    (playerId: string | null) => {
      if (!playerId) {
        updateSession((s) => {
          const alive = s.players.filter((p) => p.isAlive);
          const healthyMayor = alive.find(
            (p) => p.trueRoleId === 'mayor' && !isPlayerPoisoned(p)
          );
          if (alive.length === 3 && healthyMayor) {
            const winMsg = `KEMENANGAN MAYOR! Tersisa 3 pemain hidup tanpa eksekusi dan ${healthyMayor.name} adalah Mayor sehat. TIM GOOD MENANG!`;
            appendStory(`Siang #${session.dayNumber}`, winMsg, 'win');
            setIsStoryModalOpen(true);
            return {
              ...s,
              winner: 'good',
              executedTodayPlayerId: null,
              gameAlertBanner: winMsg,
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
    [appendStory, handleKillPlayer, session.dayNumber, updateSession]
  );

  const handleTransitionDayToNextNight = useCallback(() => {
    updateSession((s) => ({
      ...s,
      dayNumber: s.dayNumber + 1,
      phase: 'other_night',
    }));
  }, [updateSession]);

  const handleTriggerSlayerShot = useCallback(
    (slayerPlayerId: string, targetPlayerId: string): string => {
      const shooter = session.players.find((p) => p.id === slayerPlayerId);
      const target = session.players.find((p) => p.id === targetPlayerId);
      if (!shooter || !target) return 'Pemain tidak ditemukan.';

      if (shooter.perceivedRoleId === 'slayer') {
        handleAddReminder(shooter.id, 'used_slayer');
      }

      const isRealHealthySlayer =
        shooter.trueRoleId === 'slayer' &&
        !isPlayerPoisoned(shooter) &&
        !shooter.reminders.some((r) => r.reminderId === 'used_slayer');

      const isDemonTarget = ROLE_MAP[target.trueRoleId]?.team === 'demon';

      if (isRealHealthySlayer && isDemonTarget) {
        const aliveCountNow = session.players.filter((p) => p.isAlive).length;
        const healthySW = session.players.find(
          (p) =>
            p.isAlive &&
            p.id !== target.id &&
            p.trueRoleId === 'scarlet_woman' &&
            !isPlayerPoisoned(p)
        );

        appendStory(
          `Siang #${session.dayNumber}`,
          `Slayer (${shooter.name}) menembak ${target.name}. Tembakan tepat sasaran, ${target.name} (${ROLE_MAP[target.trueRoleId]?.name}) tewas!`,
          'slayer'
        );

        updateSession((s) => {
          const next = s.players.map((p) => {
            if (p.id === target.id)
              return { ...p, isAlive: false, deathCause: 'slayer' as const };
            if (aliveCountNow >= 5 && healthySW && p.id === healthySW.id) {
              return {
                ...p,
                trueRoleId: 'imp',
                perceivedRoleId: 'imp',
                reminders: [
                  ...p.reminders,
                  { instanceId: `rem-sw-slay-${Date.now()}`, reminderId: 'is_demon_sw' },
                ],
              };
            }
            return p;
          });
          evaluateWinConditions(
            next,
            aliveCountNow >= 5 && healthySW
              ? `TEMBAKAN SLAYER BERHASIL! ${target.name} tewas, namun Scarlet Woman (${healthySW.name}) diam-diam menjadi Imp baru!`
              : undefined
          );
          return { ...s, players: next };
        });

        return `TEMBAKAN SLAYER BERHASIL! Umumkan: "${target.name} tewas seketika!"`;
      }

      appendStory(
        `Siang #${session.dayNumber}`,
        `Slayer (${shooter.name}) menembak ${target.name}. Tembakan meleset atau target bukan Demon.`,
        'slayer'
      );
      return `Tembakan tidak membuahkan hasil. Umumkan: "Tidak terjadi apa-apa."`;
    },
    [appendStory, evaluateWinConditions, handleAddReminder, session.dayNumber, session.players, updateSession]
  );

  const handleTriggerVirginNomination = useCallback(
    (virginPlayerId: string, nominatorPlayerId: string): string => {
      const virgin = session.players.find((p) => p.id === virginPlayerId);
      const nominator = session.players.find((p) => p.id === nominatorPlayerId);
      if (!virgin || !nominator) return 'Pemain tidak ditemukan.';

      handleAddReminder(virgin.id, 'used_virgin');

      const isRealHealthyVirgin =
        virgin.trueRoleId === 'virgin' && !isPlayerPoisoned(virgin);
      const isNominatorRealTownsfolk =
        ROLE_MAP[nominator.trueRoleId]?.team === 'townsfolk';

      if (isRealHealthyVirgin && isNominatorRealTownsfolk) {
        handleExecutePlayerInDay(nominator.id);
        appendStory(
          `Siang #${session.dayNumber}`,
          `Kemampuan Virgin aktif! ${nominator.name} (Townsfolk asli: ${
            ROLE_MAP[nominator.trueRoleId]?.name
          }) langsung dieksekusi mati setelah menominasikan Virgin (${virgin.name}).`,
          'execution'
        );
        return `KEMAMPUAN VIRGIN AKTIF! Karena ${nominator.name} adalah Townsfolk asli (${
          ROLE_MAP[nominator.trueRoleId]?.name
        }), umumkan: "${nominator.name} langsung dieksekusi saat ini juga!"`;
      }

      return `Kemampuan Virgin TIDAK terpicu. Lanjutkan pemungutan suara seperti biasa.`;
    },
    [appendStory, handleAddReminder, handleExecutePlayerInDay, session.dayNumber, session.players]
  );

  const setPhase = useCallback(
    (newPhase: GamePhase) => {
      updateSession((s) => ({ ...s, phase: newPhase }));
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
      silentCard,
      isRefModalOpen,
      isStoryModalOpen,
      starpassPending,

      startDemoGame,
      resetSession,
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
      handleKillPlayer,
      handleResurrectPlayer,
      handleChangeDeathCause,
      handleToggleAlive,
      handleToggleGhostVote,
      handleAddReminder,
      handleRemoveReminder,
      handleSetSingleReminderTarget,
      handleChangePlayerTrueRole,
      handleSetDrunkPlayer,
      handleResolveImpAttack,
      handleTransitionNightToDay,
      handleTransitionDayToNextNight,
      handleExecutePlayerInDay,
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
      silentCard,
      isRefModalOpen,
      isStoryModalOpen,
      starpassPending,
      startDemoGame,
      resetSession,
      completeSetup,
      setPhase,
      setGameAlertBanner,
      setDemonBluffIds,
      setIsStoryModalOpen,
      handleChooseStarpassMinion,
      handleDismissStarpassModal,
      handleSwapSeats,
      handleMoveSeat,
      handleKillPlayer,
      handleResurrectPlayer,
      handleChangeDeathCause,
      handleToggleAlive,
      handleToggleGhostVote,
      handleAddReminder,
      handleRemoveReminder,
      handleSetSingleReminderTarget,
      handleChangePlayerTrueRole,
      handleSetDrunkPlayer,
      handleResolveImpAttack,
      handleTransitionNightToDay,
      handleTransitionDayToNextNight,
      handleExecutePlayerInDay,
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
