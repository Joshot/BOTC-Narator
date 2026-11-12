'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Beer,
  Check,
  EyeOff,
  Hand,
  LayoutGrid,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Swords,
} from 'lucide-react';
import {
  DEFAULT_INDONESIAN_NAMES,
  ROLE_MAP,
  ROLES,
  calculateBalancedBag,
} from '@/lib/botc-data';
import {
  PlayerSeat,
  clampPlayerCount,
  computeSafeDemonBluffs,
  getBaseCharacterCounts,
  validateRoleBag,
} from '@/lib/botc-engine';
import { ART_ASSETS, GRIMOIRE_PALETTE, TeamKey } from '@/lib/grimoire-theme';
import {
  BagBounds,
  TokenBody,
  createBagPile,
  createSpreadLayout,
  stirBagPile,
} from '@/lib/bag-physics';
import VelvetBackdrop from './grimoire/VelvetBackdrop';
import ParchmentSurface from './grimoire/ParchmentSurface';
import {
  CharacterTokenFront,
  TokenBackDisc,
  TokenFlip3D,
  renderAbilitySegments,
} from './grimoire/TokenPrimitives';

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

type BagSubStep = 'setup' | 'bag' | 'reveal' | 'handoff' | 'drunk_assign' | 'ready';

interface BagSlot {
  slotId: number;
  roleId: string;
}

interface PickedSeat {
  seatIndex: number;
  name: string;
  trueRoleId: string;
  perceivedRoleId: string;
}

const BAG_ARENA_W = 560;
const BAG_ARENA_H = 380;

