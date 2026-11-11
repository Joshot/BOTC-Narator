'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight,
  Beer,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Compass,
  Dices,
  Eye,
  EyeOff,
  Moon,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROLES, ROLE_MAP, calculateBalancedBag } from '@/lib/botc-data';
import {
  PlayerSeat,
  clampPlayerCount,
  computeSafeDemonBluffs,
  getBaseCharacterCounts,
  getEffectiveCharacterCounts,
  validateRoleBag,
  validateRoleSelection,
} from '@/lib/botc-engine';
import { CharacterToken, RoleGlyph } from './TokenArtwork';

interface WebPlayModeProps {
  onCancelToDashboard: () => void;
  onCompleteWebPlay: (payload: {
    playerCount: number;
    selectedRoleIds: string[];
    isDrunkActive: boolean;
    drunkFakeRoleId: string | null;
    demonBluffIds: string[];
    players: PlayerSeat[];
  }) => void;
}

type WebPlaySubStep = 'setup' | 'rolling' | 'drunk_assign' | 'countdown';

interface RolledSeatData {
  seatIndex: number;
  name: string;
  trueRoleId: string;
  perceivedRoleId: string;
}

function generateAutoRoles(
  count: number,
  isDrunk: boolean
): {
  selectedRoleIds: string[];
  drunkFakeRoleId: string | null;
} {
  const base = getBaseCharacterCounts(count);
  const targetTownsfolk = isDrunk ? base.townsfolk + 1 : base.townsfolk;
  const targetOutsiders = isDrunk ? Math.max(0, base.outsiders - 1) : base.outsiders;

  const allTownsfolk = ROLES.filter((r) => r.team === 'townsfolk').map((r) => r.id);
  const allOutsiders = ROLES.filter((r) => r.team === 'outsider' && r.id !== 'drunk').map((r) => r.id);
  const allMinions = ROLES.filter((r) => r.team === 'minion' && r.id !== 'baron').map((r) => r.id);

  const chosenTf = allTownsfolk.slice(0, targetTownsfolk);
  const chosenOut = allOutsiders.slice(0, targetOutsiders);
  const chosenMin = allMinions.slice(0, base.minions);

  return {
    selectedRoleIds: [...chosenTf, ...chosenOut, ...chosenMin, 'imp'],
    drunkFakeRoleId: isDrunk && chosenTf.length > 0 ? chosenTf[chosenTf.length - 1] : null,
  };
}

