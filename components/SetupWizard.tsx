'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Beer,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Users,
} from 'lucide-react';
import {
  CHARACTER_COUNTS,
  ROLE_MAP,
  ROLES,
  TeamType,
} from '@/lib/botc-data';
import {
  PlayerSeat,
  assignRolesToPlayers,
  autoSelectRoles,
  clampPlayerCount,
  computeSafeDemonBluffs,
  getUnusedTownsfolkForDrunk,
  validateRoleBag,
  validateRoleSelection,
} from '@/lib/botc-engine';
import { CharacterToken, RoleGlyph } from './TokenArtwork';
import { SilentCardPayload } from './FullscreenCardModal';

const WIZARD_DRAFT_KEY = 'botc_tb_wizard_draft_v2';

interface WizardDraft {
  step: 1 | 2 | 3;
  playerCount: number;
  selectedRoleIds: string[];
  playerNames: string[];
  drunkFakeRoleId: string | null;
  drunkSeatIdx: number;
  assignedRolesBySeat: string[];
}

interface SetupWizardProps {
  initialPlayerCount: number;
  initialStep?: 1 | 2 | 3;
  onStepChange?: (step: 1 | 2 | 3) => void;
  onCancelToDashboard?: () => void;
  onCompleteSetup: (payload: {
    playerCount: number;
    selectedRoleIds: string[];
    drunkFakeRoleId: string | null;
    demonBluffIds: string[];
    players: PlayerSeat[];
  }) => void;
  onQuickStartDemo: () => void;
  onShowSilentCard: (card: SilentCardPayload) => void;
}

