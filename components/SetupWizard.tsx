'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Beer,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Users,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CHARACTER_COUNTS,
  ROLE_MAP,
  ROLES,
  RoleDefinition,
  TeamType,
} from '@/lib/botc-data';
import {
  PlayerSeat,
  clampPlayerCount,
  computeSafeDemonBluffs,
  getBaseCharacterCounts,
  getEffectiveCharacterCounts,
} from '@/lib/botc-engine';
import { CharacterToken, RoleGlyph } from './TokenArtwork';
import { SilentCardPayload } from './FullscreenCardModal';

const WIZARD_DRAFT_KEY = 'botc_tb_setup_v4';

interface SeatDraft {
  seatIndex: number;
  name: string;
  roleId: string;
}

interface SetupDraft {
  activeMenu: 1 | 2;
  playerCount: number;
  isDrunkActive: boolean;
  selectedRoleIds: string[];
  seats: SeatDraft[];
}

interface SetupWizardProps {
  initialPlayerCount: number;
  initialStep?: number;
  onStepChange?: (step: 1 | 2) => void;
  onCancelToDashboard?: () => void;
  onCompleteSetup: (payload: {
    playerCount: number;
    selectedRoleIds: string[];
    drunkFakeRoleId: string | null;
    demonBluffIds: string[];
    players: PlayerSeat[];
    isDrunkActive: boolean;
  }) => void;
  onQuickStartDemo: () => void;
  onShowSilentCard?: (card: SilentCardPayload) => void;
}

function loadInitialSetupDraft(): SetupDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SetupDraft;
    if (parsed && typeof parsed.playerCount === 'number') {
      return parsed;
    }
  } catch {
    // Ignore
  }
  return null;
}

