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

export const GAME_STORAGE_KEY = 'botc_tb_game_session_v2';

export interface PersistedGameSession {
  hasActiveGame: boolean;
  playerCount: number;
  isDrunkActive?: boolean;
  selectedRoleIds: string[];
  drunkFakeRoleId: string | null;
  demonBluffIds: string[];
  players: PlayerSeat[];
  phase: GamePhase;
  dayNumber: number;
  executedTodayPlayerId: string | null;
  lastNightDeaths: string[];
  gameAlertBanner: string | null;
}

export interface GameContextType {
  mounted: boolean;
  hasActiveGame: boolean;
  playerCount: number;
  isDrunkActive: boolean;
  selectedRoleIds: string[];
  drunkFakeRoleId: string | null;
  demonBluffIds: string[];
  players: PlayerSeat[];
  phase: GamePhase;
  dayNumber: number;
  executedTodayPlayerId: string | null;
  lastNightDeaths: string[];
  gameAlertBanner: string | null;
  silentCard: SilentCardPayload | null;
  isRefModalOpen: boolean;

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

function loadPersistedSession(): PersistedGameSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGameSession;
    if (parsed && Array.isArray(parsed.players) && parsed.players.length >= 5) {
      return parsed;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const initialSaved = useMemo(() => loadPersistedSession(), []);

  const [hasActiveGame, setHasActiveGame] = useState<boolean>(() =>
    initialSaved ? initialSaved.hasActiveGame : false
  );
  const [playerCount, setPlayerCount] = useState<number>(() =>
    initialSaved ? initialSaved.playerCount : 8
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(() =>
    initialSaved ? initialSaved.selectedRoleIds : []
  );
  const [drunkFakeRoleId, setDrunkFakeRoleId] = useState<string | null>(() =>
    initialSaved ? initialSaved.drunkFakeRoleId : null
  );
  const [isDrunkActive, setIsDrunkActive] = useState<boolean>(() => {
    if (initialSaved) {
      return Boolean(
        initialSaved.isDrunkActive ??
          initialSaved.players.some((p) => p.trueRoleId === 'drunk')
      );
    }
    return false;
  });
  const [demonBluffIds, setDemonBluffIds] = useState<string[]>(() =>
    initialSaved ? initialSaved.demonBluffIds : []
  );
  const [players, setPlayers] = useState<PlayerSeat[]>(() =>
    initialSaved ? sanitizePlayerSeats(initialSaved.players) : []
  );
  const [phase, setPhase] = useState<GamePhase>(() =>
    initialSaved ? initialSaved.phase : 'first_night'
  );
  const [dayNumber, setDayNumber] = useState<number>(() =>
    initialSaved ? initialSaved.dayNumber : 1
  );
  const [executedTodayPlayerId, setExecutedTodayPlayerId] = useState<string | null>(() =>
    initialSaved ? initialSaved.executedTodayPlayerId : null
  );
  const [lastNightDeaths, setLastNightDeaths] = useState<string[]>(() =>
    initialSaved ? initialSaved.lastNightDeaths : []
  );
  const [gameAlertBanner, setGameAlertBanner] = useState<string | null>(() =>
    initialSaved ? initialSaved.gameAlertBanner : null
  );

  const [silentCard, setSilentCard] = useState<SilentCardPayload | null>(null);
  const [isRefModalOpen, setIsRefModalOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const payload: PersistedGameSession = {
        hasActiveGame,
        playerCount,
        isDrunkActive,
        selectedRoleIds,
        drunkFakeRoleId,
        demonBluffIds,
        players,
        phase,
        dayNumber,
        executedTodayPlayerId,
        lastNightDeaths,
        gameAlertBanner,
      };
      window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [
    mounted,
    hasActiveGame,
    playerCount,
    isDrunkActive,
    selectedRoleIds,
    drunkFakeRoleId,
    demonBluffIds,
    players,
    phase,
    dayNumber,
    executedTodayPlayerId,
    lastNightDeaths,
    gameAlertBanner,
  ]);

  const evaluateWinConditions = useCallback((updatedPlayers: PlayerSeat[], contextMsg?: string) => {
    const alive = updatedPlayers.filter((p) => p.isAlive);
    const aliveDemons = alive.filter((p) => ROLE_MAP[p.trueRoleId]?.team === 'demon');

    if (contextMsg) {
      setGameAlertBanner(contextMsg);
      return;
    }

    if (aliveDemons.length === 0) {
      setGameAlertBanner(
        'KONDISI KEMENANGAN TERCAPAI: Seluruh Demon telah mati dan tidak ada pengganti aktif. Umumkan TIM GOOD (WARGA BAIK) MENANG!'
      );
    } else if (alive.length <= 2) {
      setGameAlertBanner(
        'KONDISI KEMENANGAN TERCAPAI: Hanya tersisa 2 pemain hidup dan Demon masih bertahan. Umumkan TIM EVIL (JAHAT) MENANG!'
      );
    } else {
      setGameAlertBanner(null);
    }
  }, []);

  const startDemoGame = useCallback(() => {
    const demo = createDemoSession(8);
    setPlayerCount(demo.playerCount);
    setSelectedRoleIds(demo.selectedRoleIds);
    setDrunkFakeRoleId(demo.drunkFakeRoleId);
    setDemonBluffIds(demo.demonBluffIds);
    setPlayers(demo.players);
    setPhase('first_night');
    setDayNumber(1);
    setExecutedTodayPlayerId(null);
    setLastNightDeaths([]);
    setGameAlertBanner(null);
    setIsDrunkActive(demo.players.some((p) => p.trueRoleId === 'drunk'));
    setHasActiveGame(true);
  }, []);

  const resetSession = useCallback(() => {
    setHasActiveGame(false);
    setExecutedTodayPlayerId(null);
    setLastNightDeaths([]);
    setGameAlertBanner(null);
    try {
      window.localStorage.removeItem(GAME_STORAGE_KEY);
      window.localStorage.removeItem('botc_tb_wizard_draft_v2');
      window.localStorage.removeItem('botc_tb_setup_v4');
    } catch {
      // Ignore
    }
  }, []);

  const completeSetup = useCallback(
    (payload: {
      playerCount: number;
      isDrunkActive: boolean;
      selectedRoleIds: string[];
      drunkFakeRoleId: string | null;
      demonBluffIds: string[];
      players: PlayerSeat[];
    }) => {
      setPlayerCount(payload.playerCount);
      setIsDrunkActive(payload.isDrunkActive);
      setSelectedRoleIds(payload.selectedRoleIds);
      setDrunkFakeRoleId(payload.drunkFakeRoleId);
      setDemonBluffIds(payload.demonBluffIds);
      setPlayers(sanitizePlayerSeats(payload.players));
      setPhase('first_night');
      setDayNumber(1);
      setExecutedTodayPlayerId(null);
      setLastNightDeaths([]);
      setGameAlertBanner(null);
      setHasActiveGame(true);
    },
    []
  );

  const handleSwapSeats = useCallback((fromIdx: number, toIdx: number) => {
    setPlayers((prev) => swapPlayerSeats(prev, fromIdx, toIdx));
  }, []);

  const handleMoveSeat = useCallback((seatIdx: number, dir: 'cw' | 'ccw') => {
    setPlayers((prev) => movePlayerSeat(prev, seatIdx, dir));
  }, []);

  const handleSetDrunkPlayer = useCallback((targetPlayerId: string) => {
    setPlayers((prev) => {
      const target = prev.find((p) => p.id === targetPlayerId);
      const isAlreadyDrunk = target?.trueRoleId === 'drunk';

      const next = prev.map((p) => {
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
      return sanitizePlayerSeats(next);
    });
    setGameAlertBanner(null);
  }, []);

  const handleKillPlayer = useCallback(
    (playerId: string, cause: 'demon' | 'execution' | 'slayer') => {
      setPlayers((prev) => {
        const target = prev.find((p) => p.id === playerId);
        if (!target) return prev;

        const aliveBeforeDeath = prev.filter((p) => p.isAlive).length;

        if (cause === 'execution') {
          setExecutedTodayPlayerId(playerId);

          if (target.trueRoleId === 'saint' && !isPlayerPoisoned(target)) {
            const next = prev.map((p) => {
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
            setGameAlertBanner(
              `SAINT DIEKSEKUSI! ${target.name} adalah Saint asli yang sehat. Sesuai aturan, TIM EVIL LANGSUNG MENANG!`
            );
            return sanitizePlayerSeats(next);
          }

          const isTargetDemon = ROLE_MAP[target.trueRoleId]?.team === 'demon';
          const healthyScarletWoman = prev.find(
            (p) =>
              p.isAlive &&
              p.id !== playerId &&
              p.trueRoleId === 'scarlet_woman' &&
              !isPlayerPoisoned(p)
          );

          if (isTargetDemon && aliveBeforeDeath >= 5 && healthyScarletWoman) {
            const next = prev.map((p) => {
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
              if (p.id === healthyScarletWoman.id) {
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
            setGameAlertBanner(
              `SCARLET WOMAN AKTIF! Demon (${target.name}) dieksekusi saat ada ${aliveBeforeDeath} pemain hidup. ${healthyScarletWoman.name} otomatis berubah menjadi IMP baru!`
            );
            return sanitizePlayerSeats(next);
          }
        }

        const next = prev.map((p) => {
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
        return sanitizePlayerSeats(next);
      });
    },
    [evaluateWinConditions]
  );

  const handleResurrectPlayer = useCallback(
    (playerId: string) => {
      setPlayers((prev) => {
        const next = prev.map((p) => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            isAlive: true,
            deathCause: undefined,
          };
        });
        evaluateWinConditions(next);
        return sanitizePlayerSeats(next);
      });
      setExecutedTodayPlayerId((prev) => (prev === playerId ? null : prev));
    },
    [evaluateWinConditions]
  );

  const handleChangeDeathCause = useCallback(
    (playerId: string, cause: 'demon' | 'execution' | 'slayer') => {
      setPlayers((prev) => {
        const next = prev.map((p) => {
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
        return sanitizePlayerSeats(next);
      });

      if (cause === 'execution') {
        setExecutedTodayPlayerId(playerId);
        const target = players.find((p) => p.id === playerId);
        if (target?.trueRoleId === 'saint' && !isPlayerPoisoned(target)) {
          setGameAlertBanner(
            `SAINT DIEKSEKUSI! ${target.name} adalah Saint asli yang sehat. Sesuai aturan, TIM EVIL LANGSUNG MENANG!`
          );
        }
      } else {
        setExecutedTodayPlayerId((prev) => (prev === playerId ? null : prev));
      }
    },
    [evaluateWinConditions, players]
  );

  const handleToggleAlive = useCallback(
    (playerId: string, cause?: 'demon' | 'execution' | 'slayer') => {
      const target = players.find((p) => p.id === playerId);
      if (!target) return;
      if (target.isAlive) {
        handleKillPlayer(playerId, cause ?? 'demon');
      } else {
        handleResurrectPlayer(playerId);
      }
    },
    [handleKillPlayer, handleResurrectPlayer, players]
  );

  const handleToggleGhostVote = useCallback((playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, hasGhostVote: !p.hasGhostVote } : p
      )
    );
  }, []);

  const handleAddReminder = useCallback(
    (playerId: string, reminderId: string) => {
      if (reminderId === 'is_the_drunk') {
        handleSetDrunkPlayer(playerId);
        return;
      }

      setPlayers((prev) => {
        const next = prev.map((p) => {
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
        return sanitizePlayerSeats(next);
      });
    },
    [handleSetDrunkPlayer]
  );

  const handleSetSingleReminderTarget = useCallback((reminderId: string, targetPlayerId: string) => {
    setPlayers((prev) =>
      prev.map((p) => {
        const cleaned = p.reminders.filter((r) => r.reminderId !== reminderId);
        if (p.id !== targetPlayerId) {
          return { ...p, reminders: cleaned };
        }
        return {
          ...p,
          reminders: [
            ...cleaned,
            {
              instanceId: `rem-${reminderId}-${Date.now()}`,
              reminderId,
            },
          ],
        };
      })
    );
  }, []);

  const handleRemoveReminder = useCallback((playerId: string, instanceId: string) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? { ...p, reminders: p.reminders.filter((r) => r.instanceId !== instanceId) }
          : p
      )
    );
  }, []);

  const handleChangePlayerTrueRole = useCallback(
    (playerId: string, newTrueRoleId: string) => {
      if (newTrueRoleId === 'drunk') {
        const existingDrunk = players.find(
          (p) => p.id !== playerId && p.trueRoleId === 'drunk'
        );
        if (existingDrunk) {
          setGameAlertBanner(
            `ERROR: Hanya boleh ada 1 Drunk dalam permainan! Kursi ${existingDrunk.seatIndex + 1} (${existingDrunk.name}) sudah terdaftar sebagai Drunk.`
          );
          return;
        }
      }

      setPlayers((prev) => {
        const next = prev.map((p) => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            trueRoleId: newTrueRoleId,
            perceivedRoleId: newTrueRoleId === 'drunk' ? p.perceivedRoleId : newTrueRoleId,
          };
        });
        evaluateWinConditions(next);
        return next;
      });
    },
    [evaluateWinConditions, players]
  );

  const handleResolveImpAttack = useCallback(
    (targetPlayerId: string): { outcomeMessage: string } => {
      const impPlayer = players.find((p) => p.trueRoleId === 'imp' && p.isAlive);
      const target = players.find((p) => p.id === targetPlayerId);
      if (!target) return { outcomeMessage: 'Target tidak ditemukan.' };

      if (impPlayer && isPlayerPoisoned(impPlayer)) {
        setPlayers((prev) =>
          prev.map((p) => ({
            ...p,
            reminders: p.reminders.filter((r) => r.reminderId !== 'die_imp'),
          }))
        );
        return {
          outcomeMessage: `Imp (${impPlayer.name}) sedang terkena racun (Poisoned)! Serangan gagal, tidak ada yang mati malam ini.`,
        };
      }

      if (impPlayer && target.id === impPlayer.id) {
        const aliveMinions = players.filter(
          (p) => p.isAlive && ROLE_MAP[p.trueRoleId]?.team === 'minion'
        );
        const preferredMinion =
          aliveMinions.find((m) => m.trueRoleId === 'scarlet_woman') ??
          aliveMinions[0] ??
          null;

        setPlayers((prev) =>
          prev.map((p) => {
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
            if (preferredMinion && p.id === preferredMinion.id) {
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
          })
        );

        if (preferredMinion) {
          return {
            outcomeMessage: `STARPASS! ${impPlayer.name} bunuh diri. Minion ${preferredMinion.name} (Kursi ${
              preferredMinion.seatIndex + 1
            }) otomatis menjadi IMP baru! Bangunkan ${
              preferredMinion.name
            } dan tunjukkan kartu "ANDA ADALAH IMP".`,
          };
        }
        return {
          outcomeMessage: `${impPlayer.name} bunuh diri tanpa ada Minion hidup tersisa! Setelah fajar, Tim Good akan menang.`,
        };
      }

      const isProtectedByMonk = target.reminders.some(
        (r) => r.reminderId === 'protected'
      );
      if (isProtectedByMonk) {
        setPlayers((prev) =>
          prev.map((p) => ({
            ...p,
            reminders: p.reminders.filter((r) => r.reminderId !== 'die_imp'),
          }))
        );
        return {
          outcomeMessage: `${target.name} AMAN karena dilindungi Monk (Protected)! Tidak ada token Mati dipasang.`,
        };
      }

      if (target.trueRoleId === 'soldier' && !isPlayerPoisoned(target)) {
        setPlayers((prev) =>
          prev.map((p) => ({
            ...p,
            reminders: p.reminders.filter((r) => r.reminderId !== 'die_imp'),
          }))
        );
        return {
          outcomeMessage: `${target.name} adalah SOLDIER asli yang sehat! Serangan Imp mental dan tidak ada yang mati malam ini.`,
        };
      }

      handleSetSingleReminderTarget('die_imp', target.id);
      return {
        outcomeMessage: `Token "Die" dipasang pada ${target.name} (Kursi ${
          target.seatIndex + 1
        }). Ia akan diumumkan tewas saat Fajar.`,
      };
    },
    [handleSetSingleReminderTarget, players]
  );

  const handleTransitionNightToDay = useCallback(() => {
    const victims = players.filter((p) =>
      p.reminders.some((r) => r.reminderId === 'die_imp')
    );
    const victimNames = victims.map((v) => v.name);

    setPlayers((prev) => {
      const next = prev.map((p) => {
        const diedTonight = p.reminders.some((r) => r.reminderId === 'die_imp');
        const cleanedReminders = p.reminders.filter(
          (r) =>
            r.reminderId !== 'die_imp' &&
            r.reminderId !== 'protected' &&
            r.reminderId !== 'executed'
        );
        return {
          ...p,
          isAlive: diedTonight ? false : p.isAlive,
          deathCause: diedTonight ? ('demon' as const) : p.deathCause,
          reminders: cleanedReminders,
        };
      });
      evaluateWinConditions(next);
      return next;
    });

    setLastNightDeaths(victimNames);
    setExecutedTodayPlayerId(null);
    setPhase('day');
  }, [evaluateWinConditions, players]);

  const handleExecutePlayerInDay = useCallback(
    (playerId: string | null) => {
      if (!playerId) {
        setExecutedTodayPlayerId(null);
        const alive = players.filter((p) => p.isAlive);
        const healthyMayor = alive.find(
          (p) => p.trueRoleId === 'mayor' && !isPlayerPoisoned(p)
        );
        if (alive.length === 3 && healthyMayor) {
          setGameAlertBanner(
            `KEMENANGAN MAYOR! Tersisa 3 pemain hidup tanpa eksekusi hari ini dan ${healthyMayor.name} adalah Mayor yang sehat. TIM GOOD MENANG!`
          );
        }
        return;
      }
      handleKillPlayer(playerId, 'execution');
    },
    [handleKillPlayer, players]
  );

  const handleTransitionDayToNextNight = useCallback(() => {
    setDayNumber((prev) => prev + 1);
    setPhase('other_night');
  }, []);

  const handleTriggerSlayerShot = useCallback(
    (slayerPlayerId: string, targetPlayerId: string): string => {
      const shooter = players.find((p) => p.id === slayerPlayerId);
      const target = players.find((p) => p.id === targetPlayerId);
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
        const aliveCountNow = players.filter((p) => p.isAlive).length;
        const healthySW = players.find(
          (p) =>
            p.isAlive &&
            p.id !== target.id &&
            p.trueRoleId === 'scarlet_woman' &&
            !isPlayerPoisoned(p)
        );

        setPlayers((prev) => {
          const next = prev.map((p) => {
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
              ? `TEMBAKAN SLAYER TEPAT SASARAN! ${target.name} tewas, namun Scarlet Woman (${healthySW.name}) diam-diam menjadi Imp baru!`
              : undefined
          );
          return next;
        });

        return `TEMBAKAN SLAYER BERHASIL! Umumkan kepada warga: "${target.name} tewas seketika!"`;
      }

      return `Tembakan tidak membuahkan hasil. Umumkan kepada warga: "Tidak terjadi apa-apa."`;
    },
    [evaluateWinConditions, handleAddReminder, players]
  );

  const handleTriggerVirginNomination = useCallback(
    (virginPlayerId: string, nominatorPlayerId: string): string => {
      const virgin = players.find((p) => p.id === virginPlayerId);
      const nominator = players.find((p) => p.id === nominatorPlayerId);
      if (!virgin || !nominator) return 'Pemain tidak ditemukan.';

      handleAddReminder(virgin.id, 'used_virgin');

      const isRealHealthyVirgin =
        virgin.trueRoleId === 'virgin' && !isPlayerPoisoned(virgin);
      const isNominatorRealTownsfolk =
        ROLE_MAP[nominator.trueRoleId]?.team === 'townsfolk';

      if (isRealHealthyVirgin && isNominatorRealTownsfolk) {
        handleExecutePlayerInDay(nominator.id);
        return `KEMAMPUAN VIRGIN AKTIF! Karena ${nominator.name} adalah Townsfolk asli (${
          ROLE_MAP[nominator.trueRoleId]?.name
        }), umumkan: "${nominator.name} langsung dieksekusi saat ini juga dan sidang siang hari berakhir!"`;
      }

      return `Kemampuan Virgin TIDAK terpicu (Virgin kini diberi token Used). Lanjutkan pemungutan suara terhadap ${virgin.name} seperti biasa.`;
    },
    [handleAddReminder, handleExecutePlayerInDay, players]
  );

  const value = useMemo<GameContextType>(
    () => ({
      mounted,
      hasActiveGame,
      playerCount,
      isDrunkActive,
      selectedRoleIds,
      drunkFakeRoleId,
      demonBluffIds,
      players,
      phase,
      dayNumber,
      executedTodayPlayerId,
      lastNightDeaths,
      gameAlertBanner,
      silentCard,
      isRefModalOpen,

      startDemoGame,
      resetSession,
      completeSetup,
      setPhase,
      setGameAlertBanner,
      setDemonBluffIds,
      setSilentCard,
      setIsRefModalOpen,

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
      hasActiveGame,
      playerCount,
      isDrunkActive,
      selectedRoleIds,
      drunkFakeRoleId,
      demonBluffIds,
      players,
      phase,
      dayNumber,
      executedTodayPlayerId,
      lastNightDeaths,
      gameAlertBanner,
      silentCard,
      isRefModalOpen,

      startDemoGame,
      resetSession,
      completeSetup,
      setPhase,
      setGameAlertBanner,
      setDemonBluffIds,
      setSilentCard,
      setIsRefModalOpen,

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

