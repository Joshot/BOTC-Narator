'use client';

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  BookMarked,
  Compass,
  Home,
  Moon,
  RotateCcw,
  Sun,
  Swords,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ROLE_MAP } from '@/lib/botc-data';
import {
  GamePhase,
  PlayerSeat,
  createDemoSession,
  isPlayerPoisoned,
  movePlayerSeat,
  swapPlayerSeats,
  sanitizePlayerSeats,
} from '@/lib/botc-engine';
import DashboardView from './DashboardView';
import SetupWizard from './SetupWizard';
import GrimoireBoard from './GrimoireBoard';
import EvilAndBluffsView from './EvilAndBluffsView';
import NarratorView from './NarratorView';
import FullscreenCardModal, { SilentCardPayload } from './FullscreenCardModal';
import ReferenceSheetModal from './ReferenceSheetModal';
import WebPlayMode from './WebPlayMode';

export type AppView = 'dashboard' | 'setup' | 'grimoire' | 'evil' | 'narrator' | 'webplay';

const GAME_STORAGE_KEY = 'botc_tb_game_session_v2';

interface PersistedGameSession {
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

function parseUrlParams(): { view: AppView; step: 1 | 2 | 3 } {
  if (typeof window === 'undefined') {
    return { view: 'dashboard', step: 1 };
  }
  const params = new URLSearchParams(window.location.search);
  const rawView = params.get('view');
  const rawStep = params.get('step');

  let view: AppView = 'dashboard';
  if (
    rawView === 'setup' ||
    rawView === 'webplay' ||
    rawView === 'grimoire' ||
    rawView === 'evil' ||
    rawView === 'narrator' ||
    rawView === 'dashboard'
  ) {
    view = rawView;
  }

  let step: 1 | 2 | 3 = 1;
  if (rawStep === '2') step = 2;
  else if (rawStep === '3') step = 3;

  return { view, step };
}

function loadInitialGameSession(): PersistedGameSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGameSession;
    if (parsed && Array.isArray(parsed.players) && parsed.players.length >= 5) {
      return parsed;
    }
  } catch {
    // Ignore error
  }
  return null;
}

