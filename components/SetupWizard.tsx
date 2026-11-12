'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Beer,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Shuffle,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  DEFAULT_INDONESIAN_NAMES,
  ROLE_MAP,
  ROLES,
  calculateBalancedBag,
} from '@/lib/botc-data';
import {
  PlayerSeat,
  assignRolesToPlayers,
  clampPlayerCount,
  computeSafeDemonBluffs,
  getBaseCharacterCounts,
  getUnusedTownsfolkForDrunk,
  validateRoleBag,
} from '@/lib/botc-engine';
import { ART_ASSETS, GRIMOIRE_PALETTE, TeamKey } from '@/lib/grimoire-theme';
import { SilentCardPayload } from './FullscreenCardModal';
import ParchmentSurface from './grimoire/ParchmentSurface';
import VelvetBackdrop from './grimoire/VelvetBackdrop';
import {
  CharacterTokenFront,
  TokenBackDisc,
  TokenFlip3D,
  renderAbilitySegments,
} from './grimoire/TokenPrimitives';

interface SetupWizardProps {
  initialPlayerCount: number;
  initialStep?: 1 | 2 | 3;
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

export default function SetupWizard({
  initialPlayerCount,
  initialStep = 1,
  onStepChange,
  onCancelToDashboard,
  onCompleteSetup,
  onQuickStartDemo,
}: SetupWizardProps) {
  const [activeMenu, setActiveMenuState] = useState<1 | 2>(initialStep === 2 ? 2 : 1);
  const setActiveMenu = (menu: 1 | 2) => {
    setActiveMenuState(menu);
    onStepChange?.(menu);
  };

  // Strictly default to 0 selected roles & Drunk OFF by user request
  const [playerCount, setPlayerCount] = useState<number>(() =>
    clampPlayerCount(initialPlayerCount)
  );
  const [isDrunkActive, setIsDrunkActive] = useState<boolean>(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [drunkFakeRoleId, setDrunkFakeRoleId] = useState<string | null>(null);
  const [formulaInfo, setFormulaInfo] = useState<{
    formulaSummary: string;
    formulaDetails: string[];
  } | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Menu 2: Player names + drafted seats + optional pass-and-play Discovery reveal
  const [playerNames, setPlayerNames] = useState<string[]>(() =>
    Array.from({ length: 15 }, (_, i) => DEFAULT_INDONESIAN_NAMES[i] || `Pemain ${i + 1}`)
  );
  const [manualRoleOrder, setManualRoleOrder] = useState<string[] | null>(null);
  const [discoverySeats, setDiscoverySeats] = useState<PlayerSeat[] | null>(null);
  const [discoveryIdx, setDiscoveryIdx] = useState(0);
  const [discoveryRevealed, setDiscoveryRevealed] = useState(false);

  const baseCounts = getBaseCharacterCounts(playerCount);
  const validation = useMemo(
    () => validateRoleBag(playerCount, selectedRoleIds, isDrunkActive),
    [playerCount, selectedRoleIds, isDrunkActive]
  );

  const unusedTownsfolk = useMemo(
    () => getUnusedTownsfolkForDrunk(selectedRoleIds),
    [selectedRoleIds]
  );

  const effectiveRolePool = useMemo(() => {
    const cleanIds = selectedRoleIds.filter((id) => id !== 'drunk');
    if (isDrunkActive) {
      // Ensure Drunk has a true slot paired with a Townsfolk disguise
      if (!selectedRoleIds.includes('drunk')) {
        return [...cleanIds];
      }
    }
    return cleanIds;
  }, [selectedRoleIds, isDrunkActive]);

  const handleToggleRole = (roleId: string) => {
    setSetupError(null);
    setManualRoleOrder(null);
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleClearBag = () => {
    setSelectedRoleIds([]);
    setIsDrunkActive(false);
    setDrunkFakeRoleId(null);
    setFormulaInfo(null);
    setManualRoleOrder(null);
    setSetupError(null);
  };

  const handleRandomizeWithFormula = () => {
    setSetupError(null);
    setManualRoleOrder(null);
    const result = calculateBalancedBag(playerCount);
    setSelectedRoleIds(result.selectedRoleIds);
    setIsDrunkActive(result.isDrunkActive);
    setDrunkFakeRoleId(result.drunkFakeRoleId);
    setFormulaInfo({
      formulaSummary: result.formulaSummary,
      formulaDetails: result.formulaDetails,
    });
  };

  const handleGoToSeatsMenu = () => {
    if (!validation.isValid) {
      setSetupError(validation.errors[0] || 'Komposisi karakter belum lengkap.');
      return;
    }
    setSetupError(null);
    setActiveMenu(2);
  };

  const buildFinalPayload = (useShuffledSeats: boolean): {
    playerCount: number;
    selectedRoleIds: string[];
    drunkFakeRoleId: string | null;
    demonBluffIds: string[];
    players: PlayerSeat[];
    isDrunkActive: boolean;
  } => {
    const namesSlice = playerNames.slice(0, playerCount).map((n, i) => n.trim() || `Pemain ${i + 1}`);
    const roleIdsForEngine = isDrunkActive
      ? Array.from(new Set([...selectedRoleIds.filter((id) => id !== 'drunk'), 'drunk']))
      : selectedRoleIds;

    let seats: PlayerSeat[];
    if (!useShuffledSeats && manualRoleOrder && manualRoleOrder.length === playerCount) {
      seats = assignRolesToPlayers(namesSlice, manualRoleOrder, drunkFakeRoleId, {
        shuffleRoles: false,
      });
    } else {
      const fake =
        isDrunkActive && !drunkFakeRoleId
          ? unusedTownsfolk[0]?.id ||
            selectedRoleIds.find((id) => ROLE_MAP[id]?.team === 'townsfolk') ||
            'washerwoman'
          : drunkFakeRoleId;

      const idsWithoutDrunk = selectedRoleIds.filter((id) => id !== 'drunk');
      const engineBag = isDrunkActive
        ? [...idsWithoutDrunk.slice(0, playerCount - 1), 'drunk']
        : idsWithoutDrunk.slice(0, playerCount);

      seats = assignRolesToPlayers(namesSlice, engineBag, fake, { shuffleRoles: useShuffledSeats });
    }

    const drunkSeat = seats.find((s) => s.trueRoleId === 'drunk');
    const resolvedFake = drunkSeat ? drunkSeat.perceivedRoleId : drunkFakeRoleId;
    const { recommendedBluffs } = computeSafeDemonBluffs(
      seats.map((s) => s.trueRoleId),
      resolvedFake
    );

    return {
      playerCount,
      selectedRoleIds: roleIdsForEngine,
      drunkFakeRoleId: resolvedFake,
      demonBluffIds: recommendedBluffs,
      players: seats,
      isDrunkActive,
    };
  };

  // Optional pass-and-play Discovery Handoff screen (matching botcgrimoire-main's Discovery flow!)
  if (discoverySeats) {
    const activeSeat = discoverySeats[discoveryIdx];
    const perceivedRole = activeSeat ? ROLE_MAP[activeSeat.perceivedRoleId] : null;
    const isLast = discoveryIdx + 1 >= discoverySeats.length;

    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6">
        <VelvetBackdrop
          colour="midnight"
          className="rounded-3xl p-6 sm:p-10 text-center shadow-2xl border border-[#c9963a]/40 min-h-[480px] flex flex-col items-center justify-center"
        >
          {!discoveryRevealed ? (
            <div className="max-w-md space-y-5">
              <TokenBackDisc size={112} highlighted className="mx-auto" />
              <div className="space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c9963a]">
                  Pembagian Peran Rahasia · Kursi #{discoveryIdx + 1} / {discoverySeats.length}
                </p>
                <h2 className="font-display text-3xl font-bold text-[#efe6d2]">
                  Serahkan ke {activeSeat?.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#a89f8c]">
                  Hanya <strong>{activeSeat?.name}</strong> yang boleh melihat layar ini. Ketuk tombol di bawah untuk membuka tokenmu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDiscoveryRevealed(true)}
                className="px-7 py-3.5 rounded-full bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold text-sm flex items-center gap-2 mx-auto cursor-pointer shadow-xl"
              >
                <Eye className="w-4 h-4" />
                <span>Ketuk &amp; Balik Token Saya</span>
              </button>
            </div>
          ) : (
            <div className="max-w-md w-full space-y-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c9963a]">
                {activeSeat?.name} · Peran Rahasia Kamu
              </p>

              {perceivedRole && (
                <TokenFlip3D
                  flipped
                  size={156}
                  back={<TokenBackDisc size={156} />}
                  front={<CharacterTokenFront role={perceivedRole} size={156} showAbility />}
                />
              )}

              <div>
                <h2 className="font-display text-3xl font-bold text-[#efe6d2]">
                  {perceivedRole?.name}{' '}
                  <span className="text-base font-normal text-[#a89f8c]">
                    ({perceivedRole?.indonesianName})
                  </span>
                </h2>
              </div>

              {perceivedRole && (
                <ParchmentSurface className="rounded-2xl p-4 text-left">
                  <p className="text-xs sm:text-sm leading-relaxed text-[#2a2018]">
                    {renderAbilitySegments(perceivedRole.ability)}
                  </p>
                </ParchmentSurface>
              )}

              <button
                type="button"
                onClick={() => {
                  setDiscoveryRevealed(false);
                  if (isLast) {
                    const fake =
                      discoverySeats.find((s) => s.trueRoleId === 'drunk')?.perceivedRoleId ??
                      drunkFakeRoleId;
                    const { recommendedBluffs } = computeSafeDemonBluffs(
                      discoverySeats.map((s) => s.trueRoleId),
                      fake
                    );
                    onCompleteSetup({
                      playerCount,
                      selectedRoleIds: isDrunkActive
                        ? Array.from(new Set([...selectedRoleIds, 'drunk']))
                        : selectedRoleIds,
                      drunkFakeRoleId: fake,
                      demonBluffIds: recommendedBluffs,
                      players: discoverySeats,
                      isDrunkActive,
                    });
                  } else {
                    setDiscoveryIdx((prev) => prev + 1);
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                <EyeOff className="w-4 h-4" />
                <span>
                  {isLast
                    ? 'Sembunyikan & Masuk Meja Grimoire Storyteller'
                    : `Sembunyikan & Oper ke ${discoverySeats[discoveryIdx + 1]?.name}`}
                </span>
              </button>
            </div>
          )}
        </VelvetBackdrop>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <ParchmentSurface className="rounded-3xl p-4 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#655342]/25 pb-4">
          <div className="flex items-center gap-3">
            <img src={ART_ASSETS.editionTb} alt="Trouble Brewing" className="w-11 h-11 object-contain" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#5c4a37]">
                Mode 2 · Setup Storyteller Biasa
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2a2018]">
                {activeMenu === 1 ? 'Pilih Jumlah & Karakter' : 'Atur Nama Kursi & Bluff'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onQuickStartDemo}
              className="px-3.5 py-2 rounded-xl bg-[#66533f]/15 hover:bg-[#66533f]/25 text-xs font-bold text-[#2a2018] cursor-pointer"
            >
              Demo Cepat 8 Pemain
            </button>
            {onCancelToDashboard && (
              <button
                type="button"
                onClick={onCancelToDashboard}
                className="px-3.5 py-2 rounded-xl border border-[#655342]/30 text-xs font-bold text-[#5c4a37] hover:bg-[#66533f]/10 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMenu(1)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
              activeMenu === 1
                ? 'bg-[#2a2018] text-[#efe6d2]'
                : 'bg-[#66533f]/12 text-[#5c4a37]'
            }`}
          >
            1. Kantong Karakter
          </button>
          <button
            type="button"
            disabled={!validation.isValid}
            onClick={handleGoToSeatsMenu}
            className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer disabled:opacity-40 ${
              activeMenu === 2
                ? 'bg-[#2a2018] text-[#efe6d2]'
                : 'bg-[#66533f]/12 text-[#5c4a37]'
            }`}
          >
            2. Nama Kursi &amp; Bagikan
          </button>
        </div>

        {activeMenu === 1 ? (
          <div className="space-y-5">
            {/* Player count + Drunk + Randomizer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#5c4a37]">
                  Jumlah Pemain (5 – 15)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 11 }, (_, i) => i + 5).map((cnt) => {
                    const active = cnt === playerCount;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setPlayerCount(clampPlayerCount(cnt));
                          setManualRoleOrder(null);
                          setSetupError(null);
                        }}
                        className={`w-10 h-10 rounded-xl font-mono text-sm font-bold cursor-pointer transition-all tabular-nums ${
                          active
                            ? 'bg-[#2a2018] text-[#efe6d2] shadow-md scale-105'
                            : 'bg-[#66533f]/10 hover:bg-[#66533f]/20 text-[#2a2018]'
                        }`}
                      >
                        {cnt}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[#5c4a37]">
                  Standar {playerCount} pemain:{' '}
                  <strong className="text-[#2a2018]">
                    {baseCounts.townsfolk} TF · {baseCounts.outsiders} Out · {baseCounts.minions} Min · 1 Demon
                  </strong>
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-wrap gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrunkActive((prev) => !prev);
                    setSetupError(null);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    isDrunkActive
                      ? 'border-[#c9963a] bg-[#c9963a]/25 text-[#2a2018]'
                      : 'border-[#655342]/30 bg-[#66533f]/[0.06] text-[#5c4a37]'
                  }`}
                >
                  <Beer className="w-4 h-4" />
                  <span>Drunk: {isDrunkActive ? 'AKTIF' : 'Nonaktif'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRandomizeWithFormula}
                  className="px-4 py-2.5 rounded-xl bg-[#2a2018] hover:bg-[#3f3125] text-[#efe6d2] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Shuffle className="w-4 h-4 text-[#c9963a]" />
                  <span>Acak + Formula</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearBag}
                  className="px-3 py-2.5 rounded-xl border border-[#655342]/30 text-xs font-bold text-[#5c4a37] hover:bg-[#66533f]/10 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset 0</span>
                </button>
              </div>
            </div>

            {formulaInfo && (
              <div className="p-3.5 rounded-2xl border border-[#c9963a]/55 bg-[#c9963a]/15 space-y-1 text-xs text-[#2a2018]">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7a5210]" />
                  <span>{formulaInfo.formulaSummary}</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[#5c4a37]">
                  {formulaInfo.formulaDetails.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tally bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-[#66533f]/10 border border-[#655342]/20 text-xs">
              <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-[#2a2018]">
                <span>
                  Townsfolk: <strong>{validation.counts.townsfolk}</strong>/{validation.required.bagTownsfolk}
                </span>
                <span>
                  Outsider: <strong>{validation.counts.outsiders}</strong>/{validation.required.bagOutsiders}
                </span>
                <span>
                  Minion: <strong>{validation.counts.minions}</strong>/{validation.required.minions}
                </span>
                <span>
                  Demon: <strong>{validation.counts.demons}</strong>/{validation.required.demons}
                </span>
              </div>
              <span className="font-bold text-[#2a2018]">
                Terpilih: {effectiveRolePool.length}/{playerCount}
              </span>
            </div>

            {/* TB Characters by Team */}
            <div className="space-y-5">
              {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map((teamKey) => {
                const rolesInTeam = ROLES.filter((r) => r.team === teamKey);
                const heading =
                  teamKey === 'townsfolk'
                    ? 'Townsfolk'
                    : teamKey === 'outsider'
                    ? 'Outsiders'
                    : teamKey === 'minion'
                    ? 'Minions'
                    : 'Demon';

                return (
                  <div key={teamKey} className="space-y-2">
                    <h3
                      className="font-display text-sm font-bold uppercase tracking-wider"
                      style={{ color: GRIMOIRE_PALETTE.teamOnPaper[teamKey as TeamKey] }}
                    >
                      {heading}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                      {rolesInTeam.map((role) => {
                        const picked = selectedRoleIds.includes(role.id);
                        const isDrunkCard = role.id === 'drunk';
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => {
                              if (isDrunkCard) {
                                setIsDrunkActive((prev) => !prev);
                                if (isDrunkActive) {
                                  setSelectedRoleIds((prev) => prev.filter((id) => id !== 'drunk'));
                                }
                              } else {
                                handleToggleRole(role.id);
                              }
                            }}
                            title={role.ability}
                            className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                              picked || (isDrunkCard && isDrunkActive)
                                ? 'border-[#c9963a] bg-[#c9963a]/25 ring-2 ring-[#c9963a]/50'
                                : 'border-[#655342]/20 bg-[#66533f]/[0.04] hover:bg-[#66533f]/[0.14]'
                            }`}
                          >
                            <CharacterTokenFront role={role} size={52} showSetupLeaf />
                            <span className="text-[11px] font-bold text-[#2a2018] truncate w-full text-center">
                              {role.name}
                            </span>
                            {(picked || (isDrunkCard && isDrunkActive)) && (
                              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2a2018] text-[#c9963a] flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {setupError && (
              <div className="p-3 rounded-xl bg-[#760a0d]/15 border border-[#760a0d]/40 text-xs font-bold text-[#760a0d]">
                {setupError}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#655342]/25">
              <button
                type="button"
                onClick={handleGoToSeatsMenu}
                className="px-6 py-3 rounded-2xl bg-[#2a2018] hover:bg-[#3f3125] text-[#efe6d2] font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Lanjut ke Nama Kursi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Menu 2: Player Seat Names & Optional Discovery Pass */
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#5c4a37]">
                <Users className="w-4 h-4" />
                <span>Isi nama pemain sesuai urutan duduk searah jarum jam (Kursi 1 – {playerCount}).</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPlayerNames(
                    Array.from({ length: 15 }, (_, i) => DEFAULT_INDONESIAN_NAMES[i] || `Pemain ${i + 1}`)
                  )
                }
                className="px-3 py-1.5 rounded-xl border border-[#655342]/30 text-xs font-bold text-[#2a2018] cursor-pointer hover:bg-[#66533f]/10"
              >
                Isi Nama Default
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Array.from({ length: playerCount }, (_, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-2xl border border-[#655342]/25 bg-[#66533f]/[0.05]"
                >
                  <span className="w-7 h-7 rounded-full bg-[#2a2018] text-[#c9963a] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    maxLength={24}
                    value={playerNames[idx] ?? ''}
                    onChange={(e) => {
                      const next = [...playerNames];
                      next[idx] = e.target.value;
                      setPlayerNames(next);
                    }}
                    placeholder={`Pemain ${idx + 1}`}
                    className="flex-1 min-w-0 bg-white/75 border border-[#655342]/25 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-[#2a2018] focus:outline-none focus:ring-2 focus:ring-[#c9963a]"
                  />
                </div>
              ))}
            </div>

            {isDrunkActive && (
              <div className="p-4 rounded-2xl border border-[#c9963a]/50 bg-[#c9963a]/15 space-y-2">
                <div className="text-xs font-bold text-[#2a2018] flex items-center gap-1.5">
                  <Beer className="w-4 h-4 text-[#7a5210]" />
                  <span>Samaran Townsfolk untuk The Drunk (Opsional):</span>
                </div>
                <select
                  value={drunkFakeRoleId ?? ''}
                  onChange={(e) => setDrunkFakeRoleId(e.target.value || null)}
                  className="w-full sm:w-80 rounded-xl border border-[#655342]/35 bg-white/85 px-3 py-2 text-xs font-semibold text-[#2a2018]"
                >
                  <option value="">Otomatis dari salah satu Townsfolk terpilih</option>
                  {unusedTownsfolk.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.indonesianName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#655342]/25">
              <button
                type="button"
                onClick={() => setActiveMenu(1)}
                className="px-4 py-2.5 rounded-xl border border-[#655342]/30 text-xs font-bold text-[#5c4a37] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali Edit Peran</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const payload = buildFinalPayload(true);
                    setDiscoverySeats(payload.players);
                    setDiscoveryIdx(0);
                    setDiscoveryRevealed(false);
                  }}
                  className="px-5 py-3 rounded-2xl border-2 border-[#2a2018] bg-[#c9963a]/25 hover:bg-[#c9963a]/40 text-[#2a2018] text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Tunjuk Kartu Bergilir (Discovery)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onCompleteSetup(buildFinalPayload(true))}
                  className="px-6 py-3 rounded-2xl bg-[#2a2018] hover:bg-[#3f3125] text-[#efe6d2] text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-[#c9963a]" />
                  <span>Acak &amp; Langsung Buka Meja Grimoire</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </ParchmentSurface>
    </div>
  );
}
