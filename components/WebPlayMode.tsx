'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
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
import { ROLES, ROLE_MAP } from '@/lib/botc-data';
import {
  PlayerSeat,
  autoSelectRoles,
  clampPlayerCount,
  computeSafeDemonBluffs,
  getEffectiveCharacterCounts,
  getUnusedTownsfolkForDrunk,
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

type WebPlaySubStep = 'setup' | 'rolling' | 'countdown';

interface RolledSeatData {
  seatIndex: number;
  name: string;
  trueRoleId: string;
  perceivedRoleId: string;
}

function generateAutoRoles(count: number): {
  selectedRoleIds: string[];
  drunkFakeRoleId: string | null;
} {
  const auto = autoSelectRoles(count, { forceDrunk: count >= 6 });
  const inPlay = new Set(auto.selectedRoleIds);
  const unused = ROLES.filter((r) => r.team === 'townsfolk' && !inPlay.has(r.id));
  return {
    selectedRoleIds: auto.selectedRoleIds,
    drunkFakeRoleId: unused[0]?.id ?? null,
  };
}

export default function WebPlayMode({
  onCancelToDashboard,
  onCompleteWebPlay,
}: WebPlayModeProps) {
  // ================= STEP 1: SETUP STATE =================
  const [subStep, setSubStep] = useState<WebPlaySubStep>('setup');
  const [playerCount, setPlayerCount] = useState<number>(8);
  const [{ selectedRoleIds, drunkFakeRoleId }, setRolesState] = useState<{
    selectedRoleIds: string[];
    drunkFakeRoleId: string | null;
  }>(() => generateAutoRoles(8));
  const [setupError, setSetupError] = useState<string | null>(null);

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
    setRolesState(generateAutoRoles(cnt));
  };

  const effectiveCounts = useMemo(() => {
    return getEffectiveCharacterCounts(playerCount, selectedRoleIds);
  }, [playerCount, selectedRoleIds]);

  const isDrunkActive = selectedRoleIds.includes('drunk');
  const unusedTownsfolkForDrunk = useMemo(() => {
    return getUnusedTownsfolkForDrunk(selectedRoleIds);
  }, [selectedRoleIds]);

  const activeDrunkFakeRoleId = useMemo(() => {
    if (!isDrunkActive) return null;
    if (drunkFakeRoleId && unusedTownsfolkForDrunk.some((tf) => tf.id === drunkFakeRoleId)) {
      return drunkFakeRoleId;
    }
    return unusedTownsfolkForDrunk[0]?.id ?? null;
  }, [isDrunkActive, drunkFakeRoleId, unusedTownsfolkForDrunk]);

  const validation = useMemo(() => {
    return validateRoleSelection(playerCount, selectedRoleIds, activeDrunkFakeRoleId);
  }, [playerCount, selectedRoleIds, activeDrunkFakeRoleId]);

  // Role toggling for setup
  const handleToggleRole = (roleId: string) => {
    setSetupError(null);
    const role = ROLE_MAP[roleId];
    if (!role) return;

    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
      if (roleId === 'drunk') {
        setDrunkFakeRoleId(null);
      }
    } else {
      if (role.team === 'demon' && selectedRoleIds.some((id) => ROLE_MAP[id]?.team === 'demon')) {
        setSelectedRoleIds((prev) => [
          ...prev.filter((id) => ROLE_MAP[id]?.team !== 'demon'),
          roleId,
        ]);
        return;
      }
      setSelectedRoleIds((prev) => [...prev, roleId]);
      if (roleId === 'drunk' && !drunkFakeRoleId && unusedTownsfolkForDrunk.length > 0) {
        setDrunkFakeRoleId(unusedTownsfolkForDrunk[0].id);
      }
    }
  };

  const handleAutoSelect = () => {
    setSetupError(null);
    setRolesState(generateAutoRoles(playerCount));
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

  // Start the rolling phase after setup validation
  const handleStartRolling = () => {
    if (!validation.isValid) {
      setSetupError(validation.errors[0] || 'Komposisi karakter belum valid.');
      return;
    }

    // Build the secret deck
    const deckItems = selectedRoleIds.map((trueId) => {
      const isDrunk = trueId === 'drunk';
      const perceivedId = isDrunk && activeDrunkFakeRoleId ? activeDrunkFakeRoleId : trueId;
      return {
        trueRoleId: trueId,
        perceivedRoleId: perceivedId,
      };
    });

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

  // Complete current player seat and advance to next seat or countdown
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
      // All players have rolled! Advance to countdown
      setCountdownSeconds(3);
      setSubStep('countdown');
    }
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

  // When countdown hits 0, build the full session and launch Grimoire
  useEffect(() => {
    if (subStep === 'countdown' && countdownSeconds === 0) {
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
        activeDrunkFakeRoleId
      );

      onCompleteWebPlay({
        playerCount,
        selectedRoleIds,
        isDrunkActive,
        drunkFakeRoleId: activeDrunkFakeRoleId,
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
    activeDrunkFakeRoleId,
    onCompleteWebPlay,
  ]);

  // Active role displayed on coin reveal
  const currentCard = shuffledDeck[currentSeatIndex];
  // Player always sees their perceived role (so Drunk sees Townsfolk as official rule)
  const displayRole = currentCard ? ROLE_MAP[currentCard.perceivedRoleId] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* ======================================================== */}
      {/* SUB-STEP 1: SETUP KARAKTER                               */}
      {/* ======================================================== */}
      {subStep === 'setup' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2B2638]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#231A26] border border-[#D4AF37]/50 text-xs font-semibold text-[#FDE68A] uppercase tracking-wider">
                  Mode Bermain Penuh di Web
                </span>
                <span className="text-xs text-[#8E8698]">·</span>
                <span className="text-xs text-[#D4AF37] font-medium">Langkah 1: Setup Karakter</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F5EFE6]">
                Pilih Komposisi Karakter Trouble Brewing
              </h1>
              <p className="text-xs sm:text-sm text-[#A8A092]">
                Tentukan jumlah pemain dan pilih karakter yang akan dimasukkan ke tas undian koin.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancelToDashboard}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#221D2C] hover:bg-[#2F293D] border border-[#3A334B] text-xs font-semibold text-[#EDE7DB] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
              <span>Batal ke Dashboard</span>
            </button>
          </div>

          {/* Player Count Selector */}
          <div className="bg-[#181520] border border-[#2D283B] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#F5EFE6]">
                  Jumlah Pemain ({playerCount} Orang)
                </h2>
                <p className="text-xs text-[#A8A092]">
                  Pilih kapasitas 5 hingga 15 orang sesuai standar resmi Trouble Brewing.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAutoSelect}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#231A26] hover:bg-[#34243A] border border-[#D4AF37]/60 text-xs font-bold text-[#FDE68A] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Pilih Karakter Otomatis</span>
              </button>
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
                      ? 'bg-[#D4AF37] text-[#121016] shadow-md scale-105'
                      : 'bg-[#221E2E] hover:bg-[#2D273D] text-[#C8C0B3] border border-[#352F45]'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            {/* Official Character Counts Badge */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-[#131F2E] border border-[#38BDF8]/40">
                <span className="text-[11px] text-[#7DD3FC] font-semibold block">Townsfolk (Warga)</span>
                <span className="text-lg font-mono font-bold text-white">
                  {selectedRoleIds.filter((id) => ROLE_MAP[id]?.team === 'townsfolk').length} / {effectiveCounts.townsfolk}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#132328] border border-[#2DD4BF]/40">
                <span className="text-[11px] text-[#5EEAD4] font-semibold block">Outsider (Orang Luar)</span>
                <span className="text-lg font-mono font-bold text-white">
                  {selectedRoleIds.filter((id) => ROLE_MAP[id]?.team === 'outsider').length} / {effectiveCounts.outsiders}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#26151B] border border-[#F43F5E]/40">
                <span className="text-[11px] text-[#FDA4AF] font-semibold block">Minion (Anak Buah)</span>
                <span className="text-lg font-mono font-bold text-white">
                  {selectedRoleIds.filter((id) => ROLE_MAP[id]?.team === 'minion').length} / {effectiveCounts.minions}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#2B1418] border border-[#EF4444]/40">
                <span className="text-[11px] text-[#FCA5A5] font-semibold block">Demon (Iblis)</span>
                <span className="text-lg font-mono font-bold text-white">
                  {selectedRoleIds.filter((id) => ROLE_MAP[id]?.team === 'demon').length} / {effectiveCounts.demons}
                </span>
              </div>
            </div>
          </div>

          {/* Drunk Secret Assignment if active */}
          {isDrunkActive && (
            <div className="p-4 rounded-2xl bg-[#28180A] border border-[#F59E0B] space-y-3 shadow-md">
              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-[#3D250C] border border-[#D97706] text-[#FDE68A]">
                  <RoleGlyph roleId="drunk" className="w-4 h-4 text-[#F59E0B]" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-[#FDE68A]">
                    Pengaturan The Drunk Aktif (+1 Peran Townsfolk Palsu)
                  </h3>
                  <p className="text-xs text-[#FDE68A]/80 leading-relaxed">
                    Pemain yang mendapatkan peran Drunk saat koin diundi akan melihat peran Townsfolk palsu ini dan mengira dirinya adalah Townsfolk tersebut.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#D4AF37] font-semibold">Peran yang Ditampilkan ke Drunk:</span>
                <select
                  value={activeDrunkFakeRoleId ?? ''}
                  onChange={(e) => setDrunkFakeRoleId(e.target.value || null)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#1A1208] border border-[#F59E0B] text-xs font-bold text-[#FDE68A] cursor-pointer"
                >
                  {unusedTownsfolkForDrunk.map((tf) => (
                    <option key={tf.id} value={tf.id}>
                      {tf.name} ({tf.indonesianName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Role Picker List Grouped by Team */}
          <div className="space-y-4">
            {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map((team) => {
              const rolesInTeam = ROLES.filter((r) => r.team === team);
              const teamLabels = {
                townsfolk: { title: 'Townsfolk (Warga Baik)', color: 'text-[#7DD3FC]', border: 'border-[#38BDF8]/40' },
                outsider: { title: 'Outsider (Orang Luar)', color: 'text-[#5EEAD4]', border: 'border-[#2DD4BF]/40' },
                minion: { title: 'Minion (Anak Buah Demon)', color: 'text-[#FDA4AF]', border: 'border-[#F43F5E]/40' },
                demon: { title: 'Demon (Iblis Utama)', color: 'text-[#FCA5A5]', border: 'border-[#EF4444]/40' },
              }[team];

              return (
                <div key={team} className="bg-[#181520] border border-[#2D283B] rounded-2xl p-4 space-y-3">
                  <h3 className={`font-display text-sm font-bold ${teamLabels.color}`}>
                    {teamLabels.title}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {rolesInTeam.map((role) => {
                      const isSelected = selectedRoleIds.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleToggleRole(role.id)}
                          className={`min-h-[50px] p-2 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#292238] border-[#D4AF37] text-white shadow-md'
                              : 'bg-[#15121C] border-[#292436] text-[#A8A092] hover:border-[#3D3750]'
                          }`}
                        >
                          <RoleGlyph roleId={role.id} className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                          <div className="min-w-0">
                            <span className="block text-xs font-bold truncate leading-tight">
                              {role.name}
                            </span>
                            <span className="block text-[10px] text-[#8E8698] truncate leading-tight">
                              {role.indonesianName}
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
            <div className="p-4 rounded-xl bg-[#2B1418] border border-[#EF4444] text-xs text-[#FECACA] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F87171] shrink-0" />
              <span>{setupError}</span>
            </div>
          )}

          {/* Bottom Action: Proceed to Roll */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#2B2638]">
            <div className="text-xs text-[#A8A092]">
              {validation.isValid ? (
                <span className="text-[#6EE7B7] font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#10B981]" />
                  Komposisi karakter Trouble Brewing lengkap dan siap diundi.
                </span>
              ) : (
                <span className="text-[#FCA5A5] font-semibold">
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
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-[#121016] hover:brightness-110 cursor-pointer'
                  : 'bg-[#292436] text-[#716A80] cursor-not-allowed border border-[#3A334B]'
              }`}
            >
              <Coins className="w-5 h-5" />
              <span>Mulai Pengundian Koin (Roll)</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-STEP 2: ROLLING KOIN PER PEMAIN (PASS-AND-PLAY)      */}
      {/* ======================================================== */}
      {subStep === 'rolling' && (
        <div className="min-h-[520px] flex flex-col items-center justify-center space-y-6 text-center max-w-xl mx-auto">
          {/* Progress Header */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#D4AF37] px-1">
              <span>KURSI {currentSeatIndex + 1} DARI {playerCount}</span>
              <span>{Math.round(((currentSeatIndex) / playerCount) * 100)}% SELESAI</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#1C1826] overflow-hidden border border-[#352D45]">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] transition-all duration-300"
                style={{ width: `${((currentSeatIndex + (isFlipped ? 1 : 0)) / playerCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Privacy Notice Banner before flip */}
          {!isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 rounded-xl bg-[#22172A] border border-[#D4AF37]/40 text-xs sm:text-sm text-[#FDE68A] space-y-1 shadow-md"
            >
              <strong className="block font-bold text-white">
                Giliran Pemain Kursi {currentSeatIndex + 1}
              </strong>
              <span>
                Berikan perangkat ini ke pemain Kursi {currentSeatIndex + 1}. Pastikan pemain lain tidak melihat layar, lalu ketuk koin untuk memutar peran rahasia Anda!
              </span>
            </motion.div>
          )}

          {/* ================= THE COIN (FACE-DOWN / FACE-UP) ================= */}
          <div className="relative py-4 flex flex-col items-center justify-center w-full">
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
                  {/* Outer Coin Disc */}
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#4A3816] via-[#211710] to-[#0D0B12] border-4 border-[#D4AF37] shadow-[0_0_35px_rgba(212,175,55,0.35)] flex flex-col items-center justify-center p-4 select-none transition-transform group-hover:scale-105 active:scale-95">
                    {/* Inner Engraved Brass Rim */}
                    <div className="absolute inset-3 rounded-full border-2 border-dashed border-[#D4AF37]/50 pointer-events-none" />
                    <div className="absolute inset-5 rounded-full border border-[#D4AF37]/30 pointer-events-none" />

                    {/* Clocktower Center Emblem */}
                    <div className="flex flex-col items-center justify-center text-center space-y-2 z-10">
                      <div className="w-16 h-16 rounded-full bg-[#18111E] border-2 border-[#D4AF37] flex items-center justify-center shadow-lg">
                        <Coins className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                      </div>
                      <span className="font-display text-sm font-black text-[#FDE68A] tracking-widest uppercase">
                        BLOOD ON THE CLOCKTOWER
                      </span>
                      <span className="text-[10px] text-[#A8A092] tracking-wider font-semibold uppercase">
                        KURSI {currentSeatIndex + 1} · TROUBLE BREWING
                      </span>
                    </div>

                    {/* Hint badge */}
                    <div className="absolute -bottom-3 px-3 py-1 rounded-full bg-[#1A1208] border border-[#F59E0B] text-[11px] font-bold text-[#FDE68A] shadow-md uppercase tracking-wider">
                      {isRolling ? 'Memutar Koin...' : 'Ketuk untuk Memutar Koin'}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ----------------- FACE-UP REVEALED ROLE ----------------- */
                <motion.div
                  key="face-up"
                  initial={{ scale: 0.7, opacity: 0, rotateY: 90 }}
                  animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="w-full flex flex-col items-center space-y-5"
                >
                  {/* Revealed Character Token */}
                  {displayRole && (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-2 rounded-full bg-[#181520] border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                        <CharacterToken
                          roleId={displayRole.id}
                          size="xl"
                          showIndonesianSubtitle={false}
                        />
                      </div>

                      {/* Role Info Box */}
                      <div className="space-y-1.5 max-w-md px-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow">
                          {displayRole.team === 'townsfolk' && (
                            <span className="bg-[#102436] border border-[#38BDF8] text-[#7DD3FC] px-2.5 py-0.5 rounded-full">
                              Tim Warga Baik (Townsfolk)
                            </span>
                          )}
                          {displayRole.team === 'outsider' && (
                            <span className="bg-[#102A2E] border border-[#2DD4BF] text-[#5EEAD4] px-2.5 py-0.5 rounded-full">
                              Tim Warga Baik (Outsider)
                            </span>
                          )}
                          {displayRole.team === 'minion' && (
                            <span className="bg-[#36131D] border border-[#F43F5E] text-[#FDA4AF] px-2.5 py-0.5 rounded-full">
                              Tim Jahat (Minion)
                            </span>
                          )}
                          {displayRole.team === 'demon' && (
                            <span className="bg-[#3B1117] border border-[#EF4444] text-[#FCA5A5] px-2.5 py-0.5 rounded-full">
                              Tim Jahat (Demon Utama)
                            </span>
                          )}
                        </div>

                        <h2 className="font-display text-2xl font-bold text-white">
                          {displayRole.name} ({displayRole.indonesianName})
                        </h2>

                        <p className="text-xs sm:text-sm text-[#D6CFC2] leading-relaxed bg-[#191522] border border-[#2B2538] rounded-xl p-3">
                          {displayRole.ability}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form Input: Player Name (NO DEFAULT VALUE!) */}
                  <div className="w-full max-w-sm space-y-3 text-left">
                    <label
                      htmlFor="webplay-player-name"
                      className="block text-xs font-bold text-[#FDE68A] uppercase tracking-wider"
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
                      className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#14111A] border-2 border-[#D4AF37]/60 focus:border-[#F59E0B] focus:outline-none text-[#F5EFE6] text-base placeholder-[#6E687A] transition-colors"
                    />

                    {rollError && (
                      <p className="text-xs text-[#FCA5A5] font-semibold">
                        {rollError}
                      </p>
                    )}

                    {/* Next Button - NO BACK BUTTON as required */}
                    <button
                      type="button"
                      onClick={handleNextPlayer}
                      className="w-full min-h-[48px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                    >
                      <span>
                        {currentSeatIndex + 1 < playerCount
                          ? `Simpan & Lanjut ke Kursi ${currentSeatIndex + 2}`
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
                  ? 'bg-[#282236] text-[#8E8698] cursor-wait'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] cursor-pointer'
              }`}
            >
              <Dices className="w-5 h-5" />
              <span>{isRolling ? 'Koin Sedang Berputar...' : 'Putar Koin Sekarang (Roll)'}</span>
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-STEP 3: 3-DETIK JEDA MENUJU MALAM TIBA               */}
      {/* ======================================================== */}
      {subStep === 'countdown' && (
        <div className="min-h-[500px] flex flex-col items-center justify-center space-y-8 text-center max-w-lg mx-auto py-12">
          {/* Big Circular Countdown */}
          <motion.div
            key={countdownSeconds}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#181124] border-4 border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.6)] flex items-center justify-center text-center"
          >
            <span className="font-display text-5xl sm:text-6xl font-black text-[#FDE68A] tabular-nums">
              {countdownSeconds > 0 ? countdownSeconds : 0}
            </span>
          </motion.div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#23172E] border border-[#D4AF37]/50 text-xs font-bold text-[#FDE68A] uppercase tracking-wider">
              Pengundian Peran Selesai
            </span>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5EFE6]">
              {countdownSeconds === 3 && 'Semua peran telah berhasil diundi secara rahasia!'}
              {countdownSeconds === 2 && 'Silakan serahkan perangkat kepada Storyteller!'}
              {countdownSeconds <= 1 && 'Malam telah tiba di Ravenswood Bluff! Semua pemain silakan tutup mata...'}
            </h2>

            <p className="text-xs sm:text-sm text-[#A8A092] max-w-md mx-auto">
              Aplikasi sedang menyiapkan Meja Grimoire dan Urutan Malam Pertama secara otomatis.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#14111C] border border-[#2D263B] text-xs text-[#716A80] font-mono">
            Memuat {playerCount} pemain ke Grimoire...
          </div>
        </div>
      )}
    </div>
  );
}