export default function WebPlayMode({
  onCancelToDashboard,
  onCompleteWebPlay,
}: WebPlayModeProps) {
  // === Step 1: Role Bag Config (Strictly 0 selected & Drunk OFF by default!) ===
  const [subStep, setSubStep] = useState<BagSubStep>('setup');
  const [playerCount, setPlayerCount] = useState<number>(8);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isDrunkActive, setIsDrunkActive] = useState<boolean>(false);
  const [formulaInfo, setFormulaInfo] = useState<{
    formulaSummary: string;
    formulaDetails: string[];
  } | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  // === Step 2: Velvet Bag Stir & Pick ===
  const [bagSlots, setBagSlots] = useState<BagSlot[]>([]);
  const [bodies, setBodies] = useState<TokenBody[]>([]);
  const [spreadMode, setSpreadMode] = useState(false);
  const [pickedSlotId, setPickedSlotId] = useState<number | null>(null);
  const [tokenFlipped, setTokenFlipped] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [pickError, setPickError] = useState<string | null>(null);
  const [assignedSeats, setAssignedSeats] = useState<PickedSeat[]>([]);
  const [drunkSeatIndex, setDrunkSeatIndex] = useState<number | null>(null);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    movedDist: number;
    targetId?: number;
  } | null>(null);

  const bagBounds: BagBounds = useMemo(
    () => ({
      cx: BAG_ARENA_W / 2,
      cy: BAG_ARENA_H / 2,
      rx: BAG_ARENA_W * 0.41,
      ry: BAG_ARENA_H * 0.4,
      tokenSize: playerCount >= 13 ? 66 : playerCount >= 10 ? 74 : 82,
    }),
    [playerCount]
  );

  const validation = useMemo(
    () => validateRoleBag(playerCount, selectedRoleIds, isDrunkActive),
    [playerCount, selectedRoleIds, isDrunkActive]
  );
  const baseCounts = getBaseCharacterCounts(playerCount);

  const handleToggleRole = (roleId: string) => {
    setSetupError(null);
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleClearBag = () => {
    setSelectedRoleIds([]);
    setIsDrunkActive(false);
    setFormulaInfo(null);
    setSetupError(null);
  };

  const handleRandomizeBalanced = () => {
    setSetupError(null);
    const result = calculateBalancedBag(playerCount);
    setSelectedRoleIds(result.selectedRoleIds);
    setIsDrunkActive(result.isDrunkActive);
    setFormulaInfo({
      formulaSummary: result.formulaSummary,
      formulaDetails: result.formulaDetails,
    });
  };

  const handleOpenVelvetBag = () => {
    if (!validation.isValid) {
      setSetupError(validation.errors[0] || 'Komposisi peran belum sesuai jumlah pemain.');
      return;
    }

    // Build physical face-down tokens (swap any logical 'drunk' into an unused Townsfolk if present)
    const physicalIds = [...selectedRoleIds].filter((id) => id !== 'drunk');
    if (physicalIds.length < playerCount) {
      const unusedTf = ROLES.filter(
        (r) => r.team === 'townsfolk' && !physicalIds.includes(r.id)
      ).map((r) => r.id);
      while (physicalIds.length < playerCount && unusedTf.length > 0) {
        const pickIdx = Math.floor(Math.random() * unusedTf.length);
        physicalIds.push(unusedTf.splice(pickIdx, 1)[0]);
      }
    }

    // Fisher-Yates shuffle
    for (let i = physicalIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [physicalIds[i], physicalIds[j]] = [physicalIds[j], physicalIds[i]];
    }

    const slots: BagSlot[] = physicalIds.slice(0, playerCount).map((roleId, idx) => ({
      slotId: idx,
      roleId,
    }));

    setBagSlots(slots);
    setBodies(createBagPile(slots.length, bagBounds));
    setPickedSlotId(null);
    setTokenFlipped(false);
    setPlayerNameInput('');
    setPickError(null);
    setAssignedSeats([]);
    setDrunkSeatIndex(null);
    setSubStep('bag');
  };

  // Stir bag pile smoothly on pointer move
  const toArenaCoords = (clientX: number, clientY: number) => {
    const el = arenaRef.current;
    if (!el) return { x: BAG_ARENA_W / 2, y: BAG_ARENA_H / 2 };
    const rect = el.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / Math.max(1, rect.width)) * BAG_ARENA_W,
      y: ((clientY - rect.top) / Math.max(1, rect.height)) * BAG_ARENA_H,
    };
  };

  const handleTokenPointerDown = (slotId: number, e: React.PointerEvent) => {
    e.stopPropagation();
    const pt = toArenaCoords(e.clientX, e.clientY);
    pointerStateRef.current = {
      active: true,
      startX: pt.x,
      startY: pt.y,
      lastX: pt.x,
      lastY: pt.y,
      movedDist: 0,
      targetId: slotId,
    };
  };

  const handleArenaPointerDown = (e: React.PointerEvent) => {
    const pt = toArenaCoords(e.clientX, e.clientY);
    pointerStateRef.current = {
      active: true,
      startX: pt.x,
      startY: pt.y,
      lastX: pt.x,
      lastY: pt.y,
      movedDist: 0,
    };
  };

  const handleArenaPointerMove = (e: React.PointerEvent) => {
    const st = pointerStateRef.current;
    if (!st || !st.active) return;
    const pt = toArenaCoords(e.clientX, e.clientY);
    const dx = pt.x - st.lastX;
    const dy = pt.y - st.lastY;
    st.movedDist += Math.hypot(dx, dy);
    st.lastX = pt.x;
    st.lastY = pt.y;

    if (!spreadMode && (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)) {
      setBodies((prev) =>
        stirBagPile(prev, bagBounds, pt.x, pt.y, dx, dy, st.targetId)
      );
    }
  };

  const handleArenaPointerUp = () => {
    const st = pointerStateRef.current;
    pointerStateRef.current = null;
    if (!st) return;
    // Tap without significant drag => PICK this token!
    if (st.targetId !== undefined && st.movedDist < 10) {
      handlePickSlot(st.targetId);
    }
  };

  const handlePickSlot = (slotId: number) => {
    const slot = bagSlots.find((s) => s.slotId === slotId);
    if (!slot) return;
    setPickedSlotId(slotId);
    setTokenFlipped(false);
    setPlayerNameInput('');
    setPickError(null);
    setSubStep('reveal');
    requestAnimationFrame(() => {
      setTimeout(() => setTokenFlipped(true), 80);
    });
  };

  const handleConfirmPlayerAndHide = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = playerNameInput.trim();
    if (!cleanedName) {
      setPickError('Masukkan namamu terlebih dahulu sebelum menyembunyikan token.');
      return;
    }
    const picked = bagSlots.find((s) => s.slotId === pickedSlotId);
    if (!picked) return;

    const nextSeat: PickedSeat = {
      seatIndex: assignedSeats.length,
      name: cleanedName,
      trueRoleId: picked.roleId,
      perceivedRoleId: picked.roleId,
    };
    const nextAssigned = [...assignedSeats, nextSeat];

    setAssignedSeats(nextAssigned);
    setBodies((prev) =>
      prev.map((b) => (b.id === picked.slotId ? { ...b, removed: true } : b))
    );
    setPickedSlotId(null);
    setTokenFlipped(false);

    if (nextAssigned.length >= playerCount) {
      if (isDrunkActive) {
        const tfCandidate = nextAssigned.find(
          (s) => ROLE_MAP[s.perceivedRoleId]?.team === 'townsfolk'
        );
        setDrunkSeatIndex(tfCandidate ? tfCandidate.seatIndex : null);
        setSubStep('drunk_assign');
      } else {
        setSubStep('ready');
      }
    } else {
      setSubStep('handoff');
    }
  };

  const handleLaunchGrimoire = () => {
    const finalSeats: PlayerSeat[] = assignedSeats.map((s) => {
      const isDrunk = isDrunkActive && drunkSeatIndex === s.seatIndex;
      return {
        id: `seat-${s.seatIndex + 1}`,
        seatIndex: s.seatIndex,
        name: s.name,
        trueRoleId: isDrunk ? 'drunk' : s.trueRoleId,
        perceivedRoleId: s.perceivedRoleId,
        isAlive: true,
        hasGhostVote: true,
        reminders: isDrunk
          ? [{ instanceId: `rem-drunk-${s.seatIndex}`, reminderId: 'is_the_drunk' }]
          : [],
      };
    });

    // Place Fortune Teller Red Herring neatly on a Good seat if Fortune Teller is in play
    if (finalSeats.some((s) => s.perceivedRoleId === 'fortune_teller')) {
      const goodSeats = finalSeats.filter((s) => {
        const role = ROLE_MAP[s.trueRoleId];
        return role && (role.team === 'townsfolk' || role.team === 'outsider');
      });
      const nonFt = goodSeats.filter((s) => s.perceivedRoleId !== 'fortune_teller');
      const pool = nonFt.length > 0 ? nonFt : goodSeats;
      if (pool.length > 0) {
        const target = pool[Math.floor(Math.random() * pool.length)];
        target.reminders.push({
          instanceId: 'rem-ft-decoy-bag',
          reminderId: 'decoy_ft',
        });
      }
    }

    const drunkSeat = finalSeats.find((s) => s.trueRoleId === 'drunk');
    const drunkFake = drunkSeat ? drunkSeat.perceivedRoleId : null;
    const finalRoleIds = isDrunkActive
      ? Array.from(new Set([...selectedRoleIds, 'drunk']))
      : selectedRoleIds;
    const { recommendedBluffs } = computeSafeDemonBluffs(finalRoleIds, drunkFake);

    onCompleteWebPlay({
      playerCount,
      selectedRoleIds: finalRoleIds,
      isDrunkActive,
      drunkFakeRoleId: drunkFake,
      demonBluffIds: recommendedBluffs,
      players: finalSeats,
    });
  };

  const remainingBodies = bodies.filter((b) => !b.removed);
  const spreadPositions = useMemo(
    () => createSpreadLayout(remainingBodies.length, BAG_ARENA_W, BAG_ARENA_H),
    [remainingBodies.length]
  );

  const pickedSlot = bagSlots.find((s) => s.slotId === pickedSlotId) ?? null;
  const pickedRole = pickedSlot ? ROLE_MAP[pickedSlot.roleId] : null;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {subStep === 'setup' && (
        <ParchmentSurface className="rounded-3xl p-4 sm:p-7 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#655342]/25 pb-4">
            <div className="flex items-center gap-3">
              <img src={ART_ASSETS.editionTb} alt="Trouble Brewing" className="w-11 h-11 object-contain" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#5c4a37]">
                  Mode 1 · Pass-and-Play Kantong Velvet
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2a2018]">
                  Siapkan Isi Kantong Token
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancelToDashboard}
              className="px-4 py-2 rounded-xl border border-[#655342]/30 text-xs font-bold text-[#5c4a37] hover:bg-[#66533f]/10 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Beranda</span>
            </button>
          </div>

          {/* Controls Bar: Player count + Drunk Toggle + Balanced Shuffle + Clear */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7 space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#5c4a37]">
                1. Pilih Jumlah Pemain (5 – 15)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 11 }, (_, i) => i + 5).map((cnt) => {
                  const active = cnt === playerCount;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setPlayerCount(clampPlayerCount(cnt))}
                      className={`w-10 h-10 rounded-xl font-mono text-sm font-bold transition-all cursor-pointer tabular-nums ${
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
                Target Resmi {playerCount} Pemain:{' '}
                <strong className="text-[#2a2018]">
                  {baseCounts.townsfolk} Townsfolk · {baseCounts.outsiders} Outsider ·{' '}
                  {baseCounts.minions} Minion · {baseCounts.demons} Demon
                </strong>
                {selectedRoleIds.includes('baron') && ' (+2 Outsider / -2 Townsfolk dari Baron)'}
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsDrunkActive((prev) => !prev);
                  setSetupError(null);
                }}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  isDrunkActive
                    ? 'border-[#c9963a] bg-[#c9963a]/25 text-[#2a2018] ring-1 ring-[#c9963a]'
                    : 'border-[#655342]/30 bg-[#66533f]/[0.06] text-[#5c4a37]'
                }`}
              >
                <Beer className="w-4 h-4" />
                <span>The Drunk: {isDrunkActive ? 'AKTIF' : 'Nonaktif'}</span>
              </button>

              <button
                type="button"
                onClick={handleRandomizeBalanced}
                className="px-4 py-2.5 rounded-xl bg-[#2a2018] hover:bg-[#3e2f23] text-[#efe6d2] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Shuffle className="w-4 h-4 text-[#c9963a]" />
                <span>Acak + Formula</span>
              </button>

              <button
                type="button"
                onClick={handleClearBag}
                className="px-3 py-2.5 rounded-xl border border-[#655342]/30 text-xs font-bold text-[#5c4a37] hover:bg-[#66533f]/10 flex items-center gap-1 cursor-pointer"
                title="Reset pilihan ke 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset 0</span>
              </button>
            </div>
          </div>

          {/* Transparent Formula Breakdown after Acak */}
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

          {/* Selected Count Progress Bar */}
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
              Total: {selectedRoleIds.filter((id) => id !== 'drunk').length}/{playerCount}
            </span>
          </div>

          {/* TB Character Picker Grid (Imp is ALWAYS clickable!) */}
          <div className="space-y-5">
            {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map((teamKey) => {
              const teamRoles = ROLES.filter((r) => r.team === teamKey);
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
                    {teamRoles.map((role) => {
                      const picked = selectedRoleIds.includes(role.id);
                      const isDrunkCard = role.id === 'drunk';
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            if (isDrunkCard) {
                              setIsDrunkActive((prev) => !prev);
                              if (!picked && !isDrunkActive) {
                                // Toggle Drunk modifier cleanly
                              } else {
                                setSelectedRoleIds((prev) => prev.filter((id) => id !== 'drunk'));
                              }
                            } else {
                              handleToggleRole(role.id);
                            }
                          }}
                          title={role.ability}
                          className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                            picked || (isDrunkCard && isDrunkActive)
                              ? 'border-[#c9963a] bg-[#c9963a]/25 ring-2 ring-[#c9963a]/50 shadow-sm scale-[1.02]'
                              : 'border-[#655342]/20 bg-[#66533f]/[0.04] hover:bg-[#66533f]/[0.14]'
                          }`}
                        >
                          <CharacterTokenFront role={role} size={52} showSetupLeaf />
                          <span className="text-[11px] font-bold text-[#2a2018] leading-tight text-center truncate w-full">
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

          {/* Launch Interactive Velvet Bag */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#655342]/25">
            <button
              type="button"
              onClick={handleOpenVelvetBag}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#2a2018] hover:bg-[#3f3125] text-[#efe6d2] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-[#c9963a]" />
              <span>Masukkan ke Kantong Velvet &amp; Mulai Ambil ({playerCount} Pemain)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </ParchmentSurface>
      )}

      {/* === SUBSTEP 2: INTERACTIVE VELVET DRAWSTRING BAG (STIR & PICK!) === */}
      {subStep === 'bag' && (
        <VelvetBackdrop
          colour="midnight"
          className="rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#c9963a]/35"
          contentClassName="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9963a]">
                Kantong Velvet Tertutup · Pemain #{assignedSeats.length + 1} dari {playerCount}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#efe6d2]">
                Aduk Kantong &amp; Ketuk 1 Token untuk Mengambil
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSpreadMode((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  spreadMode
                    ? 'bg-[#c9963a] border-[#c9963a] text-[#2a2018]'
                    : 'bg-black/45 border-[#c9963a]/35 text-[#efe6d2]'
                }`}
              >
                {spreadMode ? <LayoutGrid className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
                <span>{spreadMode ? 'Tampilan Susun Kipas' : 'Mode Kantong Acak'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSubStep('setup')}
                className="px-3 py-1.5 rounded-xl bg-black/45 border border-white/15 text-xs font-bold text-[#a89f8c] hover:text-white cursor-pointer"
              >
                Ulangi Setup
              </button>
            </div>
          </div>

          <p className="text-xs text-[#a89f8c]">
            Geser jari/mouse di dalam lingkaran untuk mengaduk kepingan, lalu <strong>ketuk/klik satu token tertutup</strong> yang ingin kamu ambil ({remainingBodies.length} tersisa).
          </p>

          {/* Stirring Bag Arena */}
          <div className="flex justify-center">
            <div
              ref={arenaRef}
              onPointerDown={handleArenaPointerDown}
              onPointerMove={handleArenaPointerMove}
              onPointerUp={handleArenaPointerUp}
              onPointerLeave={() => {
                pointerStateRef.current = null;
              }}
              style={{
                width: '100%',
                maxWidth: BAG_ARENA_W,
                aspectRatio: `${BAG_ARENA_W} / ${BAG_ARENA_H}`,
                touchAction: 'none',
              }}
              className="relative rounded-[999px] border-2 border-[#c9963a]/40 bg-black/45 shadow-[inset_0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden select-none cursor-grab active:cursor-grabbing"
            >
              {/* Drawstring gold cord shimmer ring */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-3 rounded-[999px] border border-dashed border-[#c9963a]/30"
              />

              {remainingBodies.map((body, idx) => {
                const spreadPt = spreadPositions[idx];
                const leftPct = spreadMode && spreadPt
                  ? (spreadPt.x / BAG_ARENA_W) * 100
                  : (body.x / BAG_ARENA_W) * 100;
                const topPct = spreadMode && spreadPt
                  ? (spreadPt.y / BAG_ARENA_H) * 100
                  : (body.y / BAG_ARENA_H) * 100;
                const coinPx = spreadMode && spreadPt ? spreadPt.size : bagBounds.tokenSize;

                return (
                  <div
                    key={body.id}
                    onPointerDown={(e) => handleTokenPointerDown(body.id, e)}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: `translate(-50%, -50%) rotate(${spreadMode ? 0 : body.angle}deg)`,
                      transition: spreadMode
                        ? 'left 260ms ease, top 260ms ease, transform 260ms ease'
                        : undefined,
                    }}
                    className="absolute hover:scale-105 hover:z-20 cursor-pointer"
                  >
                    <TokenBackDisc size={coinPx} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remaining Progress Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {assignedSeats.map((s) => (
              <span
                key={s.seatIndex}
                className="px-2.5 py-0.5 rounded-full bg-black/50 border border-[#c9963a]/30 text-[11px] font-mono text-[#efe6d2]"
              >
                #{s.seatIndex + 1} {s.name}
              </span>
            ))}
          </div>
        </VelvetBackdrop>
      )}

      {/* === SUBSTEP 3: 3D TOKEN FLIP REVEAL & PLAYER NAME === */}
      {subStep === 'reveal' && pickedRole && (
        <VelvetBackdrop
          colour="midnight"
          center
          className="rounded-3xl min-h-[64dvh] p-5 sm:p-8 shadow-2xl border border-[#c9963a]/40"
        >
          <div className="max-w-lg mx-auto w-full flex flex-col items-center text-center gap-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c9963a]">
              Kursi #{assignedSeats.length + 1} · Token Terambil
            </span>

            <TokenFlip3D
              flipped={tokenFlipped}
              size={168}
              back={<TokenBackDisc size={168} highlighted />}
              front={<CharacterTokenFront role={pickedRole} size={168} showAbility />}
            />

            <div className="space-y-1">
              <div className="font-mono text-xs uppercase tracking-widest text-[#c9963a]">
                {pickedRole.team.toUpperCase()}
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#efe6d2]">
                {pickedRole.name}{' '}
                <span className="text-lg font-normal text-[#a89f8c]">
                  ({pickedRole.indonesianName})
                </span>
              </h2>
            </div>

            <ParchmentSurface className="w-full rounded-2xl p-4 text-left">
              <p className="text-xs sm:text-sm leading-relaxed text-[#2a2018]">
                {renderAbilitySegments(pickedRole.ability)}
              </p>
            </ParchmentSurface>

            <form onSubmit={handleConfirmPlayerAndHide} className="w-full space-y-3">
              <div className="text-left space-y-1">
                <label className="text-xs font-semibold text-[#efe6d2]">
                  Tulis Nama Kamu (untuk Kursi #{assignedSeats.length + 1}):
                </label>
                <input
                  type="text"
                  autoFocus
                  maxLength={24}
                  value={playerNameInput}
                  onChange={(e) => {
                    setPlayerNameInput(e.target.value);
                    setPickError(null);
                  }}
                  placeholder={`Misal: ${DEFAULT_INDONESIAN_NAMES[assignedSeats.length] || 'Pemain'}`}
                  className="w-full px-4 py-3 rounded-2xl bg-black/55 border border-[#c9963a]/50 text-base font-bold text-[#efe6d2] placeholder:text-[#a89f8c]/55 focus:outline-none focus:ring-2 focus:ring-[#c9963a]"
                />
              </div>

              {pickError && (
                <p className="text-xs font-bold text-[#e0574b]">{pickError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                <EyeOff className="w-4 h-4" />
                <span>
                  {assignedSeats.length + 1 >= playerCount
                    ? 'Sembunyikan & Selesaikan Pembagian'
                    : 'Sembunyikan Peran & Oper ke Pemain Berikutnya'}
                </span>
              </button>
            </form>
          </div>
        </VelvetBackdrop>
      )}

      {/* === SUBSTEP 4: HANDOFF PRIVACY CURTAIN === */}
      {subStep === 'handoff' && (
        <VelvetBackdrop
          colour="midnight"
          center
          className="rounded-3xl min-h-[64dvh] p-6 sm:p-10 shadow-2xl border border-[#c9963a]/35"
        >
          <div className="max-w-md mx-auto space-y-5">
            <img
              src={ART_ASSETS.tokenBack}
              alt=""
              className="w-24 h-24 mx-auto object-contain drop-shadow-xl"
            />
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c9963a]">
                Privasi Terjaga
              </p>
              <h2 className="font-display text-3xl font-bold text-[#efe6d2]">
                Serahkan ke Pemain #{assignedSeats.length + 1}
              </h2>
              <p className="text-xs sm:text-sm text-[#a89f8c]">
                Pastikan pemain sebelumnya sudah selesai, lalu buka kembali kantong velvet di bawah.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubStep('bag')}
              className="px-7 py-3.5 rounded-full bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold text-sm cursor-pointer shadow-xl"
            >
              Saya Pemain #{assignedSeats.length + 1} — Buka Kantong
            </button>
          </div>
        </VelvetBackdrop>
      )}

      {/* === SUBSTEP 5: STORYTELLER DRUNK DESIGNATION === */}
      {subStep === 'drunk_assign' && (
        <ParchmentSurface className="rounded-3xl p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-3 border-b border-[#655342]/25 pb-3">
            <Beer className="w-6 h-6 text-[#c9963a]" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#5c4a37]">
                Layar Storyteller Saja
              </p>
              <h2 className="font-display text-2xl font-bold text-[#2a2018]">
                Pilih Siapa yang Diam-Diam Menjadi The Drunk
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedSeats
              .filter((s) => ROLE_MAP[s.perceivedRoleId]?.team === 'townsfolk')
              .map((s) => {
                const role = ROLE_MAP[s.perceivedRoleId];
                const selected = drunkSeatIndex === s.seatIndex;
                return (
                  <button
                    key={s.seatIndex}
                    type="button"
                    onClick={() => setDrunkSeatIndex(s.seatIndex)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      selected
                        ? 'border-[#c9963a] bg-[#c9963a]/25 ring-2 ring-[#c9963a]'
                        : 'border-[#655342]/25 bg-[#66533f]/[0.05] hover:bg-[#66533f]/[0.14]'
                    }`}
                  >
                    {role && <CharacterTokenFront role={role} size={46} showSetupLeaf={false} />}
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-base font-bold text-[#2a2018]">
                        #{s.seatIndex + 1} {s.name}
                      </div>
                      <div className="text-xs text-[#5c4a37]">Mengira dirinya: {role?.name}</div>
                    </div>
                  </button>
                );
              })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={drunkSeatIndex === null}
              onClick={() => setSubStep('ready')}
              className="px-6 py-3 rounded-2xl bg-[#2a2018] disabled:opacity-40 text-[#efe6d2] font-bold text-sm cursor-pointer"
            >
              Simpan Pilihan &amp; Siapkan Meja Grimoire
            </button>
          </div>
        </ParchmentSurface>
      )}

      {/* === SUBSTEP 6: READY FOR STORYTELLER === */}
      {subStep === 'ready' && (
        <VelvetBackdrop
          colour="midnight"
          center
          className="rounded-3xl min-h-[64dvh] p-6 sm:p-10 shadow-2xl border border-[#c9963a]/40"
        >
          <div className="max-w-lg mx-auto space-y-5">
            <ShieldCheck className="w-12 h-12 text-[#c9963a] mx-auto" />
            <div className="space-y-1.5">
              <h2 className="font-display text-3xl font-bold text-[#efe6d2]">
                Semua {playerCount} Token Sudah Terbagikan
              </h2>
              <p className="text-xs sm:text-sm text-[#a89f8c]">
                Ambil kembali perangkat ke Storyteller, lalu buka Meja Grimoire untuk memandu Malam Pertama.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 py-2">
              {assignedSeats.map((s) => (
                <span
                  key={s.seatIndex}
                  className="px-3 py-1 rounded-full bg-black/55 border border-[#c9963a]/30 text-xs font-semibold text-[#efe6d2]"
                >
                  #{s.seatIndex + 1} {s.name}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={handleLaunchGrimoire}
              className="px-8 py-4 rounded-full bg-[#c9963a] hover:bg-[#d8a74c] text-[#2a2018] font-bold text-base flex items-center gap-2 mx-auto cursor-pointer shadow-xl"
            >
              <Swords className="w-5 h-5" />
              <span>Buka Meja Grimoire Storyteller</span>
            </button>
          </div>
        </VelvetBackdrop>
      )}
    </div>
  );
}