export default function SetupWizard({
  initialPlayerCount,
  initialStep = 1,
  onStepChange,
  onCancelToDashboard,
  onCompleteSetup,
  onQuickStartDemo,
  onShowSilentCard,
}: SetupWizardProps) {
  const [step, setStepState] = useState<1 | 2 | 3>(initialStep);

  const setStep = useCallback(
    (nextStep: 1 | 2 | 3) => {
      setStepState(nextStep);
      onStepChange?.(nextStep);
    },
    [onStepChange]
  );
  const [playerCount, setPlayerCount] = useState<number>(() =>
    clampPlayerCount(initialPlayerCount)
  );

  const initialAuto = autoSelectRoles(clampPlayerCount(initialPlayerCount), {
    forceDrunk: initialPlayerCount >= 6,
    seed: 108,
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    initialAuto.selectedRoleIds
  );

  // CRITICAL REQUIREMENT: Absolutely NO default names! Start completely empty!
  const [playerNames, setPlayerNames] = useState<string[]>(() =>
    Array(clampPlayerCount(initialPlayerCount)).fill('')
  );

  // Drunk settings - selected in Step 3 after player names are entered!
  const [drunkSeatIdx, setDrunkSeatIdx] = useState<number>(0);
  const [drunkFakeRoleId, setDrunkFakeRoleId] = useState<string | null>(null);

  const [assignedRolesBySeat, setAssignedRolesBySeat] = useState<string[]>(
    initialAuto.selectedRoleIds
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [drunkLimitError, setDrunkLimitError] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // 1. Rehydrate draft from localStorage if available
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(WIZARD_DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw) as WizardDraft;
          if (draft && typeof draft.playerCount === 'number') {
            const clamped = clampPlayerCount(draft.playerCount);
            setPlayerCount(clamped);
            if (Array.isArray(draft.selectedRoleIds) && draft.selectedRoleIds.length > 0) {
              setSelectedRoleIds(draft.selectedRoleIds);
            }
            if (Array.isArray(draft.playerNames)) {
              // Keep user typed names or fill empty up to count
              const names = draft.playerNames.slice(0, clamped);
              while (names.length < clamped) names.push('');
              setPlayerNames(names);
            }
            if (draft.drunkFakeRoleId !== undefined) {
              setDrunkFakeRoleId(draft.drunkFakeRoleId);
            }
            if (typeof draft.drunkSeatIdx === 'number') {
              setDrunkSeatIdx(Math.min(clamped - 1, Math.max(0, draft.drunkSeatIdx)));
            }
            if (Array.isArray(draft.assignedRolesBySeat)) {
              setAssignedRolesBySeat(draft.assignedRolesBySeat.slice(0, clamped));
            }
            if (draft.step === 1 || draft.step === 2 || draft.step === 3) {
              setStepState(draft.step);
            }
          }
        }
      } catch {
        // Ignore parse errors
      } finally {
        setIsDraftLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // 2. Persist draft to localStorage on every change
  useEffect(() => {
    if (!isDraftLoaded) return;
    try {
      const draft: WizardDraft = {
        step,
        playerCount,
        selectedRoleIds,
        playerNames,
        drunkFakeRoleId,
        drunkSeatIdx,
        assignedRolesBySeat,
      };
      window.localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Ignore quota errors
    }
  }, [
    isDraftLoaded,
    step,
    playerCount,
    selectedRoleIds,
    playerNames,
    drunkFakeRoleId,
    drunkSeatIdx,
    assignedRolesBySeat,
  ]);

  // Adjust count handler
  const handleCountChange = (nextCountRaw: number) => {
    const nextCount = clampPlayerCount(nextCountRaw);
    setPlayerCount(nextCount);

    const nextAuto = autoSelectRoles(nextCount, {
      forceDrunk: nextCount >= 6,
    });
    setSelectedRoleIds(nextAuto.selectedRoleIds);

    // Keep existing typed names, fill empty for added seats, prune excess
    setPlayerNames((prev) => {
      const next = [...prev];
      while (next.length < nextCount) {
        next.push('');
      }
      return next.slice(0, nextCount);
    });

    setDrunkSeatIdx(0);
    setDrunkFakeRoleId(null);
    setAssignedRolesBySeat(nextAuto.selectedRoleIds);
    setNameError(null);
    setDrunkLimitError(null);
  };

  const toggleRoleInBag = (roleId: string) => {
    const role = ROLE_MAP[roleId];
    if (!role) return;

    // Imp is the sole Demon in Trouble Brewing and is always locked to 1
    if (role.team === 'demon') return;

    if (roleId === 'drunk' && !selectedRoleIds.includes('drunk')) {
      const currentDrunks = selectedRoleIds.filter((id) => id === 'drunk').length;
      if (currentDrunks >= 1) {
        setDrunkLimitError('Hanya boleh ada 1 Drunk dalam permainan! Aturan resmi Trouble Brewing membatasi Drunk maksimal 1 orang.');
        return;
      }
    }

    setDrunkLimitError(null);

    setSelectedRoleIds((prev) => {
      const exists = prev.includes(roleId);
      const next = exists ? prev.filter((id) => id !== roleId) : [...prev, roleId];

      if (!next.includes('drunk')) {
        setDrunkFakeRoleId(null);
      }
      return next;
    });
  };

  const handleAutoBalanceRoles = (withDrunk: boolean) => {
    const res = autoSelectRoles(playerCount, { forceDrunk: withDrunk });
    setSelectedRoleIds(res.selectedRoleIds);
    setDrunkFakeRoleId(null);
  };

  // Step 1 Bag validation
  const bagValidation = validateRoleBag(playerCount, selectedRoleIds);
  const unusedTownsfolkForDrunk = getUnusedTownsfolkForDrunk(selectedRoleIds);

  // Compute Safe Demon Bluffs
  const effectiveDrunkFake = selectedRoleIds.includes('drunk') ? drunkFakeRoleId : null;
  const safeBluffs = computeSafeDemonBluffs(
    selectedRoleIds,
    effectiveDrunkFake,
    108 + playerCount
  ).recommendedBluffs;

  // Navigation handlers
  const proceedToStep2 = () => {
    if (!bagValidation.isValid) return;
    setNameError(null);
    setStep(2);
  };

  const proceedToStep3 = () => {
    const trimmed = playerNames.map((n) => n.trim());
    const emptyIdx = trimmed.findIndex((n) => n.length === 0);
    if (emptyIdx !== -1) {
      setNameError(`Nama pada Kursi ${emptyIdx + 1} belum diisi. Mohon lengkapi semua nama pemain.`);
      return;
    }

    const lowerSet = new Set<string>();
    for (let i = 0; i < trimmed.length; i++) {
      const key = trimmed[i].toLowerCase();
      if (lowerSet.has(key)) {
        setNameError(`Nama "${trimmed[i]}" tertulis lebih dari satu kali. Setiap pemain harus memiliki nama unik.`);
        return;
      }
      lowerSet.add(key);
    }

    setNameError(null);

    // Prepare initial seat distribution if not set or out of sync
    const shuffledRoles = [...selectedRoleIds];
    for (let i = shuffledRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
    }

    // If Drunk is in the bag and drunkFakeRoleId is not yet chosen, pick first unused Townsfolk
    if (selectedRoleIds.includes('drunk')) {
      if (!drunkFakeRoleId || selectedRoleIds.includes(drunkFakeRoleId)) {
        setDrunkFakeRoleId(unusedTownsfolkForDrunk[0]?.id ?? null);
      }
      // Ensure the drunk role is initially at drunkSeatIdx
      const currentDrunkIdx = shuffledRoles.indexOf('drunk');
      if (currentDrunkIdx !== -1 && currentDrunkIdx !== drunkSeatIdx) {
        const temp = shuffledRoles[drunkSeatIdx];
        shuffledRoles[drunkSeatIdx] = 'drunk';
        shuffledRoles[currentDrunkIdx] = temp;
      }
    }

    setAssignedRolesBySeat(shuffledRoles);
    setStep(3);
  };

  const handleRandomizeSeatRoles = () => {
    const shuffled = [...selectedRoleIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Keep Drunk at the designated drunkSeatIdx if Drunk is active
    if (selectedRoleIds.includes('drunk')) {
      const currentDrunkIdx = shuffled.indexOf('drunk');
      if (currentDrunkIdx !== -1 && currentDrunkIdx !== drunkSeatIdx) {
        const temp = shuffled[drunkSeatIdx];
        shuffled[drunkSeatIdx] = 'drunk';
        shuffled[currentDrunkIdx] = temp;
      }
    }

    setAssignedRolesBySeat(shuffled);
  };

  const handleSeatRoleSwap = (seatIdx: number, chosenRoleId: string) => {
    setAssignedRolesBySeat((prev) => {
      const next = [...prev];
      const otherIdx = next.findIndex((r, idx) => r === chosenRoleId && idx !== seatIdx);
      if (otherIdx !== -1) {
        const oldRole = next[seatIdx];
        next[seatIdx] = chosenRoleId;
        next[otherIdx] = oldRole;
      } else {
        next[seatIdx] = chosenRoleId;
      }
      return next;
    });

    // If swapping Drunk role, sync drunkSeatIdx
    if (chosenRoleId === 'drunk') {
      setDrunkSeatIdx(seatIdx);
    }
  };

  const handleDesignateDrunkPlayer = (targetSeatIdx: number) => {
    setDrunkSeatIdx(targetSeatIdx);
    setAssignedRolesBySeat((prev) => {
      const next = [...prev];
      const oldDrunkIdx = next.indexOf('drunk');
      if (oldDrunkIdx !== -1 && oldDrunkIdx !== targetSeatIdx) {
        const targetOldRole = next[targetSeatIdx];
        next[targetSeatIdx] = 'drunk';
        next[oldDrunkIdx] = targetOldRole;
      } else if (oldDrunkIdx === -1) {
        next[targetSeatIdx] = 'drunk';
      }
      return next;
    });
  };

  const handleFinishSetup = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = playerNames.map((n) => n.trim());
    const emptyIdx = trimmed.findIndex((n) => n.length === 0);
    if (emptyIdx !== -1) {
      setNameError(`Nama pada Kursi ${emptyIdx + 1} belum diisi.`);
      setStep(2);
      return;
    }

    // Check Drunk requirements - strictly maximum 1 Drunk
    const totalDrunks = assignedRolesBySeat.filter((r) => r === 'drunk').length;
    if (totalDrunks > 1) {
      setNameError('ERROR: Hanya boleh ada 1 Drunk dalam permainan!');
      setStep(3);
      return;
    }

    if (selectedRoleIds.includes('drunk')) {
      if (!drunkFakeRoleId) {
        setNameError('Pilih 1 peran Townsfolk palsu untuk pemain Drunk.');
        return;
      }
      if (selectedRoleIds.includes(drunkFakeRoleId)) {
        setNameError('Peran Townsfolk palsu Drunk tidak boleh sama dengan Townsfolk yang sedang dimainkan.');
        return;
      }
    }

    setNameError(null);

    const players = assignRolesToPlayers(
      trimmed,
      assignedRolesBySeat,
      drunkFakeRoleId,
      { shuffleRoles: false }
    );

    // Clear wizard draft on successful game launch
    try {
      window.localStorage.removeItem(WIZARD_DRAFT_KEY);
    } catch {
      // Ignore
    }

    onCompleteSetup({
      playerCount,
      selectedRoleIds,
      drunkFakeRoleId,
      demonBluffIds: safeBluffs,
      players,
    });
  };

  const renderTeamRoleSection = (
    team: TeamType,
    title: string,
    currentCount: number,
    requiredCount: number,
    accentClass: string
  ) => {
    const teamRoles = ROLES.filter((r) => r.team === team);
    const isMatched = currentCount === requiredCount;

    return (
      <div className="space-y-3 pt-4 border-t border-[#292535] first:border-t-0 first:pt-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className={`font-display text-base font-bold ${accentClass}`}>
              {title}
            </h3>
          </div>
          <div className="text-xs font-mono tabular-nums text-[#D6CFC2]">
            Terpilih:{' '}
            <span className={isMatched ? 'text-[#6EE7B7] font-bold' : 'text-[#FCA5A5] font-bold'}>
              {currentCount} / {requiredCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {teamRoles.map((role) => {
            const isSelected = selectedRoleIds.includes(role.id);
            const isLockedDemon = role.team === 'demon';

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRoleInBag(role.id)}
                disabled={isLockedDemon}
                aria-pressed={isSelected}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all min-h-[64px] ${
                  isSelected
                    ? 'bg-[#221E2D] border-[#D4AF37]/70 shadow-sm'
                    : 'bg-[#17141F] border-[#282434] opacity-80 hover:opacity-100 hover:border-[#3D374F]'
                } ${isLockedDemon ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#110F17] border border-[#342F42] flex items-center justify-center shrink-0 mt-0.5">
                  <RoleGlyph
                    roleId={role.id}
                    className={`w-5 h-5 ${
                      role.team === 'minion' || role.team === 'demon'
                        ? 'text-[#F87171]'
                        : 'text-[#60A5FA]'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-sm text-[#F5EFE6] truncate">
                        {role.name}
                      </span>
                      {role.id === 'drunk' && (
                        <span className="text-[10px] font-mono font-bold text-[#38BDF8] bg-[#0E2033] border border-[#38BDF8]/40 px-1.5 py-0.2 rounded shrink-0">
                          Maks 1 Drunk
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#A8A092] mt-0.5">{role.indonesianName}</p>
                  <p className="text-xs text-[#CEC6B8] mt-1 leading-snug line-clamp-2">
                    {role.ability}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const filledNamesCount = playerNames.filter((n) => n.trim().length > 0).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Intro Hero & Demo Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#292535]">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#C8A951] tracking-wide">
            Edisi Resmi Trouble Brewing · Bahasa Indonesia
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#F5EFE6] text-balance">
            Persiapan Sesi Grimoire & Narator
          </h1>
          <p className="text-sm text-[#B8B0A2] max-w-2xl">
            Atur komposisi resmi 5–15 pemain, masukkan nama pemain secara manual tanpa nilai bawaan, tentukan rahasia Drunk, dan mulai malam pertama.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onQuickStartDemo}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#3B354C] bg-[#1D1A27] hover:bg-[#272334] text-xs sm:text-sm font-medium text-[#EDE7DB] flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 text-[#D4AF37]" />
            <span>Muat Sesi Contoh (8 Pemain)</span>
          </button>
        </div>
      </div>

      {/* 3-Step Wizard Navigation Stepper Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#181520] border border-[#292535] rounded-xl max-w-2xl">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`min-h-[42px] px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
            step === 1
              ? 'bg-[#991B1B] text-white shadow-sm'
              : 'text-[#B8B0A2] hover:text-[#F5EFE6]'
          }`}
        >
          01. Jumlah & Karakter
        </button>
        <button
          type="button"
          onClick={() => {
            if (bagValidation.isValid) proceedToStep2();
          }}
          disabled={!bagValidation.isValid}
          className={`min-h-[42px] px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap truncate ${
            step === 2
              ? 'bg-[#991B1B] text-white shadow-sm cursor-pointer'
              : bagValidation.isValid
              ? 'text-[#B8B0A2] hover:text-[#F5EFE6] cursor-pointer'
              : 'text-[#5E5869] cursor-not-allowed'
          }`}
        >
          02. Input Nama
        </button>
        <button
          type="button"
          onClick={() => {
            if (bagValidation.isValid) proceedToStep3();
          }}
          disabled={!bagValidation.isValid}
          className={`min-h-[42px] px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap truncate ${
            step === 3
              ? 'bg-[#991B1B] text-white shadow-sm cursor-pointer'
              : bagValidation.isValid
              ? 'text-[#B8B0A2] hover:text-[#F5EFE6] cursor-pointer'
              : 'text-[#5E5869] cursor-not-allowed'
          }`}
        >
          03. Kursi & Rahasia Drunk
        </button>
      </div>

      {/* ================= STEP 1: JUMLAH & KARAKTER ================= */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Player Count Control */}
            <div className="lg:col-span-5 bg-[#181520] border border-[#2A2636] rounded-2xl p-5 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#EDE7DB] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span>Total Pemain (Warga)</span>
                  </span>
                  <span className="text-xs text-[#A8A092]">Rentang 5–15 Orang</span>
                </div>

                <div className="flex items-center justify-between gap-4 bg-[#121018] border border-[#292535] rounded-xl p-3">
                  <button
                    type="button"
                    onClick={() => handleCountChange(playerCount - 1)}
                    disabled={playerCount <= 5}
                    aria-label="Kurangi jumlah pemain"
                    className="min-w-[44px] min-h-[44px] rounded-lg bg-[#221E2E] hover:bg-[#2E293D] disabled:opacity-40 flex items-center justify-center text-[#F5EFE6] cursor-pointer"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <span className="font-mono text-4xl font-bold text-[#F5EFE6] tabular-nums">
                      {playerCount}
                    </span>
                    <span className="block text-xs text-[#A8A092]">Pemain Duduk</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCountChange(playerCount + 1)}
                    disabled={playerCount >= 15}
                    aria-label="Tambah jumlah pemain"
                    className="min-w-[44px] min-h-[44px] rounded-lg bg-[#221E2E] hover:bg-[#2E293D] disabled:opacity-40 flex items-center justify-center text-[#F5EFE6] cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Number Buttons 5..15 */}
                <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                  {Array.from({ length: 11 }, (_, i) => i + 5).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCountChange(num)}
                      className={`min-h-[38px] rounded-lg font-mono text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                        playerCount === num
                          ? 'bg-[#D4AF37] text-[#121016]'
                          : 'bg-[#211D2B] text-[#C8C0B3] hover:bg-[#2D283B]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locked Active Composition Readout */}
              <div className="pt-4 border-t border-[#292535] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#B8B0A2]">
                  <span>Komposisi Wajib Saat Ini</span>
                  {bagValidation.required.hasBaronModifier && (
                    <span className="text-[#FCA5A5] font-medium">
                      Efek Baron (+2 Outsider, -2 Townsfolk)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono tabular-nums">
                  <div className="bg-[#131B2B] border border-[#2563EB]/40 rounded-lg py-2 px-1">
                    <div className="text-xl font-bold text-[#60A5FA]">
                      {bagValidation.required.townsfolk}
                    </div>
                    <div className="text-[11px] font-sans text-[#93C5FD]">Townsfolk</div>
                  </div>
                  <div className="bg-[#12202B] border border-[#38BDF8]/40 rounded-lg py-2 px-1">
                    <div className="text-xl font-bold text-[#38BDF8]">
                      {bagValidation.required.outsiders}
                    </div>
                    <div className="text-[11px] font-sans text-[#7DD3FC]">Outsider</div>
                  </div>
                  <div className="bg-[#291519] border border-[#EF4444]/40 rounded-lg py-2 px-1">
                    <div className="text-xl font-bold text-[#F87171]">
                      {bagValidation.required.minions}
                    </div>
                    <div className="text-[11px] font-sans text-[#FCA5A5]">Minion</div>
                  </div>
                  <div className="bg-[#2B1215] border border-[#DC2626]/50 rounded-lg py-2 px-1">
                    <div className="text-xl font-bold text-[#EF4444]">
                      {bagValidation.required.demons}
                    </div>
                    <div className="text-[11px] font-sans text-[#FCA5A5]">Demon</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Trouble Brewing Character Counts Table */}
            <div className="lg:col-span-7 bg-[#181520] border border-[#2A2636] rounded-2xl p-5 flex flex-col justify-between">
              <div className="space-y-1 mb-3">
                <h2 className="font-display text-base font-bold text-[#F5EFE6]">
                  Tabel Standar Komposisi Karakter Trouble Brewing
                </h2>
                <p className="text-xs text-[#A8A092]">
                  Klik kolom angka pemain untuk mengunci jumlah karakter sesuai buku aturan resmi.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center font-mono text-xs sm:text-sm tabular-nums border-collapse">
                  <thead>
                    <tr className="border-b border-[#2E293B] text-[#D6CFC2]">
                      <th className="py-2 pr-3 text-left font-sans font-medium text-xs">
                        Kategori
                      </th>
                      {Object.values(CHARACTER_COUNTS).map((row) => (
                        <th
                          key={row.players}
                          onClick={() => handleCountChange(row.players)}
                          className={`py-2 px-1.5 cursor-pointer rounded-t-lg transition-colors ${
                            row.players === playerCount
                              ? 'bg-[#D4AF37]/20 text-[#FDE68A] font-bold'
                              : 'hover:bg-[#231F2F]'
                          }`}
                        >
                          {row.players === 15 ? '15+' : row.players}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242030]">
                    <tr>
                      <td className="py-2 pr-3 text-left font-sans text-xs font-medium text-[#93C5FD]">
                        Townsfolk
                      </td>
                      {Object.values(CHARACTER_COUNTS).map((row) => (
                        <td
                          key={row.players}
                          onClick={() => handleCountChange(row.players)}
                          className={`py-2 px-1.5 cursor-pointer ${
                            row.players === playerCount
                              ? 'bg-[#D4AF37]/15 text-[#60A5FA] font-bold'
                              : 'text-[#60A5FA]/80'
                          }`}
                        >
                          {row.townsfolk}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 text-left font-sans text-xs font-medium text-[#7DD3FC]">
                        Outsiders
                      </td>
                      {Object.values(CHARACTER_COUNTS).map((row) => (
                        <td
                          key={row.players}
                          onClick={() => handleCountChange(row.players)}
                          className={`py-2 px-1.5 cursor-pointer ${
                            row.players === playerCount
                              ? 'bg-[#D4AF37]/15 text-[#38BDF8] font-bold'
                              : 'text-[#38BDF8]/80'
                          }`}
                        >
                          {row.outsiders}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 text-left font-sans text-xs font-medium text-[#FCA5A5]">
                        Minions
                      </td>
                      {Object.values(CHARACTER_COUNTS).map((row) => (
                        <td
                          key={row.players}
                          onClick={() => handleCountChange(row.players)}
                          className={`py-2 px-1.5 cursor-pointer ${
                            row.players === playerCount
                              ? 'bg-[#D4AF37]/15 text-[#F87171] font-bold'
                              : 'text-[#F87171]/80'
                          }`}
                        >
                          {row.minions}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 text-left font-sans text-xs font-medium text-[#EF4444]">
                        Demons
                      </td>
                      {Object.values(CHARACTER_COUNTS).map((row) => (
                        <td
                          key={row.players}
                          onClick={() => handleCountChange(row.players)}
                          className={`py-2 px-1.5 cursor-pointer rounded-b-lg ${
                            row.players === playerCount
                              ? 'bg-[#D4AF37]/15 text-[#EF4444] font-bold'
                              : 'text-[#EF4444]/80'
                          }`}
                        >
                          {row.demons}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#292535]">
                <span className="text-xs text-[#A8A092]">
                  Bantu pilih peran otomatis sesuai tabel:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAutoBalanceRoles(false)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#231F30] hover:bg-[#2E293F] text-xs font-medium text-[#EDE7DB] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Acak Komposisi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (bagValidation.required.outsiders === 0) {
                        const res = autoSelectRoles(playerCount, {
                          forceBaron: true,
                          forceDrunk: true,
                        });
                        setSelectedRoleIds(res.selectedRoleIds);
                      } else {
                        handleAutoBalanceRoles(true);
                      }
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#1A293D] hover:bg-[#22354F] border border-[#38BDF8]/40 text-xs font-medium text-[#BAE6FD] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Beer className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Acak dengan Drunk</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Role Selection Grid */}
          <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#F5EFE6]">
                  Kantong Token Karakter (Klik untuk Memilih / Mengganti)
                </h2>
                <p className="text-xs text-[#A8A092]">
                  Sesuaikan daftar peran yang ingin dimasukkan ke kantong permainan.
                </p>
              </div>
            </div>

            {drunkLimitError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#2E1619] border border-[#EF4444]/60 text-xs sm:text-sm text-[#FECACA] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#F87171]" />
                  <span>{drunkLimitError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrunkLimitError(null)}
                  className="text-xs font-semibold underline text-[#FCA5A5] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            {renderTeamRoleSection(
              'townsfolk',
              'Townsfolk (Warga Baik)',
              bagValidation.counts.townsfolk,
              bagValidation.required.townsfolk,
              'text-[#60A5FA]'
            )}
            {renderTeamRoleSection(
              'outsider',
              'Outsiders (Warga Luar)',
              bagValidation.counts.outsiders,
              bagValidation.required.outsiders,
              'text-[#38BDF8]'
            )}
            {renderTeamRoleSection(
              'minion',
              'Minions (Kaki Tangan Jahat)',
              bagValidation.counts.minions,
              bagValidation.required.minions,
              'text-[#F87171]'
            )}
            {renderTeamRoleSection(
              'demon',
              'Demon (Iblis Utama)',
              bagValidation.counts.demons,
              bagValidation.required.demons,
              'text-[#EF4444]'
            )}
          </div>

          {/* Validation Summary & Advance Button */}
          <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {bagValidation.isValid ? (
              <div className="text-sm text-[#6EE7B7] font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-[#6EE7B7]" />
                <span>
                  Komposisi {playerCount} pemain valid dan sesuai standar Trouble Brewing! Siap lanjut ke pengisian nama pemain.
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                {bagValidation.errors.map((err, idx) => (
                  <p key={idx} className="text-xs sm:text-sm text-[#FCA5A5] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
              {onCancelToDashboard && (
                <button
                  type="button"
                  onClick={onCancelToDashboard}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl border border-[#332E42] bg-[#1A1723] hover:bg-[#242030] text-sm font-medium text-[#D6CFC2] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali ke Dashboard</span>
                </button>
              )}
              <button
                type="button"
                onClick={proceedToStep2}
                disabled={!bagValidation.isValid}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] disabled:bg-[#2B2638] disabled:text-[#6E677A] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <span>Lanjut ke Input Nama Pemain</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2: INPUT NAMA PEMAIN ================= */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#292535]">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#F5EFE6]">
                  Input Nama Pemain ({playerCount} Orang)
                </h2>
                <p className="text-xs text-[#A8A092]">
                  Ketik nama setiap pemain sesuai urutan duduk searah jarum jam. Semua kolom sengaja dikosongkan tanpa nama bawaan.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#D6CFC2] shrink-0">
                <span>Terisi:</span>
                <span className={filledNamesCount === playerCount ? 'text-[#6EE7B7] font-bold' : 'text-[#FDE68A] font-bold'}>
                  {filledNamesCount} / {playerCount}
                </span>
              </div>
            </div>

            {nameError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#2E1619] border border-[#EF4444]/60 text-xs sm:text-sm text-[#FECACA] flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#F87171]" />
                <span>{nameError}</span>
              </div>
            )}

            {/* Empty inputs grid - Zero default names! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: playerCount }, (_, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#13111A] border border-[#292535] space-y-1.5 focus-within:border-[#D4AF37]"
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`player-input-${idx}`}
                      className="text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#221E2E] font-mono text-[11px] font-bold text-[#D4AF37] flex items-center justify-center tabular-nums">
                        {idx + 1}
                      </span>
                      <span>Kursi {idx + 1}</span>
                    </label>
                    {playerNames[idx]?.trim().length > 0 && (
                      <Check className="w-3.5 h-3.5 text-[#6EE7B7]" />
                    )}
                  </div>
                  <input
                    id={`player-input-${idx}`}
                    type="text"
                    value={playerNames[idx] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerNames((prev) => {
                        const copy = [...prev];
                        copy[idx] = val;
                        return copy;
                      });
                      if (nameError) setNameError(null);
                    }}
                    placeholder={`Ketik nama pemain kursi ${idx + 1}...`}
                    className="w-full min-h-[44px] rounded-lg bg-[#1C1826] border border-[#322D42] px-3 py-2 text-sm font-medium text-[#F5EFE6] placeholder-[#6E677A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setNameError(null);
                setStep(1);
              }}
              className="min-h-[48px] px-5 py-3 rounded-xl border border-[#332E42] bg-[#1A1723] hover:bg-[#242030] text-sm font-medium text-[#D6CFC2] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Komposisi Peran</span>
            </button>

            <button
              type="button"
              onClick={proceedToStep3}
              className="min-h-[48px] px-7 py-3 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors"
            >
              <span>Lanjut ke Pembagian Kursi & Pengaturan Drunk</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: PEMBAGIAN KURSI & PENGATURAN DRUNK ================= */}
      {step === 3 && (
        <form onSubmit={handleFinishSetup} className="space-y-6">
          <div className="bg-[#181520] border border-[#2A2636] rounded-2xl p-5 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#292535]">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#F5EFE6]">
                  Pembagian Kursi & Rahasia Peran ({playerCount} Pemain)
                </h2>
                <p className="text-xs text-[#A8A092]">
                  Tinjau alokasi peran ke tiap kursi pemain. Tentukan rahasia peran Drunk (jika ada), atur kursi duduk, dan intip kartu peran rahasia sebelum memulai malam pertama.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRandomizeSeatRoles}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2A2218] hover:bg-[#3A2F20] border border-[#D4AF37]/40 text-xs font-medium text-[#FDE68A] flex items-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Acak Posisi Peran ke Kursi</span>
                </button>
              </div>
            </div>

            {nameError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#2E1619] border border-[#EF4444]/60 text-xs sm:text-sm text-[#FECACA] flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#F87171]" />
                <span>{nameError}</span>
              </div>
            )}

            {/* Special Drunk Management Box - Explicitly configured AFTER player names are entered! */}
            {selectedRoleIds.includes('drunk') && (
              <div className="bg-[#162030] border border-[#38BDF8]/60 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-[#BAE6FD] flex items-center gap-2">
                      <Beer className="w-5 h-5 text-[#38BDF8]" />
                      <span>Penentuan Rahasia Karakter Drunk</span>
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-[#38BDF8] bg-[#0E1F30] border border-[#38BDF8]/50 px-2 py-0.5 rounded-full">
                      Hanya Boleh Tepat 1 Drunk
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#D0E2F2] max-w-3xl leading-relaxed">
                    Sesuai aturan Blood on the Clocktower: Pemain yang menjadi <strong>Drunk</strong> mengira dirinya adalah karakter Townsfolk asli. Pilih nama pemain yang menjadi Drunk, dan tentukan peran Townsfolk palsu apa yang ia lihat saat peran dibagikan.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="drunk-player-target-select"
                      className="block text-xs font-semibold text-[#BAE6FD]"
                    >
                      1. Pemain Mana yang Menjadi Drunk?
                    </label>
                    <select
                      id="drunk-player-target-select"
                      value={drunkSeatIdx}
                      onChange={(e) => handleDesignateDrunkPlayer(Number(e.target.value))}
                      className="w-full min-h-[44px] rounded-xl bg-[#0F1724] border border-[#38BDF8]/60 px-3 py-2 text-sm font-semibold text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                    >
                      {playerNames.map((name, idx) => (
                        <option key={idx} value={idx}>
                          Kursi {idx + 1}: {name.trim() || `Pemain ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="drunk-fake-role-select"
                      className="block text-xs font-semibold text-[#BAE6FD]"
                    >
                      2. Peran Townsfolk Palsu yang Dipercayai:
                    </label>
                    <select
                      id="drunk-fake-role-select"
                      value={drunkFakeRoleId ?? ''}
                      onChange={(e) => setDrunkFakeRoleId(e.target.value || null)}
                      className="w-full min-h-[44px] rounded-xl bg-[#0F1724] border border-[#38BDF8]/60 px-3 py-2 text-sm font-semibold text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                    >
                      <option value="">-- Pilih Peran Townsfolk Palsu --</option>
                      {unusedTownsfolkForDrunk.map((tf) => (
                        <option key={tf.id} value={tf.id}>
                          {tf.name} ({tf.indonesianName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {drunkFakeRoleId && ROLE_MAP[drunkFakeRoleId] && (
                  <div className="text-xs text-[#93C5FD] pt-2 border-t border-[#38BDF8]/20 flex items-center justify-between gap-2">
                    <span>
                      Pemain <strong>{playerNames[drunkSeatIdx]?.trim() || `Kursi ${drunkSeatIdx + 1}`}</strong> akan melihat token <strong>{ROLE_MAP[drunkFakeRoleId].name}</strong>. Grimoire menandainya dengan token <em>&quot;Is the Drunk&quot;</em>.
                    </span>
                    <span className="text-[#FDE68A] shrink-0 font-medium">
                      Otomatis dikecualikan dari Bluff Demon
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Demon Bluff Preview */}
            <div className="p-3.5 rounded-xl bg-[#1D1726] border border-[#D4AF37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-[#D6CFC2]">
                3 Rekomendasi Bluff Aman untuk Demon (Peran Townsfolk yang Tidak Dimainkan):
              </span>
              <span className="text-xs font-semibold text-[#FDE68A]">
                {safeBluffs.map((id) => ROLE_MAP[id]?.name).join(' · ')}
              </span>
            </div>

            {/* Seat Assignment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: playerCount }, (_, idx) => {
                const assignedRoleId = assignedRolesBySeat[idx] ?? selectedRoleIds[idx];
                const isDrunkSeat = assignedRoleId === 'drunk';
                const perceivedId =
                  isDrunkSeat && drunkFakeRoleId ? drunkFakeRoleId : assignedRoleId;
                const perceivedRole = ROLE_MAP[perceivedId];
                const displayName = playerNames[idx]?.trim() || `Kursi ${idx + 1}`;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border ${
                      isDrunkSeat
                        ? 'bg-[#151E2B] border-[#38BDF8]/50'
                        : 'bg-[#13111A] border-[#292535]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-[#221E2E] font-mono text-xs font-bold text-[#D4AF37] flex items-center justify-center shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#F5EFE6] truncate">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-[#A8A092]">
                          {isDrunkSeat ? (
                            <span className="text-[#7DD3FC] font-medium">
                              Asli: Drunk (Mengira: {ROLE_MAP[perceivedId]?.name ?? 'Palsu'})
                            </span>
                          ) : (
                            <span>{ROLE_MAP[assignedRoleId]?.indonesianName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <div className="flex-1 sm:flex-initial">
                        <label htmlFor={`seat-role-${idx}`} className="sr-only">
                          Peran Kursi {idx + 1}
                        </label>
                        <select
                          id={`seat-role-${idx}`}
                          value={assignedRoleId}
                          onChange={(e) => handleSeatRoleSwap(idx, e.target.value)}
                          className="w-full sm:w-[170px] min-h-[42px] rounded-lg bg-[#1C1826] border border-[#322D42] px-2.5 py-1.5 text-xs font-semibold text-[#EDE7DB] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        >
                          {selectedRoleIds.map((rId) => {
                            const rDef = ROLE_MAP[rId];
                            if (!rDef) return null;
                            const label =
                              rId === 'drunk' && drunkFakeRoleId
                                ? `Drunk (Mengira ${ROLE_MAP[drunkFakeRoleId]?.name})`
                                : `${rDef.name} (${rDef.indonesianName})`;
                            return (
                              <option key={rId} value={rId}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!perceivedRole) return;
                          onShowSilentCard({
                            requireTapToReveal: true,
                            playerName: displayName,
                            heading: `Peran Anda: ${perceivedRole.name}`,
                            subheading:
                              perceivedRole.team === 'townsfolk' || perceivedRole.team === 'outsider'
                                ? 'Tim Good (Warga Baik)'
                                : 'Tim Evil (Jahat)',
                            roleIds: [perceivedRole.id],
                            footerNote:
                              'Hafalkan peran dan kemampuan Anda secara rahasia, lalu kembalikan layar kepada Storyteller.',
                          });
                        }}
                        title="Tunjukkan Kartu Peran Rahasia ke Pemain Ini"
                        aria-label={`Tunjukkan kartu peran ke ${displayName}`}
                        className="min-h-[42px] px-3 rounded-lg bg-[#231F30] hover:bg-[#302A42] border border-[#3B354E] text-xs font-medium text-[#D6CFC2] flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-[#D4AF37]" />
                        <span>Intip</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setNameError(null);
                setStep(2);
              }}
              className="min-h-[48px] px-5 py-3 rounded-xl border border-[#332E42] bg-[#1A1723] hover:bg-[#242030] text-sm font-medium text-[#D6CFC2] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Input Nama Pemain</span>
            </button>

            <button
              type="submit"
              data-start="true"
              className="min-h-[48px] px-8 py-3 rounded-xl bg-[#991B1B] hover:bg-[#B91C1C] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Buka Buku Grimoire & Mulai Malam Pertama</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