export default function SetupWizard({
  initialPlayerCount,
  initialStep = 1,
  onStepChange,
  onCancelToDashboard,
  onCompleteSetup,
  onQuickStartDemo,
}: SetupWizardProps) {
  const initialSaved = useMemo(() => loadInitialSetupDraft(), []);

  // 2 Menus: Menu 1 (Jumlah & Karakter Tas), Menu 2 (Nama & Pembagian Kursi)
  const [activeMenu, setActiveMenuState] = useState<1 | 2>(() => {
    if (initialStep === 2) return 2;
    return initialSaved?.activeMenu === 2 ? 2 : 1;
  });

  const setActiveMenu = (menu: 1 | 2) => {
    setActiveMenuState(menu);
    onStepChange?.(menu);
  };

  const [playerCount, setPlayerCount] = useState<number>(() => {
    if (initialSaved) return clampPlayerCount(initialSaved.playerCount);
    return clampPlayerCount(initialPlayerCount);
  });

  // Does the Storyteller want the Drunk Outsider in this game?
  const [isDrunkActive, setIsDrunkActive] = useState<boolean>(() => {
    if (initialSaved) return Boolean(initialSaved.isDrunkActive);
    return playerCount >= 6;
  });

  // Calculate required counts
  const baseCounts = getBaseCharacterCounts(playerCount);

  // Selected roles in the bag (for Menu 1)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(() => {
    if (initialSaved && Array.isArray(initialSaved.selectedRoleIds) && initialSaved.selectedRoleIds.length > 0) {
      return initialSaved.selectedRoleIds;
    }
    // Default starter bag
    const townsfolkNeeded = (playerCount >= 6 ? true : false) ? baseCounts.townsfolk + 1 : baseCounts.townsfolk;
    const defaultTownsfolk = ROLES.filter((r) => r.team === 'townsfolk').slice(0, townsfolkNeeded).map((r) => r.id);
    const defaultOutsiders = (playerCount >= 6 ? true : false)
      ? []
      : ROLES.filter((r) => r.team === 'outsider' && r.id !== 'drunk').slice(0, baseCounts.outsiders).map((r) => r.id);
    const defaultMinions = ROLES.filter((r) => r.team === 'minion' && r.id !== 'baron').slice(0, baseCounts.minions).map((r) => r.id);
    return [...defaultTownsfolk, ...defaultOutsiders, ...defaultMinions, 'imp'];
  });

  // Seats with names (STRICTLY EMPTY by default!)
  const [seats, setSeats] = useState<SeatDraft[]>(() => {
    if (initialSaved && Array.isArray(initialSaved.seats)) {
      const clamped = clampPlayerCount(initialSaved.playerCount);
      const restored: SeatDraft[] = [];
      for (let i = 0; i < clamped; i++) {
        const s = initialSaved.seats[i];
        restored.push({
          seatIndex: i,
          name: s?.name ?? '', // Strictly empty name!
          roleId: s?.roleId ?? 'washerwoman',
        });
      }
      return restored;
    }
    const count = clampPlayerCount(initialPlayerCount);
    return Array.from({ length: count }, (_, idx) => ({
      seatIndex: idx,
      name: '', // STRICTLY EMPTY!
      roleId: 'washerwoman',
    }));
  });

  const [activeSeatRolePickerIdx, setActiveSeatRolePickerIdx] = useState<number | null>(null);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Persist draft
  useEffect(() => {
    try {
      const draft: SetupDraft = {
        activeMenu,
        playerCount,
        isDrunkActive,
        selectedRoleIds,
        seats,
      };
      window.localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Ignore
    }
  }, [activeMenu, playerCount, isDrunkActive, selectedRoleIds, seats]);

  // Compute Bag requirements:
  // If Drunk is active, Drunk takes 1 Outsider slot, but physically draws +1 Townsfolk!
  // So Townsfolk in bag = base.townsfolk + 1!
  // And Outsiders in bag = base.outsiders - 1!
  const hasBaron = selectedRoleIds.includes('baron');
  const targetOutsidersCount = hasBaron ? Math.min(4, baseCounts.outsiders + 2) : baseCounts.outsiders;
  const targetTownsfolkCount = hasBaron
    ? Math.max(0, baseCounts.townsfolk - (targetOutsidersCount - baseCounts.outsiders))
    : baseCounts.townsfolk;

  const requiredTownsfolkInBag = isDrunkActive ? targetTownsfolkCount + 1 : targetTownsfolkCount;
  const requiredOutsidersInBag = isDrunkActive ? Math.max(0, targetOutsidersCount - 1) : targetOutsidersCount;
  const requiredMinionsInBag = baseCounts.minions;
  const requiredDemonsInBag = baseCounts.demons; // 1 (Imp)

  // Current counts in selectedRoleIds
  const currentCounts = useMemo(() => {
    let townsfolk = 0;
    let outsiders = 0;
    let minions = 0;
    let demons = 0;

    for (const id of selectedRoleIds) {
      const r = ROLE_MAP[id];
      if (!r) continue;
      if (r.team === 'townsfolk') townsfolk++;
      else if (r.team === 'outsider' && id !== 'drunk') outsiders++;
      else if (r.team === 'minion') minions++;
      else if (r.team === 'demon') demons++;
    }

    return { townsfolk, outsiders, minions, demons };
  }, [selectedRoleIds]);

  // Toggle role in Menu 1 bag
  const toggleRoleInBag = (roleId: string) => {
    if (roleId === 'imp') return; // Locked to 1 Imp
    if (roleId === 'drunk') {
      setIsDrunkActive((prev) => !prev);
      return;
    }

    setErrorMessage(null);
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      }
      return [...prev, roleId];
    });
  };

  // Adjust player count
  const handlePlayerCountChange = (newCountRaw: number) => {
    const newCount = clampPlayerCount(newCountRaw);
    setPlayerCount(newCount);
    setErrorMessage(null);

    // Re-adjust seats count
    setSeats((prev) => {
      const next: SeatDraft[] = [];
      for (let i = 0; i < newCount; i++) {
        next.push({
          seatIndex: i,
          name: prev[i]?.name ?? '',
          roleId: prev[i]?.roleId ?? 'washerwoman',
        });
      }
      return next;
    });
  };

  // Quick auto-balance for Menu 1
  const handleAutoBalanceBag = (forceDrunk: boolean) => {
    setIsDrunkActive(forceDrunk);
    const count = playerCount;
    const base = getBaseCharacterCounts(count);

    const targetTownsfolk = forceDrunk ? base.townsfolk + 1 : base.townsfolk;
    const targetOutsiders = forceDrunk ? Math.max(0, base.outsiders - 1) : base.outsiders;

    const allTownsfolk = ROLES.filter((r) => r.team === 'townsfolk').map((r) => r.id);
    const allOutsiders = ROLES.filter((r) => r.team === 'outsider' && r.id !== 'drunk').map((r) => r.id);
    const allMinions = ROLES.filter((r) => r.team === 'minion' && r.id !== 'baron').map((r) => r.id);

    const chosenTf = allTownsfolk.slice(0, targetTownsfolk);
    const chosenOut = allOutsiders.slice(0, targetOutsiders);
    const chosenMin = allMinions.slice(0, base.minions);

    const newRoles = [...chosenTf, ...chosenOut, ...chosenMin, 'imp'];
    setSelectedRoleIds(newRoles);

    // Sync seats
    setSeats((prev) => {
      return prev.map((s, idx) => ({
        ...s,
        roleId: newRoles[idx] ?? 'washerwoman',
      }));
    });

    setErrorMessage(null);
  };

  // Validation for Menu 1
  const isMenu1Valid = useMemo(() => {
    return (
      currentCounts.townsfolk === requiredTownsfolkInBag &&
      currentCounts.outsiders === requiredOutsidersInBag &&
      currentCounts.minions === requiredMinionsInBag &&
      currentCounts.demons === requiredDemonsInBag &&
      selectedRoleIds.filter((id) => id !== 'drunk').length === playerCount
    );
  }, [
    currentCounts,
    requiredTownsfolkInBag,
    requiredOutsidersInBag,
    requiredMinionsInBag,
    requiredDemonsInBag,
    selectedRoleIds,
    playerCount,
  ]);

  // Proceed to Menu 2
  const handleProceedToMenu2 = () => {
    if (!isMenu1Valid) {
      if (currentCounts.townsfolk !== requiredTownsfolkInBag) {
        setErrorMessage(
          `Townsfolk belum pas: Anda harus memilih ${requiredTownsfolkInBag} karakter Townsfolk${
            isDrunkActive ? ' (+1 Townsfolk ekstra karena Drunk)' : ''
          }. Saat ini dipilih ${currentCounts.townsfolk}.`
        );
        return;
      }
      if (currentCounts.outsiders !== requiredOutsidersInBag) {
        setErrorMessage(
          `Outsider belum pas: Anda harus memilih ${requiredOutsidersInBag} karakter Outsider. Saat ini dipilih ${currentCounts.outsiders}.`
        );
        return;
      }
      if (currentCounts.minions !== requiredMinionsInBag) {
        setErrorMessage(
          `Minion belum pas: Anda harus memilih ${requiredMinionsInBag} karakter Minion. Saat ini dipilih ${currentCounts.minions}.`
        );
        return;
      }
      if (currentCounts.demons !== requiredDemonsInBag) {
        setErrorMessage('Demon belum dipilih: Anda harus memilih tepat 1 Imp.');
        return;
      }
      setErrorMessage(`Total peran yang dipilih harus tepat ${playerCount} karakter.`);
      return;
    }

    // Sync the selected roles to seats
    const rolesInBag = selectedRoleIds.filter((id) => id !== 'drunk');
    setSeats((prev) => {
      return prev.map((s, idx) => ({
        ...s,
        roleId: rolesInBag[idx] ?? s.roleId,
      }));
    });

    setErrorMessage(null);
    setActiveMenu(2);
  };

  // Shuffle roles among seats in Menu 2
  const handleShuffleSeats = () => {
    setSeats((prev) => {
      const roles = prev.map((s) => s.roleId);
      for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
      }
      return prev.map((s, idx) => ({ ...s, roleId: roles[idx] }));
    });
  };

  // Clear names
  const handleClearNames = () => {
    setSeats((prev) => prev.map((s) => ({ ...s, name: '' })));
  };

  // Select a role for a specific seat from the chosen bag in Menu 2
  const handleAssignSeatRole = (seatIdx: number, newRoleId: string) => {
    setSeats((prev) => {
      const currentAtTarget = prev[seatIdx].roleId;
      return prev.map((s) => {
        if (s.seatIndex === seatIdx) {
          return { ...s, roleId: newRoleId };
        }
        // Swap if another seat already had this role
        if (s.roleId === newRoleId) {
          return { ...s, roleId: currentAtTarget };
        }
        return s;
      });
    });
    setActiveSeatRolePickerIdx(null);
  };

  // Start game from Menu 2
  const handleStartGame = () => {
    // Check empty names
    const empty = seats.filter((s) => !s.name.trim());
    if (empty.length > 0) {
      setErrorMessage(
        `Ada ${empty.length} nama pemain yang masih kosong (contoh Kursi ${
          empty[0].seatIndex + 1
        }). Harap ketik nama semua pemain terlebih dahulu!`
      );
      return;
    }

    const trimmed = seats.map((s) => s.name.trim());
    const uniqueNames = new Set(trimmed.map((n) => n.toLowerCase()));
    if (uniqueNames.size < trimmed.length) {
      setErrorMessage('Ada nama pemain yang kembar/sama. Setiap pemain harus memiliki nama yang unik!');
      return;
    }

    setErrorMessage(null);

    // Build seats. Note: If Drunk is active, all players on good team have Townsfolk roles for now,
    // and the Storyteller will pick WHICH one is the Drunk inside the Grimoire!
    const finalSelectedRoleIds = seats.map((s) => s.roleId);
    if (isDrunkActive && !finalSelectedRoleIds.includes('drunk')) {
      finalSelectedRoleIds.push('drunk');
    }

    const { recommendedBluffs } = computeSafeDemonBluffs(
      finalSelectedRoleIds,
      null,
      108 + playerCount
    );

    const generatedPlayers: PlayerSeat[] = seats.map((s) => ({
      id: `seat-${s.seatIndex + 1}`,
      seatIndex: s.seatIndex,
      name: s.name.trim(),
      trueRoleId: s.roleId,
      perceivedRoleId: s.roleId,
      isAlive: true,
      hasGhostVote: true,
      reminders: [],
    }));

    onCompleteSetup({
      playerCount,
      selectedRoleIds: finalSelectedRoleIds,
      drunkFakeRoleId: null,
      demonBluffIds: recommendedBluffs,
      players: generatedPlayers,
      isDrunkActive,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#181520] border border-[#2A2636] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FDE68A] text-xs font-bold uppercase tracking-wider">
                Setup Resmi Trouble Brewing
              </span>
              <span className="text-xs text-[#A8A092]">Bahasa Indonesia</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
              Persiapan Sesi & Pembagian Peran
            </h1>
            <p className="text-xs sm:text-sm text-[#BDB5A7] mt-0.5 max-w-2xl">
              Ikuti 2 menu praktis: tentukan karakter dalam tas pemain di Menu 1, lalu ketik nama dan bagikan peran ke setiap kursi di Menu 2.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onQuickStartDemo}
              className="px-3.5 py-2 rounded-xl bg-[#251E33] hover:bg-[#342B47] text-xs font-bold text-[#EDE7DB] border border-[#3E3454] cursor-pointer transition-colors"
            >
              Demo Cepat 8 Pemain
            </button>
            {onCancelToDashboard && (
              <button
                type="button"
                onClick={onCancelToDashboard}
                className="px-3.5 py-2 rounded-xl bg-[#1C1827] hover:bg-[#2A233A] text-xs font-semibold text-[#A8A092] border border-[#2D263B] cursor-pointer"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>

        {/* 2 Menu Tabs Indicator */}
        <div className="grid grid-cols-2 p-1.5 bg-[#120F1A] border border-[#2B243B] rounded-2xl gap-2">
          <button
            type="button"
            onClick={() => setActiveMenu(1)}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-display text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeMenu === 1
                ? 'bg-[#D4AF37] text-[#121016] shadow-lg'
                : 'text-[#A8A092] hover:text-[#EDE7DB] hover:bg-[#1E182A]'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-xs font-black">
              1
            </span>
            <span>01. Jumlah & Karakter Tas</span>
          </button>

          <button
            type="button"
            onClick={handleProceedToMenu2}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-display text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeMenu === 2
                ? 'bg-[#D4AF37] text-[#121016] shadow-lg'
                : 'text-[#A8A092] hover:text-[#EDE7DB] hover:bg-[#1E182A]'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-xs font-black">
              2
            </span>
            <span>02. Input Nama & Kursi Pemain</span>
          </button>
        </div>
      </motion.div>

      {/* Error / Alert Message Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-2xl bg-[#2B1417] border border-[#EF4444] text-[#FECACA] text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#F87171]" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 cursor-pointer"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENU 1: JUMLAH PEMAIN & KARAKTER TAS */}
      {activeMenu === 1 && (
        <motion.div
          key="menu-1"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Player Count & Drunk Switch */}
          <div className="bg-[#181520] border border-[#2A2636] rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-[#120F1A] border border-[#282236] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#241D33] border border-[#3D3354] flex items-center justify-center text-[#D4AF37]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-[#A8A092] font-semibold">Total Jumlah Pemain:</div>
                  <div className="font-display text-xl sm:text-2xl font-black text-[#F5EFE6]">
                    {playerCount} Orang
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePlayerCountChange(playerCount - 1)}
                  disabled={playerCount <= 5}
                  aria-label="Kurangi Pemain"
                  className="w-10 h-10 rounded-xl bg-[#221B2E] hover:bg-[#312742] disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-[#382E4D]"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="hidden sm:flex items-center gap-1 overflow-x-auto p-1 bg-[#1A1525] rounded-xl border border-[#2A2338]">
                  {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handlePlayerCountChange(cnt)}
                      className={`w-7 h-7 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                        playerCount === cnt
                          ? 'bg-[#D4AF37] text-[#121016]'
                          : 'text-[#A8A092] hover:text-white hover:bg-[#251E33]'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handlePlayerCountChange(playerCount + 1)}
                  disabled={playerCount >= 15}
                  aria-label="Tambah Pemain"
                  className="w-10 h-10 rounded-xl bg-[#221B2E] hover:bg-[#312742] disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-[#382E4D]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drunk Toggle Feature */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#281D12] via-[#201710] to-[#17121E] border-2 border-[#D97706]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3D2611] border border-[#B45309] flex items-center justify-center text-[#F59E0B] shrink-0 mt-0.5">
                  <Beer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-[#FDE68A]">
                      Aktifkan Karakter The Drunk (Outsider)?
                    </h3>
                    {isDrunkActive && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D97706] text-[#121016] text-[10px] font-black uppercase">
                        Aktif (+1 Townsfolk)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#E5D7B7] mt-1 leading-relaxed">
                    Karena Drunk mengira dirinya adalah Townsfolk asli, <strong>jumlah Townsfolk yang Anda pilih BERTAMBAH +1</strong> (misal dari {baseCounts.townsfolk} menjadi {baseCounts.townsfolk + 1} Townsfolk). Nantinya di Meja Grimoire, Anda tinggal memilih siapa dari pemain Townsfolk tersebut yang sebenarnya adalah The Drunk!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrunkActive((prev) => !prev)}
                className={`min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 ${
                  isDrunkActive
                    ? 'bg-[#F59E0B] text-[#121016] shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-[#291D1A] text-[#EDE7DB] border border-[#523B2A] hover:bg-[#382723]'
                }`}
              >
                <Beer className="w-4 h-4" />
                <span>{isDrunkActive ? 'Drunk Aktif' : 'Aktifkan Drunk'}</span>
              </button>
            </div>

            {/* Target Character Count Summary Bar */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#E5DFD5]">
                  Target Komposisi Tas untuk {playerCount} Pemain:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAutoBalanceBag(isDrunkActive)}
                    className="px-3 py-1.5 rounded-lg bg-[#251E33] hover:bg-[#35284B] text-[11px] font-bold text-[#D4AF37] border border-[#44355D] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Isi Otomatis Rekomendasi</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                {/* Townsfolk Counter */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    currentCounts.townsfolk === requiredTownsfolkInBag
                      ? 'bg-[#1E293B]/70 border-[#3B82F6] text-[#93C5FD]'
                      : 'bg-[#1C1628] border-[#382F4C] text-[#C4BCAD]'
                  }`}
                >
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#60A5FA]">
                      Townsfolk {isDrunkActive && '(+1 Drunk)'}
                    </span>
                    <span className="text-[10px] text-[#A8A092]">Warga Kota</span>
                  </div>
                  <span className="font-mono text-lg font-black tabular-nums">
                    {currentCounts.townsfolk}/{requiredTownsfolkInBag}
                  </span>
                </div>

                {/* Outsider Counter */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    currentCounts.outsiders === requiredOutsidersInBag
                      ? 'bg-[#162738]/70 border-[#38BDF8] text-[#7DD3FC]'
                      : 'bg-[#1C1628] border-[#382F4C] text-[#C4BCAD]'
                  }`}
                >
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
                      Outsider Lain
                    </span>
                    <span className="text-[10px] text-[#A8A092]">
                      {isDrunkActive ? 'Drunk diganti Townsfolk' : 'Warga Luar'}
                    </span>
                  </div>
                  <span className="font-mono text-lg font-black tabular-nums">
                    {currentCounts.outsiders}/{requiredOutsidersInBag}
                  </span>
                </div>

                {/* Minions Counter */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    currentCounts.minions === requiredMinionsInBag
                      ? 'bg-[#2E161A]/70 border-[#EF4444] text-[#FCA5A5]'
                      : 'bg-[#1C1628] border-[#382F4C] text-[#C4BCAD]'
                  }`}
                >
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#EF4444]">
                      Minion
                    </span>
                    <span className="text-[10px] text-[#A8A092]">Anak Buah Evil</span>
                  </div>
                  <span className="font-mono text-lg font-black tabular-nums">
                    {currentCounts.minions}/{requiredMinionsInBag}
                  </span>
                </div>

                {/* Demon Counter */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    currentCounts.demons === requiredDemonsInBag
                      ? 'bg-[#351418]/70 border-[#DC2626] text-[#FCA5A5]'
                      : 'bg-[#1C1628] border-[#382F4C] text-[#C4BCAD]'
                  }`}
                >
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#DC2626]">
                      Demon (Imp)
                    </span>
                    <span className="text-[10px] text-[#A8A092]">Iblis Utama</span>
                  </div>
                  <span className="font-mono text-lg font-black tabular-nums">
                    {currentCounts.demons}/{requiredDemonsInBag}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Selection Grid for Bag */}
          <div className="bg-[#181520] border border-[#2A2636] rounded-3xl p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Pilih Karakter untuk Dimasukkan ke Tas Pemain
              </h2>
              <p className="text-xs text-[#A8A092] mt-0.5">
                Ketuk karakter untuk menambah atau menghapus dari tas.
              </p>
            </div>

            {/* Townsfolk Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#60A5FA]">
                  Townsfolk (Pilih {requiredTownsfolkInBag} Karakter)
                </h3>
                <span className="text-xs text-[#93C5FD] font-mono font-bold">
                  {currentCounts.townsfolk}/{requiredTownsfolkInBag}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {ROLES.filter((r) => r.team === 'townsfolk').map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRoleInBag(role.id)}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer text-left transition-all ${
                        isSelected
                          ? 'bg-[#1E293B] border-[#3B82F6] ring-2 ring-[#60A5FA]/50 text-white shadow-md'
                          : 'bg-[#14121B] hover:bg-[#1D1926] border-[#292336] text-[#A8A092]'
                      }`}
                    >
                      <img
                        src={`/tokens/${role.id}.png`}
                        alt={role.name}
                        className="w-8 h-8 rounded-full object-contain shrink-0 filter drop-shadow"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate text-white">{role.name}</div>
                        <div className="text-[10px] text-[#A8A092] truncate">{role.indonesianName}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#60A5FA] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outsiders Section (Other than Drunk) */}
            <div className="space-y-2.5 pt-3 border-t border-[#292336]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                  Outsider Lainnya (Pilih {requiredOutsidersInBag} Karakter)
                </h3>
                <span className="text-xs text-[#7DD3FC] font-mono font-bold">
                  {currentCounts.outsiders}/{requiredOutsidersInBag}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ROLES.filter((r) => r.team === 'outsider' && r.id !== 'drunk').map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRoleInBag(role.id)}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer text-left transition-all ${
                        isSelected
                          ? 'bg-[#162738] border-[#38BDF8] ring-2 ring-[#7DD3FC]/50 text-white shadow-md'
                          : 'bg-[#14121B] hover:bg-[#1D1926] border-[#292336] text-[#A8A092]'
                      }`}
                    >
                      <img
                        src={`/tokens/${role.id}.png`}
                        alt={role.name}
                        className="w-8 h-8 rounded-full object-contain shrink-0 filter drop-shadow"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate text-white">{role.name}</div>
                        <div className="text-[10px] text-[#A8A092] truncate">{role.indonesianName}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#38BDF8] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minions Section */}
            <div className="space-y-2.5 pt-3 border-t border-[#292336]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#EF4444]">
                  Minion (Pilih {requiredMinionsInBag} Karakter)
                </h3>
                <span className="text-xs text-[#FCA5A5] font-mono font-bold">
                  {currentCounts.minions}/{requiredMinionsInBag}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ROLES.filter((r) => r.team === 'minion').map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRoleInBag(role.id)}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer text-left transition-all ${
                        isSelected
                          ? 'bg-[#2E161A] border-[#EF4444] ring-2 ring-[#F87171]/50 text-white shadow-md'
                          : 'bg-[#14121B] hover:bg-[#1D1926] border-[#292336] text-[#A8A092]'
                      }`}
                    >
                      <img
                        src={`/tokens/${role.id}.png`}
                        alt={role.name}
                        className="w-8 h-8 rounded-full object-contain shrink-0 filter drop-shadow"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate text-white">{role.name}</div>
                        <div className="text-[10px] text-[#A8A092] truncate">{role.indonesianName}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#EF4444] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Demon Section */}
            <div className="space-y-2.5 pt-3 border-t border-[#292336]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#DC2626]">
                  Demon (1 Karakter: Imp)
                </h3>
                <span className="text-xs text-[#FCA5A5] font-mono font-bold">1/1</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#351418] border-2 border-[#DC2626] flex items-center justify-between text-white max-w-sm">
                <div className="flex items-center gap-3">
                  <img
                    src="/tokens/imp.png"
                    alt="Imp"
                    className="w-8 h-8 rounded-full object-contain shrink-0 filter drop-shadow"
                  />
                  <div>
                    <div className="font-bold text-sm text-white">Imp</div>
                    <div className="text-[10px] text-[#A8A092]">Iblis Utama Trouble Brewing</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#DC2626] text-white text-[10px] font-black uppercase">
                  Terkunci
                </span>
              </div>
            </div>
          </div>

          {/* Menu 1 Bottom Navigation Bar */}
          <div className="bg-[#181520] border border-[#2A2636] rounded-3xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${isMenu1Valid ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                />
                <span className="font-bold text-sm text-white">
                  {isMenu1Valid
                    ? 'Komposisi Tas Sempurna!'
                    : 'Komposisi Tas Belum Lengkap'}
                </span>
              </div>
              <p className="text-xs text-[#A8A092] mt-0.5">
                {isMenu1Valid
                  ? 'Klik tombol di kanan untuk lanjut mengetik nama pemain & pembagian kursi!'
                  : 'Pastikan jumlah karakter Townsfolk, Outsider, dan Minion sesuai target di atas.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleProceedToMenu2}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>Lanjut ke Menu 02: Input Nama & Kursi</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* MENU 2: INPUT NAMA & KURSI PEMAIN SEKALIGUS */}
      {activeMenu === 2 && (
        <motion.div
          key="menu-2"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Menu 2 Header Controls */}
          <div className="bg-[#181520] border border-[#2A2636] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  Input Nama Pemain & Kursi Sekaligus ({playerCount} Kursi)
                </h2>
                <p className="text-xs text-[#A8A092] mt-0.5">
                  Ketik nama pemain di setiap kursi dan atur peran yang mereka terima. Kolom sengaja dikosongkan tanpa nilai bawaan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShuffleSeats}
                  className="px-3 py-1.5 rounded-xl bg-[#251E33] hover:bg-[#342B47] text-xs font-bold text-[#D4AF37] border border-[#3E3454] flex items-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Acak Posisi</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearNames}
                  className="px-3 py-1.5 rounded-xl bg-[#1F192C] hover:bg-[#2B233D] text-xs font-semibold text-[#A8A092] border border-[#332A47] cursor-pointer"
                >
                  Kosongkan Nama
                </button>
              </div>
            </div>

            {isDrunkActive && (
              <div className="p-3.5 rounded-2xl bg-[#241A10] border border-[#D97706]/70 flex items-center gap-3 text-xs text-[#FDE68A]">
                <Beer className="w-5 h-5 text-[#F59E0B] shrink-0" />
                <span>
                  <strong>Informasi Drunk:</strong> Semua pemain baik memegang kartu Townsfolk. Begitu Anda klik &quot;Mulai Permainan Grimoire&quot;, sistem akan meminta Anda memilih siapa salah satu pemain Townsfolk tersebut yang sebenarnya adalah The Drunk!
                </span>
              </div>
            )}
          </div>

          {/* Seat Rows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {seats.map((seat, index) => {
              const role = ROLE_MAP[seat.roleId];
              return (
                <div
                  key={seat.seatIndex}
                  className="p-4 rounded-2xl bg-[#171320] border border-[#2A2438] hover:border-[#3E3452] space-y-3 transition-colors shadow-md"
                >
                  {/* Seat Number + Name Input */}
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[#120F1A] border-2 border-[#D4AF37] font-mono text-xs font-black text-[#FDE68A] flex items-center justify-center shrink-0 tabular-nums shadow-sm">
                      {index + 1}
                    </span>

                    <input
                      type="text"
                      value={seat.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSeats((prev) =>
                          prev.map((s) =>
                            s.seatIndex === seat.seatIndex ? { ...s, name: val } : s
                          )
                        );
                      }}
                      placeholder={`Ketik nama pemain kursi ${index + 1}...`}
                      className="w-full px-3 py-2 rounded-xl bg-[#100D16] border border-[#342C44] focus:border-[#D4AF37] focus:outline-none text-xs sm:text-sm text-white placeholder-[#686074] font-medium"
                    />
                  </div>

                  {/* Role Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleSearchQuery('');
                        setActiveSeatRolePickerIdx(seat.seatIndex);
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-colors text-left ${
                        role?.team === 'townsfolk'
                          ? 'bg-[#162133] hover:bg-[#1E2C44] border-[#3B82F6]/60 text-white'
                          : role?.team === 'outsider'
                          ? 'bg-[#132333] hover:bg-[#1A3047] border-[#38BDF8]/60 text-white'
                          : role?.team === 'minion'
                          ? 'bg-[#291417] hover:bg-[#381B20] border-[#EF4444]/60 text-white'
                          : 'bg-[#331215] hover:bg-[#45181C] border-[#DC2626]/70 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={`/tokens/${seat.roleId}.png`}
                          alt={role?.name || ''}
                          className="w-8 h-8 rounded-full object-contain shrink-0 filter drop-shadow"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm truncate">
                              {role?.name}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                role?.team === 'townsfolk'
                                  ? 'bg-[#3B82F6]/30 text-[#93C5FD]'
                                  : role?.team === 'outsider'
                                  ? 'bg-[#38BDF8]/30 text-[#7DD3FC]'
                                  : role?.team === 'minion'
                                  ? 'bg-[#EF4444]/30 text-[#FCA5A5]'
                                  : 'bg-[#DC2626]/40 text-[#FECACA]'
                              }`}
                            >
                              {role?.team}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#A8A092] truncate">
                            {role?.indonesianName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#A8A092] shrink-0 font-medium">
                        <span>Ganti</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Menu 2 Bottom Actions Bar */}
          <div className="bg-[#181520] border border-[#2A2636] rounded-3xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setActiveMenu(1)}
              className="px-5 py-2.5 rounded-xl bg-[#221B2E] hover:bg-[#302742] text-xs font-bold text-[#EDE7DB] border border-[#382E4D] flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Menu 01</span>
            </button>

            <button
              type="button"
              onClick={handleStartGame}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Mulai Permainan Grimoire</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Role Picker Modal for Menu 2 (Swap/Assign role to seat) */}
      <AnimatePresence>
        {activeSeatRolePickerIdx !== null && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pilih Peran Kursi"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#15121D] border-2 border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              <div className="flex items-center justify-between px-5 py-4 bg-[#1C1726] border-b border-[#2E283C]">
                <div>
                  <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                    Pilih Peran untuk Kursi
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-black text-white">
                    Kursi {activeSeatRolePickerIdx + 1}: {seats[activeSeatRolePickerIdx]?.name || 'Tanpa Nama'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSeatRolePickerIdx(null)}
                  aria-label="Tutup Pilihan"
                  className="w-9 h-9 rounded-xl bg-[#292336] hover:bg-[#3B324E] text-[#EDE7DB] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Roles from Bag to choose from */}
              <div className="p-5 overflow-y-auto space-y-4">
                <p className="text-xs text-[#A8A092]">
                  Pilih salah satu karakter yang telah Anda siapkan di dalam tas:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedRoleIds
                    .filter((id) => id !== 'drunk')
                    .map((rId) => {
                      const r = ROLE_MAP[rId];
                      if (!r) return null;
                      const isCurrent = seats[activeSeatRolePickerIdx]?.roleId === rId;
                      const takenBy = seats.find(
                        (s) => s.seatIndex !== activeSeatRolePickerIdx && s.roleId === rId
                      );

                      return (
                        <button
                          key={rId}
                          type="button"
                          onClick={() => handleAssignSeatRole(activeSeatRolePickerIdx, rId)}
                          className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer text-left transition-all ${
                            isCurrent
                              ? 'bg-[#292236] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                              : 'bg-[#181423] hover:bg-[#231D31] border-[#2C243A]'
                          }`}
                        >
                          <img
                            src={`/tokens/${r.id}.png`}
                            alt={r.name}
                            className="w-8 h-8 rounded-full object-contain shrink-0 filter drop-shadow"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs sm:text-sm text-white truncate">
                                {r.name}
                              </span>
                              {isCurrent ? (
                                <span className="px-1.5 py-0.5 rounded bg-[#D4AF37] text-[#121016] text-[10px] font-black shrink-0">
                                  Dipilih
                                </span>
                              ) : takenBy ? (
                                <span className="text-[10px] text-[#A8A092] truncate shrink-0">
                                  Kursi {takenBy.seatIndex + 1}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-[#A8A092] truncate">{r.indonesianName}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