export default function WebPlayMode({
  onCancelToDashboard,
  onCompleteWebPlay,
}: WebPlayModeProps) {
  // ================= STEP 1: SETUP STATE =================
  const [subStep, setSubStep] = useState<WebPlaySubStep>('setup');
  const [playerCount, setPlayerCount] = useState<number>(8);
  // Default Drunk is STRICTLY nonaktif (false) unless user randomizes or explicitly activates it
  const [isDrunkActive, setIsDrunkActive] = useState<boolean>(false);
  // Default selected roles is STRICTLY 0 (empty array)
  const [{ selectedRoleIds, drunkFakeRoleId }, setRolesState] = useState<{
    selectedRoleIds: string[];
    drunkFakeRoleId: string | null;
  }>({
    selectedRoleIds: [],
    drunkFakeRoleId: null,
  });
  const [setupError, setSetupError] = useState<string | null>(null);
  const [randomFormulaInfo, setRandomFormulaInfo] = useState<{
    formulaSummary: string;
    formulaDetails: string[];
  } | null>(null);

  const setSelectedRoleIds = (updater: (prev: string[]) => string[]) => {
    setRolesState((prev) => {
      const nextRoles = updater(prev.selectedRoleIds);
      return { ...prev, selectedRoleIds: nextRoles };
    });
  };

  const setDrunkFakeRoleId = (roleId: string | null) => {
    setRolesState((prev) => ({ ...prev, drunkFakeRoleId: roleId }));
  };

  const handleUpdatePlayerCount = (cnt: number) => {
    setPlayerCount(cnt);
    setSetupError(null);
    // User requested: do NOT auto-fill roles or auto-activate Drunk!
  };

  const handleToggleDrunk = () => {
    const nextDrunk = !isDrunkActive;
    setIsDrunkActive(nextDrunk);
    setSetupError(null);
  };

  const handleRandomizeBalancedBag = () => {
    setSetupError(null);
    const result = calculateBalancedBag(playerCount);
    setIsDrunkActive(result.isDrunkActive);
    setRolesState({
      selectedRoleIds: result.selectedRoleIds,
      drunkFakeRoleId: result.drunkFakeRoleId,
    });
    setRandomFormulaInfo({
      formulaSummary: result.formulaSummary,
      formulaDetails: result.formulaDetails,
    });
  };

  const handleClearRoles = () => {
    setSetupError(null);
    setIsDrunkActive(false);
    setRolesState({
      selectedRoleIds: [],
      drunkFakeRoleId: null,
    });
    setRandomFormulaInfo(null);
  };

  const effectiveCounts = useMemo(() => {
    return getEffectiveCharacterCounts(playerCount, selectedRoleIds, isDrunkActive);
  }, [playerCount, selectedRoleIds, isDrunkActive]);

  const selectedTownsfolk = useMemo(
    () => selectedRoleIds.filter((id) => ROLE_MAP[id]?.team === 'townsfolk'),
    [selectedRoleIds]
  );
  const selectedOutsiders = useMemo(
    () => selectedRoleIds.filter((id) => ROLE_MAP[id]?.team === 'outsider' && id !== 'drunk'),
    [selectedRoleIds]
  );
  const selectedMinions = useMemo(
    () => selectedRoleIds.filter((id) => ROLE_MAP[id]?.team === 'minion'),
    [selectedRoleIds]
  );
  const selectedDemons = useMemo(
    () => selectedRoleIds.filter((id) => ROLE_MAP[id]?.team === 'demon'),
    [selectedRoleIds]
  );

  const effectiveDrunkFakeRoleId = useMemo(() => {
    if (!isDrunkActive) return null;
    if (drunkFakeRoleId && selectedTownsfolk.includes(drunkFakeRoleId)) {
      return drunkFakeRoleId;
    }
    return selectedTownsfolk[selectedTownsfolk.length - 1] ?? null;
  }, [isDrunkActive, drunkFakeRoleId, selectedTownsfolk]);

  const validation = useMemo(() => {
    return validateRoleBag(playerCount, selectedRoleIds, isDrunkActive);
  }, [playerCount, selectedRoleIds, isDrunkActive]);

  // Role toggling for setup
  const handleToggleRole = (roleId: string) => {
    setSetupError(null);
    if (roleId === 'imp') return; // 1 Imp locked
    if (roleId === 'drunk') {
      handleToggleDrunk();
      return;
    }

    const role = ROLE_MAP[roleId];
    if (!role) return;

    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    } else {
      if (role.team === 'demon') {
        setSelectedRoleIds((prev) => [
          ...prev.filter((id) => ROLE_MAP[id]?.team !== 'demon'),
          roleId,
        ]);
        return;
      }
      setSelectedRoleIds((prev) => [...prev, roleId]);
    }
  };

  const handleAutoSelect = () => {
    setSetupError(null);
    setRolesState(generateAutoRoles(playerCount, isDrunkActive));
  };

  // ================= STEP 2: ROLLING DECK STATE =================
  const [shuffledDeck, setShuffledDeck] = useState<
    Array<{ trueRoleId: string; perceivedRoleId: string }>
  >([]);
  const [currentSeatIndex, setCurrentSeatIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [playerNameInput, setPlayerNameInput] = useState<string>('');
  const [rollError, setRollError] = useState<string | null>(null);
  const [assignedSeats, setAssignedSeats] = useState<RolledSeatData[]>([]);

  // Post-roll Drunk assignment state
  const [selectedDrunkSeatIndex, setSelectedDrunkSeatIndex] = useState<number | null>(null);
  const [drunkAssignError, setDrunkAssignError] = useState<string | null>(null);

  // Start the rolling phase after setup validation
  const handleStartRolling = () => {
    if (!validation.isValid) {
      setSetupError(validation.errors[0] || 'Komposisi karakter belum valid.');
      return;
    }

    // Build the secret deck with physical chosen roles
    const deckItems = selectedRoleIds.map((trueId) => ({
      trueRoleId: trueId,
      perceivedRoleId: trueId,
    }));

    // Cryptographic-grade random shuffle
    for (let i = deckItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckItems[i], deckItems[j]] = [deckItems[j], deckItems[i]];
    }

    setShuffledDeck(deckItems);
    setCurrentSeatIndex(0);
    setIsFlipped(false);
    setIsRolling(false);
    setPlayerNameInput('');
    setRollError(null);
    setAssignedSeats([]);
    setSelectedDrunkSeatIndex(null);
    setDrunkAssignError(null);
    setSubStep('rolling');
  };

  // Trigger the coin roll flip
  const handleRollCoin = () => {
    if (isRolling || isFlipped) return;
    setIsRolling(true);
    setRollError(null);

    // Flip animation completes after 1.2s
    setTimeout(() => {
      setIsRolling(false);
      setIsFlipped(true);
    }, 1200);
  };

  // Complete current player seat and advance to next seat or Drunk picker / countdown
  const handleNextPlayer = () => {
    const trimmed = playerNameInput.trim();
    if (!trimmed) {
      setRollError('Harap ketik nama pemain terlebih dahulu sebelum melanjutkan!');
      return;
    }

    const currentCard = shuffledDeck[currentSeatIndex];
    if (!currentCard) return;

    const newAssigned: RolledSeatData = {
      seatIndex: currentSeatIndex,
      name: trimmed,
      trueRoleId: currentCard.trueRoleId,
      perceivedRoleId: currentCard.perceivedRoleId,
    };

    const nextAssigned = [...assignedSeats, newAssigned];
    setAssignedSeats(nextAssigned);

    // If there are still more players to roll:
    if (currentSeatIndex + 1 < playerCount) {
      setCurrentSeatIndex((prev) => prev + 1);
      // Strictly reset flip state so next player must roll their own coin!
      setIsFlipped(false);
      setIsRolling(false);
      setPlayerNameInput('');
      setRollError(null);
    } else {
      // All players have rolled!
      if (isDrunkActive) {
        // Find all candidates who rolled Townsfolk roles
        const townsfolkCandidates = nextAssigned.filter(
          (s) => ROLE_MAP[s.perceivedRoleId]?.team === 'townsfolk'
        );
        setSelectedDrunkSeatIndex(
          townsfolkCandidates.length > 0 ? townsfolkCandidates[0].seatIndex : null
        );
        setDrunkAssignError(null);
        setSubStep('drunk_assign');
      } else {
        setCountdownSeconds(3);
        setSubStep('countdown');
      }
    }
  };

  // Confirm designated Drunk candidate and start countdown
  const handleConfirmDrunkAndStart = () => {
    if (selectedDrunkSeatIndex === null) {
      setDrunkAssignError('Pilih salah satu pemain Townsfolk di bawah ini untuk menjadi The Drunk.');
      return;
    }

    const updatedSeats = assignedSeats.map((s) => {
      if (s.seatIndex === selectedDrunkSeatIndex) {
        return {
          ...s,
          trueRoleId: 'drunk',
        };
      }
      return {
        ...s,
        trueRoleId: s.perceivedRoleId,
      };
    });

    const drunkSeat = updatedSeats.find((s) => s.seatIndex === selectedDrunkSeatIndex);
    if (drunkSeat) {
      setDrunkFakeRoleId(drunkSeat.perceivedRoleId);
    }

    setAssignedSeats(updatedSeats);
    setCountdownSeconds(3);
    setSubStep('countdown');
  };

  // ================= STEP 3: 3-SECOND COUNTDOWN STATE =================
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);

  useEffect(() => {
    if (subStep !== 'countdown') return;

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [subStep]);

  const hasCompletedRef = useRef(false);

  // When countdown hits 0, build the full session and launch Grimoire
  useEffect(() => {
    if (subStep === 'countdown' && countdownSeconds === 0) {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      // Build final PlayerSeat[] array
      const finalSeats: PlayerSeat[] = assignedSeats.map((item) => {
        const isDrunk = item.trueRoleId === 'drunk';
        return {
          id: `seat-${item.seatIndex + 1}`,
          seatIndex: item.seatIndex,
          name: item.name,
          trueRoleId: item.trueRoleId,
          perceivedRoleId: item.perceivedRoleId,
          isAlive: true,
          hasGhostVote: true,
          reminders: isDrunk
            ? [{ instanceId: `rem-drunk-${item.seatIndex}`, reminderId: 'is_the_drunk' }]
            : [],
        };
      });

      // Auto-assign Red Herring for Fortune Teller if in play
      const hasFortuneTeller = finalSeats.some(
        (s) => s.perceivedRoleId === 'fortune_teller'
      );
      if (hasFortuneTeller) {
        const goodCandidates = finalSeats.filter((s) => {
          const role = ROLE_MAP[s.trueRoleId];
          return role && (role.team === 'townsfolk' || role.team === 'outsider');
        });
        if (goodCandidates.length > 0) {
          const nonFtGood = goodCandidates.filter(
            (s) => s.perceivedRoleId !== 'fortune_teller'
          );
          const pool = nonFtGood.length > 0 ? nonFtGood : goodCandidates;
          const target = pool[Math.floor(Math.random() * pool.length)];
          target.reminders.push({
            instanceId: 'rem-ft-decoy-webplay',
            reminderId: 'decoy_ft',
          });
        }
      }

      const { recommendedBluffs } = computeSafeDemonBluffs(
        selectedRoleIds,
        null
      );

      const finalSelectedRoles =
        isDrunkActive && !selectedRoleIds.includes('drunk')
          ? [...selectedRoleIds, 'drunk']
          : selectedRoleIds;

      const drunkSeat = finalSeats.find((s) => s.trueRoleId === 'drunk');
      const finalDrunkFakeRoleId = drunkSeat ? drunkSeat.perceivedRoleId : null;

      onCompleteWebPlay({
        playerCount,
        selectedRoleIds: finalSelectedRoles,
        isDrunkActive,
        drunkFakeRoleId: finalDrunkFakeRoleId,
        demonBluffIds: recommendedBluffs,
        players: finalSeats,
      });
    }
  }, [
    subStep,
    countdownSeconds,
    assignedSeats,
    playerCount,
    selectedRoleIds,
    isDrunkActive,
    effectiveDrunkFakeRoleId,
    onCompleteWebPlay,
  ]);

  // Active role displayed on coin reveal
  const currentCard = shuffledDeck[currentSeatIndex];
  // Player always sees their perceived role (so Drunk sees Townsfolk as official rule)
  const displayRole = currentCard ? ROLE_MAP[currentCard.perceivedRoleId] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* SUB-STEP 1: SETUP KARAKTER                               */}
        {/* ======================================================== */}
        {subStep === 'setup' && (
          <motion.div
            key="webplay-setup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-200 dark:border-[#2B2638]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#231A26] border border-amber-300 dark:border-[#D4AF37]/50 text-xs font-semibold text-amber-900 dark:text-[#FDE68A] uppercase tracking-wider">
                    Mode Bermain Penuh di Web
                  </span>
                  <span className="text-xs text-slate-400 dark:text-[#8E8698]">·</span>
                  <span className="text-xs text-amber-800 dark:text-[#D4AF37] font-semibold">Langkah 1: Setup Karakter</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F5EFE6]">
                  Pilih Komposisi Karakter Trouble Brewing
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A8A092]">
                  Tentukan jumlah pemain dan pilih karakter yang akan dimasukkan ke tas undian koin.
                </p>
              </div>

              <button
                type="button"
                onClick={onCancelToDashboard}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-white dark:bg-[#221D2C] hover:bg-purple-50 dark:hover:bg-[#2F293D] border border-purple-200 dark:border-[#3A334B] text-xs font-semibold text-slate-700 dark:text-[#EDE7DB] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-amber-700 dark:text-[#D4AF37]" />
                <span>Batal ke Dashboard</span>
              </button>
            </div>

            {/* Player Count Selector */}
            <div className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2D283B] rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-[#F5EFE6]">
                    Jumlah Pemain ({playerCount} Orang)
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#A8A092]">
                    Pilih kapasitas 5 hingga 15 orang sesuai standar resmi Trouble Brewing.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearRoles}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-[#1E1A29] hover:bg-purple-100 dark:hover:bg-[#2A2338] border border-purple-200 dark:border-white/[0.1] text-xs font-semibold text-slate-700 dark:text-[#C8C0B3] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-[#8E8A9E]" />
                    <span>Kosongkan (0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRandomizeBalancedBag}
                    className="brass-sheen-btn min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-105 text-[#121016] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-md border border-amber-500 dark:border-[#F59E0B]"
                  >
                    <Sparkles className="w-4 h-4 text-[#121016]" />
                    <span>Acak Karakter & Hitung Formula</span>
                  </button>
                </div>
              </div>

              {/* Quick Count Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleUpdatePlayerCount(cnt)}
                    className={`min-w-[42px] min-h-[42px] px-3 py-1.5 rounded-xl font-mono text-sm font-bold cursor-pointer transition-all ${
                      playerCount === cnt
                        ? 'bg-[#D4AF37] text-[#121016] shadow-md scale-105 border border-amber-500'
                        : 'bg-purple-50/70 dark:bg-[#221E2E] hover:bg-purple-100 dark:hover:bg-[#2D273D] text-slate-700 dark:text-[#C8C0B3] border border-purple-200 dark:border-[#352F45]'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              {/* Random Formula Breakdown Info */}
              {randomFormulaInfo && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-700 dark:text-[#F59E0B]" />
                    <span className="font-display text-sm font-bold text-amber-900 dark:text-[#FDE68A]">
                      {randomFormulaInfo.formulaSummary}
                    </span>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-[#C8C0B3] space-y-1 list-disc list-inside">
                    {randomFormulaInfo.formulaDetails.map((det, dIdx) => (
                      <li key={dIdx}>{det}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Drunk Toggle Feature matching SetupWizard */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-purple-50 dark:from-[#281D12] dark:via-[#201710] dark:to-[#17121E] border-2 border-amber-400 dark:border-[#D97706]/70 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-[#3D2611] border border-amber-300 dark:border-[#B45309] flex items-center justify-center text-amber-700 dark:text-[#F59E0B] shrink-0 mt-0.5">
                      <Beer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-sm sm:text-base font-bold text-amber-950 dark:text-[#FDE68A]">
                          Aktifkan Karakter The Drunk (Outsider)?
                        </h3>
                        {isDrunkActive && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-600 dark:bg-[#D97706] text-white dark:text-[#121016] text-[10px] font-black uppercase">
                            Aktif (+1 Townsfolk)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-900/90 dark:text-[#E5D7B7] mt-1 leading-relaxed">
                        Karena Drunk mengira dirinya adalah Townsfolk asli, <strong>jumlah Townsfolk yang Anda pilih BERTAMBAH +1</strong> (misal dari {effectiveCounts.townsfolk} menjadi {effectiveCounts.bagTownsfolk} Townsfolk). Anda memilih semua {effectiveCounts.bagTownsfolk} Townsfolk langsung di daftar Townsfolk di bawah. Nantinya setelah semua pemain selesai memutar koin dan memasukkan nama, Anda akan memilih siapa pemain yang sebenarnya menjadi The Drunk sebelum permainan dimulai!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleDrunk}
                    className={`min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 ${
                      isDrunkActive
                        ? 'bg-[#F59E0B] text-[#121016] shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-600'
                        : 'bg-white dark:bg-[#291D1A] text-slate-800 dark:text-[#EDE7DB] border border-amber-300 dark:border-[#523B2A] hover:bg-amber-50 dark:hover:bg-[#382723]'
                    }`}
                  >
                    <Beer className="w-4 h-4" />
                    <span>{isDrunkActive ? 'Drunk Aktif' : 'Aktifkan Drunk'}</span>
                  </button>
                </div>
              </div>

              {/* Official Character Counts Badge */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div
                  className={`p-3 rounded-xl border transition-colors ${
                    selectedTownsfolk.length === (isDrunkActive ? effectiveCounts.bagTownsfolk : effectiveCounts.townsfolk)
                      ? 'bg-blue-100/80 dark:bg-[#1E293B]/70 border-blue-500 dark:border-[#3B82F6] text-blue-950 dark:text-[#93C5FD]'
                      : 'bg-blue-50 dark:bg-[#131F2E] border-blue-200 dark:border-[#38BDF8]/40 text-blue-900 dark:text-[#7DD3FC]'
                  }`}
                >
                  <span className="text-[11px] font-semibold block">
                    Townsfolk {isDrunkActive && '(+1 Drunk)'}
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                    {selectedTownsfolk.length} / {isDrunkActive ? effectiveCounts.bagTownsfolk : effectiveCounts.townsfolk}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border transition-colors ${
                    selectedOutsiders.length === (isDrunkActive ? effectiveCounts.bagOutsiders : effectiveCounts.outsiders)
                      ? 'bg-teal-100/80 dark:bg-[#162738]/70 border-teal-500 dark:border-[#38BDF8] text-teal-950 dark:text-[#7DD3FC]'
                      : 'bg-teal-50 dark:bg-[#132328] border-teal-200 dark:border-[#2DD4BF]/40 text-teal-900 dark:text-[#5EEAD4]'
                  }`}
                >
                  <span className="text-[11px] font-semibold block">
                    {isDrunkActive ? 'Outsider Lain' : 'Outsider (Orang Luar)'}
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                    {selectedOutsiders.length} / {isDrunkActive ? effectiveCounts.bagOutsiders : effectiveCounts.outsiders}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border transition-colors ${
                    selectedMinions.length === effectiveCounts.minions
                      ? 'bg-rose-100/80 dark:bg-[#2A151F]/70 border-rose-500 dark:border-[#F43F5E] text-rose-950 dark:text-[#FDA4AF]'
                      : 'bg-rose-50 dark:bg-[#26151B] border-rose-200 dark:border-[#F43F5E]/40 text-rose-900 dark:text-[#FDA4AF]'
                  }`}
                >
                  <span className="text-[11px] text-rose-800 dark:text-[#FDA4AF] font-semibold block">Minion (Anak Buah)</span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                    {selectedMinions.length} / {effectiveCounts.minions}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border transition-colors ${
                    selectedDemons.length === effectiveCounts.demons
                      ? 'bg-red-100/80 dark:bg-[#33141B]/70 border-red-500 dark:border-[#EF4444] text-red-950 dark:text-[#FCA5A5]'
                      : 'bg-red-50 dark:bg-[#2B1418] border-red-200 dark:border-[#EF4444]/40 text-red-900 dark:text-[#FCA5A5]'
                  }`}
                >
                  <span className="text-[11px] text-red-800 dark:text-[#FCA5A5] font-semibold block">Demon (Iblis)</span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                    {selectedDemons.length} / {effectiveCounts.demons}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Picker List Grouped by Team */}
            <div className="space-y-4">
              {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map((team) => {
                const rolesInTeam = ROLES.filter((r) => r.team === team);
                const teamLabels = {
                  townsfolk: {
                    title: `Townsfolk (Warga Baik)${isDrunkActive ? ' — Termasuk +1 Peran untuk Drunk' : ''}`,
                    color: 'text-blue-800 dark:text-[#7DD3FC]',
                  },
                  outsider: {
                    title: 'Outsider (Orang Luar)',
                    color: 'text-teal-800 dark:text-[#5EEAD4]',
                  },
                  minion: {
                    title: 'Minion (Anak Buah Demon)',
                    color: 'text-rose-800 dark:text-[#FDA4AF]',
                  },
                  demon: {
                    title: 'Demon (Iblis Utama)',
                    color: 'text-red-800 dark:text-[#FCA5A5]',
                  },
                }[team];

                return (
                  <div key={team} className="bg-white dark:bg-[#181520] border border-purple-200 dark:border-[#2D283B] rounded-2xl p-4 space-y-3 shadow-xs dark:shadow-none">
                    <h3 className={`font-display text-sm font-bold ${teamLabels.color}`}>
                      {teamLabels.title}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {rolesInTeam.map((role) => {
                        const isDrunkRole = role.id === 'drunk';
                        const isSelected = isDrunkRole ? isDrunkActive : selectedRoleIds.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => handleToggleRole(role.id)}
                            className={`min-h-[54px] p-2 rounded-xl border flex items-center gap-2.5 text-left cursor-pointer transition-all hover:-translate-y-0.5 ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-[#292238] border-amber-500 dark:border-[#D4AF37] text-slate-900 dark:text-white shadow-md ring-1 ring-amber-400/50 dark:ring-[#D4AF37]/40'
                                : 'bg-purple-50/40 dark:bg-[#15121C] border-purple-200 dark:border-[#292436] text-slate-700 dark:text-[#A8A092] hover:border-purple-400 dark:hover:border-[#3D3750] hover:bg-white dark:hover:bg-[#1B1725]'
                            }`}
                          >
                            <img
                              src={`/tokens/${role.id}.png`}
                              alt={role.name}
                              className="w-7 h-7 rounded-full object-contain shrink-0 filter drop-shadow"
                            />
                            <div className="min-w-0">
                              <span className="block text-xs font-bold truncate leading-tight">
                                {role.name}
                              </span>
                              <span className={`block text-[10px] truncate leading-tight ${
                                isSelected ? 'text-amber-800 dark:text-[#FDE68A]/80' : 'text-slate-500 dark:text-[#8E8698]'
                              }`}>
                                {isDrunkRole && isDrunkActive ? 'Aktif (+1 Townsfolk)' : role.indonesianName}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Validation Feedback / Error */}
            {setupError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-[#2B1418] border border-red-400 dark:border-[#EF4444] text-xs text-red-900 dark:text-[#FECACA] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-[#F87171] shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            {/* Bottom Action: Proceed to Roll */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-purple-200 dark:border-[#2B2638]">
              <div className="text-xs text-slate-600 dark:text-[#A8A092]">
                {validation.isValid ? (
                  <span className="text-emerald-800 dark:text-[#6EE7B7] font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-[#10B981]" />
                    Komposisi karakter Trouble Brewing lengkap dan siap diundi.
                  </span>
                ) : (
                  <span className="text-red-700 dark:text-[#FCA5A5] font-semibold">
                    {validation.errors[0] || 'Sesuaikan jumlah peran dengan tabel komposisi resmi.'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleStartRolling}
                disabled={!validation.isValid}
                className={`w-full sm:w-auto min-h-[50px] px-8 py-3 rounded-xl font-display text-base font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                  validation.isValid
                    ? 'brass-sheen-btn bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#121016] hover:brightness-105 cursor-pointer'
                    : 'bg-purple-100/70 dark:bg-[#292436] text-slate-400 dark:text-[#716A80] cursor-not-allowed border border-purple-200 dark:border-[#3A334B] shadow-none'
                }`}
              >
                <Coins className="w-5 h-5" />
                <span>Mulai Pengundian Koin (Roll)</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SUB-STEP 2: ROLLING KOIN PER PEMAIN (PASS-AND-PLAY)      */}
        {/* ======================================================== */}
        {subStep === 'rolling' && (
          <motion.div
            key="webplay-rolling"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-[520px] flex flex-col items-center justify-center space-y-6 text-center max-w-xl mx-auto"
          >
            {/* Progress Header */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-800 dark:text-[#D4AF37] px-1">
                <span>KURSI {currentSeatIndex + 1} DARI {playerCount}</span>
                <span>{Math.round((currentSeatIndex / playerCount) * 100)}% SELESAI</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-purple-100 dark:bg-[#1C1826] overflow-hidden border border-purple-200 dark:border-[#352D45]">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] transition-all duration-500 ease-out"
                  style={{ width: `${((currentSeatIndex + (isFlipped ? 1 : 0)) / playerCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Privacy Notice Banner before flip */}
            {!isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3.5 rounded-2xl bg-amber-50 dark:bg-[#22172A] border border-amber-300 dark:border-[#D4AF37]/40 text-xs sm:text-sm text-amber-900 dark:text-[#FDE68A] space-y-1 shadow-sm dark:shadow-md"
              >
                <strong className="block font-bold text-slate-900 dark:text-white">
                  Giliran Pemain Kursi {currentSeatIndex + 1}
                </strong>
                <span>
                  Berikan perangkat ini ke pemain Kursi {currentSeatIndex + 1}. Pastikan pemain lain tidak melihat layar, lalu ketuk koin untuk memutar peran rahasia Anda!
                </span>
              </motion.div>
            )}

            {/* ================= THE COIN (FACE-DOWN / FACE-UP) ================= */}
            <div className="relative py-4 flex flex-col items-center justify-center w-full [perspective:1200px]">
              <AnimatePresence mode="wait">
                {!isFlipped ? (
                  /* ----------------- FACE-DOWN COIN ----------------- */
                  <motion.div
                    key="face-down"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      rotateY: isRolling ? 1800 : 0,
                    }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: isRolling ? 1.2 : 0.3, ease: 'easeInOut' }}
                    onClick={handleRollCoin}
                    className="relative group cursor-pointer"
                  >
                    {/* Subtle Orbiting Brass Halo behind Coin */}
                    <div className="pointer-events-none absolute -inset-4 rounded-full border border-dashed border-[#D4AF37]/40 animate-clockwork-slow" />

                    {/* Outer Coin Disc (Authentic Metallic Obsidian & Brass Medallion) */}
                    <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#4A3816] via-[#211710] to-[#0D0B12] border-4 border-[#D4AF37] shadow-[0_12px_40px_rgba(212,175,55,0.4)] flex flex-col items-center justify-center p-4 select-none transition-transform group-hover:scale-105 active:scale-95">
                      {/* Inner Engraved Brass Rim */}
                      <div className="absolute inset-3 rounded-full border-2 border-dashed border-[#D4AF37]/50 pointer-events-none animate-clockwork-reverse" />
                      <div className="absolute inset-5 rounded-full border border-[#D4AF37]/30 pointer-events-none" />

                      {/* Clocktower Center Emblem */}
                      <div className="flex flex-col items-center justify-center text-center space-y-2 z-10">
                        <div className="w-16 h-16 rounded-full bg-[#18111E] border-2 border-[#D4AF37] flex items-center justify-center shadow-lg">
                          <Coins className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                        </div>
                        <span className="font-display text-sm font-black text-[#FDE68A] tracking-widest uppercase">
                          BLOOD ON THE CLOCKTOWER
                        </span>
                        <span className="text-[10px] text-[#E2D9C8] tracking-wider font-semibold uppercase">
                          KURSI {currentSeatIndex + 1} · TROUBLE BREWING
                        </span>
                      </div>

                      {/* Hint badge */}
                      <div className="absolute -bottom-3 px-3.5 py-1 rounded-full bg-[#1A1208] border border-[#F59E0B] text-[11px] font-bold text-[#FDE68A] shadow-md uppercase tracking-wider">
                        {isRolling ? 'Memutar Koin...' : 'Ketuk untuk Memutar Koin'}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ----------------- FACE-UP REVEALED ROLE ----------------- */
                  <motion.div
                    key="face-up"
                    initial={{ scale: 0.72, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="w-full flex flex-col items-center space-y-5"
                  >
                    {/* Revealed Authentic Character Token Medallion */}
                    {displayRole && (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-60 h-60 sm:w-72 sm:h-72 select-none filter drop-shadow-[0_10px_30px_rgba(212,175,55,0.45)] transition-transform hover:scale-105">
                          <img
                            src={`/tokens/${displayRole.id}.png`}
                            alt={displayRole.name}
                            className="w-full h-full object-contain pointer-events-none rounded-full"
                          />
                        </div>

                        {/* Role Info Box */}
                        <div className="space-y-2 max-w-md px-4">
                          <div>
                            {displayRole.team === 'townsfolk' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-blue-50 dark:bg-[#102436] border border-blue-400 dark:border-[#38BDF8] text-blue-900 dark:text-[#7DD3FC]">
                                Tim Warga Baik (Townsfolk)
                              </span>
                            )}
                            {displayRole.team === 'outsider' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-teal-50 dark:bg-[#102A2E] border border-teal-400 dark:border-[#2DD4BF] text-teal-900 dark:text-[#5EEAD4]">
                                Tim Warga Baik (Outsider)
                              </span>
                            )}
                            {displayRole.team === 'minion' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-rose-50 dark:bg-[#36131D] border border-rose-400 dark:border-[#F43F5E] text-rose-900 dark:text-[#FDA4AF]">
                                Tim Jahat (Minion)
                              </span>
                            )}
                            {displayRole.team === 'demon' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-red-50 dark:bg-[#3B1117] border border-red-500 dark:border-[#EF4444] text-red-900 dark:text-[#FCA5A5]">
                                Tim Jahat (Demon Utama)
                              </span>
                            )}
                          </div>

                          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                            {displayRole.name} ({displayRole.indonesianName})
                          </h2>

                          <p className="text-xs sm:text-sm text-slate-700 dark:text-[#D6CFC2] leading-relaxed bg-white dark:bg-[#191522] border border-purple-200 dark:border-[#2B2538] rounded-xl p-3.5 shadow-sm dark:shadow-none">
                            {displayRole.ability}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Form Input: Player Name (NO DEFAULT VALUE!) */}
                    <div className="w-full max-w-sm space-y-3 text-left">
                      <label
                        htmlFor="webplay-player-name"
                        className="block text-xs font-bold text-amber-800 dark:text-[#FDE68A] uppercase tracking-wider"
                      >
                        Masukkan Nama Anda (Kursi {currentSeatIndex + 1}):
                      </label>

                      <input
                        id="webplay-player-name"
                        type="text"
                        autoFocus
                        value={playerNameInput}
                        onChange={(e) => {
                          setPlayerNameInput(e.target.value);
                          if (rollError) setRollError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNextPlayer();
                          }
                        }}
                        placeholder="Ketik nama Anda di sini..."
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#14111A] border-2 border-amber-400 dark:border-[#D4AF37]/60 focus:border-amber-600 dark:focus:border-[#F59E0B] focus:outline-none text-slate-900 dark:text-[#F5EFE6] text-base placeholder-slate-400 dark:placeholder-[#6E687A] transition-colors shadow-xs"
                      />

                      {rollError && (
                        <p className="text-xs text-red-700 dark:text-[#FCA5A5] font-semibold">
                          {rollError}
                        </p>
                      )}

                      {/* Next Button - NO BACK BUTTON as required */}
                      <button
                        type="button"
                        onClick={handleNextPlayer}
                        className="brass-sheen-btn w-full min-h-[48px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-105 text-[#121016] text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                      >
                        <span>
                          {currentSeatIndex + 1 < playerCount
                            ? `Simpan & Lanjut ke Kursi ${currentSeatIndex + 2}`
                            : isDrunkActive
                            ? 'Selesai & Lanjut Tentukan The Drunk'
                            : 'Selesai & Mulai Permainan'}
                        </span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action button if coin is still closed */}
            {!isFlipped && (
              <button
                type="button"
                onClick={handleRollCoin}
                disabled={isRolling}
                className={`min-h-[50px] px-8 py-3 rounded-xl font-display text-base font-black flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isRolling
                    ? 'bg-purple-100 dark:bg-[#282236] text-slate-500 dark:text-[#8E8698] border border-purple-200 dark:border-[#352D45] cursor-wait shadow-none'
                    : 'brass-sheen-btn bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-105 text-[#121016] cursor-pointer'
                }`}
              >
                <Dices className="w-5 h-5" />
                <span>{isRolling ? 'Koin Sedang Berputar...' : 'Putar Koin Sekarang (Roll)'}</span>
              </button>
            )}
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SUB-STEP: PENENTUAN THE DRUNK SETELAH SEMUA ROLL SELESAI */}
        {/* ======================================================== */}
        {subStep === 'drunk_assign' && (
          <motion.div
            key="webplay-drunk"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 max-w-3xl mx-auto py-4"
          >
            {/* Header */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-purple-50 to-white dark:from-[#2B1B10] dark:via-[#211624] dark:to-[#161220] border-2 border-amber-400 dark:border-[#D97706] space-y-2 shadow-lg dark:shadow-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-600 dark:bg-[#D97706] text-white dark:text-[#121016] text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Beer className="w-3.5 h-3.5" />
                  <span>Langkah Terakhir Narator</span>
                </span>
                <span className="text-xs text-slate-400 dark:text-[#A8A092]">·</span>
                <span className="text-xs text-amber-800 dark:text-[#FDE68A] font-semibold">Semua Koin Telah Diundi</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Tentukan Siapa yang Sebenarnya Adalah The Drunk
              </h2>
              <p className="text-xs sm:text-sm text-amber-950/85 dark:text-[#E5D7B7] leading-relaxed">
                Semua {playerCount} pemain telah selesai memutar koin dan memasukkan nama masing-masing. Karena karakter The Drunk aktif (+1 Townsfolk), pilih 1 pemain di bawah ini yang akan diam-diam dijadikan The Drunk oleh Narator. Pemain tersebut tetap melihat dirinya sebagai Townsfolk, namun kekuatannya tidak berfungsi.
              </p>
            </div>

            {/* List of Townsfolk Candidates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold px-1 text-slate-600 dark:text-[#A8A092]">
                <span>Pilih salah satu pemain pemegang peran Townsfolk:</span>
                <span className="text-amber-800 dark:text-[#FDE68A]">
                  {assignedSeats.filter((s) => ROLE_MAP[s.perceivedRoleId]?.team === 'townsfolk').length} Pemain Townsfolk Tersedia
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assignedSeats
                  .filter((s) => ROLE_MAP[s.perceivedRoleId]?.team === 'townsfolk')
                  .map((seat) => {
                    const role = ROLE_MAP[seat.perceivedRoleId];
                    const isSelected = selectedDrunkSeatIndex === seat.seatIndex;
                    return (
                      <button
                        key={seat.seatIndex}
                        type="button"
                        onClick={() => {
                          setSelectedDrunkSeatIndex(seat.seatIndex);
                          setDrunkAssignError(null);
                        }}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#382312] dark:to-[#25181D] border-amber-500 dark:border-[#F59E0B] shadow-md dark:shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-[1.01]'
                            : 'bg-white dark:bg-[#181424] border-purple-200 dark:border-[#312842] hover:border-amber-400 dark:hover:border-[#D4AF37]/60 hover:bg-purple-50/40 dark:hover:bg-[#201A2E]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4AF37] shrink-0 shadow">
                            <img
                              src={`/tokens/${seat.perceivedRoleId}.png`}
                              alt={role?.name || ''}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-[#D4AF37]">
                                Kursi {seat.seatIndex + 1}
                              </span>
                              {isSelected && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-600 dark:bg-[#D97706] text-white dark:text-[#121016] text-[9px] font-black uppercase">
                                  Adalah Drunk
                                </span>
                              )}
                            </div>
                            <span className="block text-base font-bold text-slate-900 dark:text-white truncate">
                              {seat.name}
                            </span>
                            <span className="block text-xs text-blue-800 dark:text-[#93C5FD] truncate">
                              {role?.name} ({role?.indonesianName})
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#F59E0B] border-[#F59E0B] text-[#121016]'
                                : 'border-purple-300 dark:border-[#4A3F5E] bg-purple-50 dark:bg-[#14101E]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Error notice if needed */}
            {drunkAssignError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-[#2B1418] border border-red-400 dark:border-[#EF4444] text-xs text-red-900 dark:text-[#FECACA] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-[#F87171] shrink-0" />
                <span>{drunkAssignError}</span>
              </div>
            )}

            {/* Confirm Button */}
            <div className="pt-4 border-t border-purple-200 dark:border-[#2D263B] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-600 dark:text-[#A8A092]">
                Pemain yang dipilih akan mendapatkan status Drunk asli di Grimoire.
              </span>

              <button
                type="button"
                onClick={handleConfirmDrunkAndStart}
                className="brass-sheen-btn w-full sm:w-auto min-h-[50px] px-8 py-3 rounded-xl font-display text-base font-bold bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-105 text-[#121016] shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Mulai Permainan (Jeda 3 Detik)</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SUB-STEP 3: 3-DETIK JEDA MENUJU MALAM TIBA               */}
        {/* ======================================================== */}
        {subStep === 'countdown' && (
          <motion.div
            key="webplay-countdown"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="min-h-[500px] flex flex-col items-center justify-center space-y-8 text-center max-w-lg mx-auto py-12"
          >
            {/* Big Circular Clocktower Countdown */}
            <div className="relative flex items-center justify-center">
              <div className="pointer-events-none absolute -inset-4 rounded-full border-2 border-dashed border-amber-400/50 dark:border-[#D4AF37]/40 animate-clockwork-slow" />
              <motion.div
                key={countdownSeconds}
                initial={{ scale: 0.55, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white dark:bg-[#181124] border-4 border-amber-500 dark:border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.35)] dark:shadow-[0_0_50px_rgba(212,175,55,0.6)] flex items-center justify-center text-center"
              >
                <span className="font-display text-5xl sm:text-6xl font-black text-amber-800 dark:text-[#FDE68A] tabular-nums">
                  {countdownSeconds > 0 ? countdownSeconds : 0}
                </span>
              </motion.div>
            </div>

            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-[#23172E] border border-amber-300 dark:border-[#D4AF37]/50 text-xs font-bold text-amber-900 dark:text-[#FDE68A] uppercase tracking-wider">
                Pengundian Peran Selesai
              </span>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F5EFE6]">
                {countdownSeconds === 3 && 'Semua peran telah berhasil diundi secara rahasia!'}
                {countdownSeconds === 2 && 'Silakan serahkan perangkat kepada Storyteller!'}
                {countdownSeconds <= 1 && 'Malam telah tiba di Ravenswood Bluff! Semua pemain silakan tutup mata...'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A8A092] max-w-md mx-auto">
                Aplikasi sedang menyiapkan Meja Grimoire dan Urutan Malam Pertama secara otomatis.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#14111C] border border-purple-200 dark:border-[#2D263B] text-xs text-slate-600 dark:text-[#716A80] font-mono shadow-xs dark:shadow-none">
              Memuat {playerCount} pemain ke Grimoire...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