export default function StorytellerApp({
  autoStartFromQuery = false,
}: {
  autoStartFromQuery?: boolean;
}) {
  const initialDemo = useMemo(
    () => (autoStartFromQuery ? createDemoSession(8) : null),
    [autoStartFromQuery]
  );
  const initialSaved = useMemo(() => loadInitialGameSession(), []);

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (autoStartFromQuery) return 'grimoire';
    if (typeof window !== 'undefined') {
      const { view } = parseUrlParams();
      if (view === 'setup' || view === 'dashboard' || view === 'webplay') return view;
      if (initialSaved?.hasActiveGame) return view;
      return 'dashboard';
    }
    return 'dashboard';
  });

  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(() => {
    if (typeof window !== 'undefined') {
      return parseUrlParams().step;
    }
    return 1;
  });

  const [hasActiveGame, setHasActiveGame] = useState<boolean>(() => {
    if (autoStartFromQuery) return true;
    return initialSaved ? initialSaved.hasActiveGame : false;
  });
  const [playerCount, setPlayerCount] = useState<number>(() => {
    if (initialSaved) return initialSaved.playerCount;
    return initialDemo ? initialDemo.playerCount : 8;
  });
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(() => {
    if (initialSaved) return initialSaved.selectedRoleIds;
    return initialDemo ? initialDemo.selectedRoleIds : [];
  });
  const [drunkFakeRoleId, setDrunkFakeRoleId] = useState<string | null>(() => {
    if (initialSaved) return initialSaved.drunkFakeRoleId;
    return initialDemo ? initialDemo.drunkFakeRoleId : null;
  });
  const [isDrunkActive, setIsDrunkActive] = useState<boolean>(() => {
    if (initialSaved) return Boolean(initialSaved.isDrunkActive ?? initialSaved.players.some((p) => p.trueRoleId === 'drunk'));
    return initialDemo ? initialDemo.players.some((p) => p.trueRoleId === 'drunk') : false;
  });
  const [demonBluffIds, setDemonBluffIds] = useState<string[]>(() => {
    if (initialSaved) return initialSaved.demonBluffIds;
    return initialDemo ? initialDemo.demonBluffIds : [];
  });
  const [players, setPlayers] = useState<PlayerSeat[]>(() => {
    if (initialSaved) return sanitizePlayerSeats(initialSaved.players);
    return initialDemo ? sanitizePlayerSeats(initialDemo.players) : [];
  });
  const [phase, setPhase] = useState<GamePhase>(() => {
    if (initialSaved) return initialSaved.phase;
    return 'first_night';
  });
  const [dayNumber, setDayNumber] = useState<number>(() => {
    if (initialSaved) return initialSaved.dayNumber;
    return 1;
  });
  const [executedTodayPlayerId, setExecutedTodayPlayerId] = useState<string | null>(
    () => (initialSaved ? initialSaved.executedTodayPlayerId : null)
  );
  const [lastNightDeaths, setLastNightDeaths] = useState<string[]>(
    () => (initialSaved ? initialSaved.lastNightDeaths : [])
  );
  const [gameAlertBanner, setGameAlertBanner] = useState<string | null>(
    () => (initialSaved ? initialSaved.gameAlertBanner : null)
  );

  const [silentCard, setSilentCard] = useState<SilentCardPayload | null>(null);
  const [isRefModalOpen, setIsRefModalOpen] = useState<boolean>(false);
  const [hydrated] = useState<boolean>(true);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Sync URL search params helper with pushState / replaceState
  const syncUrlParams = useCallback(
    (view: AppView, step?: 1 | 2 | 3, replace = false) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      params.set('view', view);
      if (view === 'setup') {
        params.set('step', String(step ?? setupStep));
      } else {
        params.delete('step');
      }
      const newQuery = params.toString();
      const newUrl = newQuery ? `?${newQuery}` : window.location.pathname;

      if (replace) {
        window.history.replaceState({ view, step }, '', newUrl);
      } else {
        window.history.pushState({ view, step }, '', newUrl);
      }
    },
    [setupStep]
  );

  const navigateToView = useCallback(
    (targetView: AppView, targetStep?: 1 | 2 | 3) => {
      setCurrentView(targetView);
      if (targetStep) setSetupStep(targetStep);
      syncUrlParams(targetView, targetStep);
    },
    [syncUrlParams]
  );

  // Listen to browser forward/back buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const { view, step } = parseUrlParams();
      setCurrentView(view);
      setSetupStep(step);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const saveSessionDirectly = useCallback((payload: PersistedGameSession) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Keep body dataset state in sync with game status
  useEffect(() => {
    document.body.dataset.state = hasActiveGame ? 'playing' : 'title';
  }, [hasActiveGame]);

  // 2. Persist active game session to localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return;
    document.body.dataset.state = hasActiveGame ? 'playing' : 'title';
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
      // Ignore storage quota errors
    }
  }, [
    hydrated,
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

  const handleSetDrunkPlayer = (targetPlayerId: string) => {
    setPlayers((prev) => {
      const target = prev.find((p) => p.id === targetPlayerId);
      const isAlreadyDrunk = target?.trueRoleId === 'drunk';

      const next = prev.map((p) => {
        const withoutDrunkRem = p.reminders.filter((r) => r.reminderId !== 'is_the_drunk');
        if (p.id === targetPlayerId) {
          if (isAlreadyDrunk) {
            // Toggle off Drunk
            return {
              ...p,
              trueRoleId: p.perceivedRoleId,
              reminders: withoutDrunkRem,
            };
          } else {
            // Become Drunk
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
        // If another player was Drunk and target is becoming Drunk, revert other player
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
  };

  const startDemoGame = () => {
    const demo = createDemoSession(8);
    const demoPayload: PersistedGameSession = {
      hasActiveGame: true,
      playerCount: demo.playerCount,
      selectedRoleIds: demo.selectedRoleIds,
      drunkFakeRoleId: demo.drunkFakeRoleId,
      demonBluffIds: demo.demonBluffIds,
      players: demo.players,
      phase: 'first_night',
      dayNumber: 1,
      executedTodayPlayerId: null,
      lastNightDeaths: [],
      gameAlertBanner: null,
    };
    saveSessionDirectly(demoPayload);
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
    setHasActiveGame(true);
    navigateToView('grimoire');
  };

  const handleResetSession = () => {
    setHasActiveGame(false);
    setExecutedTodayPlayerId(null);
    setLastNightDeaths([]);
    setGameAlertBanner(null);
    try {
      window.localStorage.removeItem(GAME_STORAGE_KEY);
      window.localStorage.removeItem('botc_tb_wizard_draft_v2');
    } catch {
      // Ignore
    }
    navigateToView('dashboard');
  };

  const evaluateWinConditions = (updatedPlayers: PlayerSeat[], contextMsg?: string) => {
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
  };

  // Grimoire Seat Handlers
  const handleSwapSeats = (fromIdx: number, toIdx: number) => {
    setPlayers((prev) => swapPlayerSeats(prev, fromIdx, toIdx));
  };

  const handleMoveSeat = (seatIdx: number, dir: 'cw' | 'ccw') => {
    setPlayers((prev) => movePlayerSeat(prev, seatIdx, dir));
  };

  // Robust Death & Execution Handlers
  // Both hanging and demon kills mark the player DEAD and BLACK.
  // Multiple players can die by execution across multiple days.
  const handleKillPlayer = (
    playerId: string,
    cause: 'demon' | 'execution' | 'slayer'
  ) => {
    const target = players.find((p) => p.id === playerId);
    if (!target) return;

    const aliveBeforeDeath = players.filter((p) => p.isAlive).length;

    if (cause === 'execution') {
      setExecutedTodayPlayerId(playerId);

      // Saint execution loss: If Saint is executed while healthy, Evil wins immediately
      if (target.trueRoleId === 'saint' && !isPlayerPoisoned(target)) {
        setPlayers((prev) => {
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
          return sanitizePlayerSeats(next);
        });
        setGameAlertBanner(
          `SAINT DIEKSEKUSI! ${target.name} adalah Saint asli yang sehat. Sesuai aturan, TIM EVIL LANGSUNG MENANG!`
        );
        return;
      }

      // Demon execution & Scarlet Woman check:
      // If Demon is executed, alive count before >= 5, and healthy SW exists, SW becomes new Imp
      const isTargetDemon = ROLE_MAP[target.trueRoleId]?.team === 'demon';
      const healthyScarletWoman = players.find(
        (p) =>
          p.isAlive &&
          p.id !== playerId &&
          p.trueRoleId === 'scarlet_woman' &&
          !isPlayerPoisoned(p)
      );

      if (isTargetDemon && aliveBeforeDeath >= 5 && healthyScarletWoman) {
        setPlayers((prev) => {
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
          return sanitizePlayerSeats(next);
        });
        setGameAlertBanner(
          `SCARLET WOMAN AKTIF! Demon (${target.name}) dieksekusi saat ada ${aliveBeforeDeath} pemain hidup. ${healthyScarletWoman.name} otomatis berubah menjadi IMP baru!`
        );
        return;
      }
    }

    // Standard kill: marks player dead, retains any other dead players
    setPlayers((prev) => {
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
  };

  const handleResurrectPlayer = (playerId: string) => {
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
    if (executedTodayPlayerId === playerId) {
      setExecutedTodayPlayerId(null);
    }
  };

  const handleChangeDeathCause = (
    playerId: string,
    cause: 'demon' | 'execution' | 'slayer'
  ) => {
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
    } else if (executedTodayPlayerId === playerId) {
      setExecutedTodayPlayerId(null);
    }
  };

  const handleToggleAlive = (
    playerId: string,
    cause?: 'demon' | 'execution' | 'slayer'
  ) => {
    const target = players.find((p) => p.id === playerId);
    if (!target) return;
    if (target.isAlive) {
      handleKillPlayer(playerId, cause ?? 'demon');
    } else {
      handleResurrectPlayer(playerId);
    }
  };

  const handleToggleGhostVote = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, hasGhostVote: !p.hasGhostVote } : p
      )
    );
  };

  const handleAddReminder = (playerId: string, reminderId: string) => {
    // Drunk reminder: strictly only 1 Drunk in the game
    if (reminderId === 'is_the_drunk') {
      handleSetDrunkPlayer(playerId);
      return;
    }

    setPlayers((prev) => {
      const next = prev.map((p) => {
        // If moving single-target tokens (Poisoned, Protected, Die), clean up from other players
        if (p.id !== playerId) {
          if (reminderId === 'poisoned' || reminderId === 'protected' || reminderId === 'die_imp') {
            return {
              ...p,
              reminders: p.reminders.filter((r) => r.reminderId !== reminderId),
            };
          }
          return p;
        }

        // On target player: NO DUPLICATE TOKENS! Toggle off if already attached
        const alreadyHas = p.reminders.some((r) => r.reminderId === reminderId);
        if (alreadyHas) {
          return {
            ...p,
            reminders: p.reminders.filter((r) => r.reminderId !== reminderId),
          };
        }

        // Clean any existing reminder of this ID before adding (defensive deduplication)
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
  };

  const handleSetSingleReminderTarget = (reminderId: string, targetPlayerId: string) => {
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
  };

  const handleRemoveReminder = (playerId: string, instanceId: string) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? { ...p, reminders: p.reminders.filter((r) => r.instanceId !== instanceId) }
          : p
      )
    );
  };

  const handleChangePlayerTrueRole = (playerId: string, newTrueRoleId: string) => {
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
  };

  // Automated Imp Attack Resolution
  const handleResolveImpAttack = (targetPlayerId: string): { outcomeMessage: string } => {
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

    // Starpass check: Imp chooses themselves
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

    // Protected by Monk check
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

    // Healthy Soldier check
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

    // Standard kill
    handleSetSingleReminderTarget('die_imp', target.id);
    return {
      outcomeMessage: `Token "Die" dipasang pada ${target.name} (Kursi ${
        target.seatIndex + 1
      }). Ia akan diumumkan tewas saat Fajar.`,
    };
  };

  // Night -> Day Resolution
  const handleTransitionNightToDay = () => {
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
  };

  // Day Execution Resolution
  const handleExecutePlayerInDay = (playerId: string | null) => {
    if (!playerId) {
      setExecutedTodayPlayerId(null);
      // Mayor win check: 3 alive, no execution today, healthy Mayor
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
  };

  // Day -> Next Night Resolution
  const handleTransitionDayToNextNight = () => {
    setDayNumber((prev) => prev + 1);
    setPhase('other_night');
  };

  const handleTriggerSlayerShot = (
    slayerPlayerId: string,
    targetPlayerId: string
  ): string => {
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
          if (p.id === target.id) return { ...p, isAlive: false, deathCause: 'slayer' as const };
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
  };

  const handleTriggerVirginNomination = (
    virginPlayerId: string,
    nominatorPlayerId: string
  ): string => {
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
  };

  const isNightPhase = phase === 'first_night' || phase === 'other_night';
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0D0B12] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-3" />
        <span className="font-serif text-base tracking-wider text-[#F5EFE6]">
          Memuat Grimoire Trouble Brewing...
        </span>
      </div>
    );
  }

  const isPlayingView =
    currentView === 'grimoire' ||
    currentView === 'evil' ||
    currentView === 'narrator';

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-8">
      {/* 
        CRITICAL USER REQUIREMENT:
        "NAVBARNYA BERSIH AJA CUMA GRIMOIRE BOTC AJAA SESI BARU JUGA HILANGIN SEMUAA"
        Strictly clean navbar with ONLY "Grimoire BOTC" title.
      */}
      <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 border-b border-[#292535] bg-[#13101A]/95 flex items-center justify-between backdrop-blur-sm">
        <button
          type="button"
          onClick={() => navigateToView('dashboard')}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-[#F5EFE6] cursor-pointer hover:text-[#D4AF37] transition-colors"
        >
          Grimoire BOTC
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* ================= VIEW 1: DASHBOARD ================= */}
        {currentView === 'dashboard' && (
          <DashboardView
            hasActiveGame={hasActiveGame && players.length >= 5}
            playerCount={playerCount}
            phase={phase}
            dayNumber={dayNumber}
            players={players}
            onStartNewSetup={() => navigateToView('setup', 1)}
            onStartWebPlay={() => navigateToView('webplay')}
            onContinueGame={(targetTab) => navigateToView(targetTab)}
            onQuickStartDemo={startDemoGame}
            onOpenRulesReference={() => setIsRefModalOpen(true)}
            onResetSession={handleResetSession}
          />
        )}

        {/* ================= VIEW: BERMAIN PENUH DI WEB (PASS-AND-PLAY KOIN) ================= */}
        {currentView === 'webplay' && (
          <WebPlayMode
            onCancelToDashboard={() => navigateToView('dashboard')}
            onCompleteWebPlay={(payload) => {
              const fullPayload: PersistedGameSession = {
                hasActiveGame: true,
                playerCount: payload.playerCount,
                isDrunkActive: payload.isDrunkActive,
                selectedRoleIds: payload.selectedRoleIds,
                drunkFakeRoleId: payload.drunkFakeRoleId,
                demonBluffIds: payload.demonBluffIds,
                players: payload.players,
                phase: 'first_night',
                dayNumber: 1,
                executedTodayPlayerId: null,
                lastNightDeaths: [],
                gameAlertBanner: null,
              };
              saveSessionDirectly(fullPayload);
              setPlayerCount(payload.playerCount);
              setIsDrunkActive(payload.isDrunkActive);
              setSelectedRoleIds(payload.selectedRoleIds);
              setDrunkFakeRoleId(payload.drunkFakeRoleId);
              setDemonBluffIds(payload.demonBluffIds);
              setPlayers(payload.players);
              setPhase('first_night');
              setDayNumber(1);
              setExecutedTodayPlayerId(null);
              setLastNightDeaths([]);
              setGameAlertBanner(null);
              setHasActiveGame(true);
              navigateToView('grimoire');
            }}
          />
        )}

        {/* ================= VIEW 2: SETUP WIZARD ================= */}
        {currentView === 'setup' && (
          <SetupWizard
            initialPlayerCount={playerCount}
            initialStep={setupStep}
            onStepChange={(step) => {
              setSetupStep(step);
              syncUrlParams('setup', step, true);
            }}
            onCancelToDashboard={() => navigateToView('dashboard')}
            onCompleteSetup={(payload) => {
              const fullPayload: PersistedGameSession = {
                hasActiveGame: true,
                playerCount: payload.playerCount,
                isDrunkActive: payload.isDrunkActive,
                selectedRoleIds: payload.selectedRoleIds,
                drunkFakeRoleId: payload.drunkFakeRoleId,
                demonBluffIds: payload.demonBluffIds,
                players: payload.players,
                phase: 'first_night',
                dayNumber: 1,
                executedTodayPlayerId: null,
                lastNightDeaths: [],
                gameAlertBanner: null,
              };
              saveSessionDirectly(fullPayload);
              setPlayerCount(payload.playerCount);
              setIsDrunkActive(payload.isDrunkActive);
              setSelectedRoleIds(payload.selectedRoleIds);
              setDrunkFakeRoleId(payload.drunkFakeRoleId);
              setDemonBluffIds(payload.demonBluffIds);
              setPlayers(payload.players);
              setPhase('first_night');
              setDayNumber(1);
              setExecutedTodayPlayerId(null);
              setLastNightDeaths([]);
              setGameAlertBanner(null);
              setHasActiveGame(true);
              navigateToView('grimoire');
            }}
            onQuickStartDemo={startDemoGame}
            onShowSilentCard={(card) => setSilentCard(card)}
          />
        )}

        {/* ================= VIEW 3, 4, 5: ACTIVE GAME VIEWS ================= */}
        {isPlayingView && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
            {/*
              CRITICAL USER REQUIREMENT:
              "NNTI BARUUUU PAS UDH SETUP DIA KEK BERSIH AJA NNTI UDH SETUP DAN NAMA2NYA
              BARUUU DEH ADA TIM EVIL KAHH DLL MENUNYAA GITUU DIATAS TAPI BUKAN DI NAVBAR YAA"
              Render in-page sub-navigation above the content:
            */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#181520] border border-[#2D283B] rounded-2xl">
              <nav aria-label="Menu Sesi Storyteller" className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => navigateToView('grimoire')}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                    currentView === 'grimoire'
                      ? 'bg-[#991B1B] text-white shadow-md'
                      : 'bg-[#15121D] hover:bg-[#231E2E] text-[#C8C0B3]'
                  }`}
                >
                  <Compass className="w-4 h-4 text-[#D4AF37]" />
                  <span>Meja Grimoire</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToView('evil')}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                    currentView === 'evil'
                      ? 'bg-[#991B1B] text-white shadow-md'
                      : 'bg-[#15121D] hover:bg-[#231E2E] text-[#C8C0B3]'
                  }`}
                >
                  <Swords className="w-4 h-4 text-[#F87171]" />
                  <span>Tim Evil & Bluff</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateToView('narrator')}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                    currentView === 'narrator'
                      ? 'bg-[#991B1B] text-white shadow-md'
                      : 'bg-[#15121D] hover:bg-[#231E2E] text-[#C8C0B3]'
                  }`}
                >
                  <Moon className="w-4 h-4 text-[#93C5FD]" />
                  <span>Narator Malam</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRefModalOpen(true)}
                  className="min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#15121D] hover:bg-[#231E2E] text-[#C8C0B3] flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <BookMarked className="w-4 h-4 text-[#D4AF37]" />
                  <span>Panduan Peran</span>
                </button>
              </nav>

              <button
                type="button"
                onClick={() => navigateToView('dashboard')}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#231F30] hover:bg-[#2F2942] border border-[#3B3450] text-xs font-semibold text-[#EDE7DB] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* ================= PROMINENT MANUAL PHASE CONTROLLER BANNER ================= */}
            <div className="bg-[#181520] border-2 border-[#D4AF37]/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                    Kontrol Manual Fase Storyteller
                  </span>
                  <span className="text-xs text-[#8E8698]">·</span>
                  <span className="text-xs text-[#6EE7B7] font-medium">Tersimpan Otomatis di LocalStorage</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#221D2E] border border-[#3A334C]">
                    {isNightPhase ? (
                      <Moon className="w-5 h-5 text-[#93C5FD]" />
                    ) : (
                      <Sun className="w-5 h-5 text-[#FBBF24]" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-[#F5EFE6]">
                      {phase === 'first_night'
                        ? 'Malam Pertama (First Night)'
                        : phase === 'day'
                        ? `Fase Siang Hari ke-${dayNumber}`
                        : `Malam ke-${dayNumber + 1}`}
                    </h2>
                    <p className="text-xs text-[#B8B0A2]">
                      {phase === 'first_night'
                        ? 'Semua mata tertutup. Minion & Demon saling mengenal, kemampuan malam pertama beraksi.'
                        : phase === 'day'
                        ? 'Mata terbuka. Warga berdiskusi, Slayer/Virgin dapat memicu kemampuan, dan nominasi eksekusi berlangsung.'
                        : 'Semua mata tertutup. Demon membunuh target, Monk melindungi, Undertaker melihat eksekusi.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Big Action Button to Advance to Next Day / Next Night Manually */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                {isNightPhase ? (
                  <button
                    type="button"
                    onClick={handleTransitionNightToDay}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E2BE46] text-[#121016] text-sm sm:text-base font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                  >
                    <Sun className="w-5 h-5 fill-current" />
                    <span>Lanjut ke Siang Hari {phase === 'first_night' ? '1' : dayNumber} (Next Day)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTransitionDayToNextNight}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                  >
                    <Moon className="w-5 h-5" />
                    <span>Lanjut ke Malam Hari {dayNumber + 1} (Next Night)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* Free Manual Phase Selector */}
                <div className="flex items-center gap-1 p-1 bg-[#121018] border border-[#2B2638] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPhase('first_night')}
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      phase === 'first_night' ? 'bg-[#991B1B] text-white' : 'text-[#8E8698] hover:text-[#EDE7DB]'
                    }`}
                  >
                    M1
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase('day')}
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      phase === 'day' ? 'bg-[#D4AF37] text-[#121016]' : 'text-[#8E8698] hover:text-[#EDE7DB]'
                    }`}
                  >
                    Siang
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase('other_night')}
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      phase === 'other_night' ? 'bg-[#991B1B] text-white' : 'text-[#8E8698] hover:text-[#EDE7DB]'
                    }`}
                  >
                    Malam
                  </button>
                </div>
              </div>
            </div>

            {/* Critical Game Alert Banner */}
            {gameAlertBanner && (
              <div
                role="status"
                className="p-4 rounded-2xl bg-[#2B171B] border border-[#EF4444]/70 text-sm text-[#FECACA] flex items-start gap-3 shadow-lg"
              >
                <ShieldAlert className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-display text-base text-white">
                    Pemberitahuan Kemenangan / Status Penting Storyteller
                  </strong>
                  <p>{gameAlertBanner}</p>
                </div>
              </div>
            )}

            {/* Active Tab View */}
            {currentView === 'grimoire' && (
              <GrimoireBoard
                players={players}
                phase={phase}
                dayNumber={dayNumber}
                executedTodayPlayerId={executedTodayPlayerId}
                demonBluffIds={demonBluffIds}
                isDrunkActive={isDrunkActive}
                onSetDrunkPlayer={handleSetDrunkPlayer}
                onSwapSeats={handleSwapSeats}
                onMoveSeat={handleMoveSeat}
                onKillPlayer={handleKillPlayer}
                onResurrectPlayer={handleResurrectPlayer}
                onChangeDeathCause={handleChangeDeathCause}
                onToggleAlive={handleToggleAlive}
                onToggleGhostVote={handleToggleGhostVote}
                onAddReminder={handleAddReminder}
                onRemoveReminder={handleRemoveReminder}
                onMarkExecutedToday={handleExecutePlayerInDay}
                onChangePlayerTrueRole={handleChangePlayerTrueRole}
                onShowSilentCard={(card) => setSilentCard(card)}
              />
            )}

            {currentView === 'evil' && (
              <EvilAndBluffsView
                players={players}
                drunkFakeRoleId={drunkFakeRoleId}
                demonBluffIds={demonBluffIds}
                onUpdateBluffs={setDemonBluffIds}
                onShowSilentCard={(card) => setSilentCard(card)}
              />
            )}

            {currentView === 'narrator' && (
              <NarratorView
                phase={phase}
                dayNumber={dayNumber}
                players={players}
                executedTodayPlayerId={executedTodayPlayerId}
                demonBluffIds={demonBluffIds}
                lastNightDeaths={lastNightDeaths}
                gameAlertBanner={gameAlertBanner}
                onChangePhase={setPhase}
                onSetSingleReminderTarget={handleSetSingleReminderTarget}
                onResolveImpAttack={handleResolveImpAttack}
                onTransitionNightToDay={handleTransitionNightToDay}
                onTransitionDayToNextNight={handleTransitionDayToNextNight}
                onExecutePlayerInDay={handleExecutePlayerInDay}
                onTriggerSlayerShot={handleTriggerSlayerShot}
                onTriggerVirginNomination={handleTriggerVirginNomination}
                onShowSilentCard={(card) => setSilentCard(card)}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Fixed Navigation Bar (Visible only when in active game) */}
      {isPlayingView && (
        <nav
          aria-label="Navigasi Bawah Layar HP"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#13101A]/95 border-t border-[#292535] grid grid-cols-4 items-center px-1 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => navigateToView('grimoire')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              currentView === 'grimoire' ? 'text-[#D4AF37]' : 'text-[#9C9486]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
              Grimoire
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateToView('evil')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              currentView === 'evil' ? 'text-[#D4AF37]' : 'text-[#9C9486]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
              Bluff Evil
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateToView('narrator')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              currentView === 'narrator' ? 'text-[#D4AF37]' : 'text-[#9C9486]'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
              Narator
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateToView('dashboard')}
            className="min-h-[44px] flex flex-col items-center justify-center text-[#9C9486] cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
              Dashboard
            </span>
          </button>
        </nav>
      )}

      {/* Modals */}
      <FullscreenCardModal
        card={silentCard}
        onClose={() => setSilentCard(null)}
      />
      <ReferenceSheetModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
      />
    </div>
  );
}
