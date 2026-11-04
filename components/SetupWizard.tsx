'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Beer,
  Check,
  ChevronDown,
  ChevronLeft,
  Crown,
  Eye,
  Flame,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Shuffle,
  Swords,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  CHARACTER_COUNTS,
  ROLE_MAP,
  ROLES,
  RoleDefinition,
  TeamType,
} from '@/lib/botc-data';
import {
  PlayerSeat,
  autoSelectRoles,
  clampPlayerCount,
  computeSafeDemonBluffs,
  getBaseCharacterCounts,
  getEffectiveCharacterCounts,
  getUnusedTownsfolkForDrunk,
} from '@/lib/botc-engine';
import { CharacterToken, RoleGlyph } from './TokenArtwork';
import { SilentCardPayload } from './FullscreenCardModal';

const WIZARD_DRAFT_KEY = 'botc_tb_unified_setup_v3';

interface SeatDraft {
  seatIndex: number;
  name: string;
  roleId: string;
  drunkFakeRoleId?: string;
}

interface UnifiedDraft {
  playerCount: number;
  seats: SeatDraft[];
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

function loadInitialWizardDraft(): UnifiedDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UnifiedDraft;
    if (parsed && typeof parsed.playerCount === 'number' && Array.isArray(parsed.seats)) {
      return parsed;
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export default function SetupWizard({
  initialPlayerCount,
  onCancelToDashboard,
  onCompleteSetup,
  onQuickStartDemo,
  onShowSilentCard,
}: SetupWizardProps) {
  const initialSavedDraft = useMemo(() => loadInitialWizardDraft(), []);

  const [playerCount, setPlayerCount] = useState<number>(() => {
    if (initialSavedDraft) return clampPlayerCount(initialSavedDraft.playerCount);
    return clampPlayerCount(initialPlayerCount);
  });

  // Generate initial legal setup for count
  const initialAuto = useMemo(() => {
    const count = initialSavedDraft
      ? clampPlayerCount(initialSavedDraft.playerCount)
      : clampPlayerCount(initialPlayerCount);
    return autoSelectRoles(count, {
      forceDrunk: count >= 6,
      seed: 108,
    });
  }, [initialPlayerCount, initialSavedDraft]);

  // Player seats: Name starts strictly empty! Roles default to a balanced legal starting setup
  const [seats, setSeats] = useState<SeatDraft[]>(() => {
    if (initialSavedDraft && Array.isArray(initialSavedDraft.seats)) {
      const clamped = clampPlayerCount(initialSavedDraft.playerCount);
      const restored: SeatDraft[] = [];
      for (let i = 0; i < clamped; i++) {
        const saved = initialSavedDraft.seats[i];
        restored.push({
          seatIndex: i,
          name: saved?.name ?? '',
          roleId: saved?.roleId ?? 'washerwoman',
          drunkFakeRoleId: saved?.drunkFakeRoleId,
        });
      }
      return restored;
    }

    const count = clampPlayerCount(initialPlayerCount);
    const assignedRoles = [...initialAuto.selectedRoleIds];
    return Array.from({ length: count }, (_, idx) => {
      const roleId = assignedRoles[idx] ?? 'washerwoman';
      return {
        seatIndex: idx,
        name: '', // STRICT REQUIREMENT: No default names! Empty!
        roleId,
        drunkFakeRoleId: roleId === 'drunk' ? initialAuto.drunkFakeRoleId ?? 'investigator' : undefined,
      };
    });
  });

  // Modal for selecting a role for a specific seat
  const [activePickerSeatIdx, setActivePickerSeatIdx] = useState<number | null>(null);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Persist draft to localStorage on changes
  useEffect(() => {
    try {
      const draft: UnifiedDraft = {
        playerCount,
        seats,
      };
      window.localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage errors
    }
  }, [playerCount, seats]);

  // Adjust Player Count Handler (5-15)
  const handleCountChange = (newCountRaw: number) => {
    const newCount = clampPlayerCount(newCountRaw);
    setPlayerCount(newCount);
    setErrorMessage(null);

    const auto = autoSelectRoles(newCount, { forceDrunk: newCount >= 6 });
    setSeats((prev) => {
      const next: SeatDraft[] = [];
      for (let i = 0; i < newCount; i++) {
        const existing = prev[i];
        const roleId = existing?.roleId ?? auto.selectedRoleIds[i] ?? 'washerwoman';
        next.push({
          seatIndex: i,
          name: existing?.name ?? '', // Keep typed names or empty
          roleId,
          drunkFakeRoleId: roleId === 'drunk' ? existing?.drunkFakeRoleId ?? auto.drunkFakeRoleId ?? 'investigator' : undefined,
        });
      }
      return next;
    });
  };

  // Quick action: Fill with official auto-balanced Trouble Brewing roles
  const handleAutoBalance = (withDrunk: boolean) => {
    const auto = autoSelectRoles(playerCount, { forceDrunk: withDrunk, seed: Date.now() });
    setSeats((prev) => {
      return prev.map((s, idx) => {
        const roleId = auto.selectedRoleIds[idx] ?? 'washerwoman';
        return {
          ...s,
          roleId,
          drunkFakeRoleId: roleId === 'drunk' ? auto.drunkFakeRoleId ?? 'investigator' : undefined,
        };
      });
    });
    setErrorMessage(null);
  };

  // Quick action: Shuffle existing roles between seats
  const handleShuffleRoles = () => {
    setSeats((prev) => {
      const roleAssignments = prev.map((s) => ({
        roleId: s.roleId,
        drunkFakeRoleId: s.drunkFakeRoleId,
      }));
      // Fisher-Yates shuffle
      for (let i = roleAssignments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roleAssignments[i], roleAssignments[j]] = [roleAssignments[j], roleAssignments[i]];
      }
      return prev.map((s, idx) => ({
        ...s,
        roleId: roleAssignments[idx].roleId,
        drunkFakeRoleId: roleAssignments[idx].drunkFakeRoleId,
      }));
    });
  };

  // Quick action: Clear all names
  const handleClearNames = () => {
    setSeats((prev) => prev.map((s) => ({ ...s, name: '' })));
  };

  // Seat Role Assignment
  const handleSelectRoleForSeat = (seatIdx: number, newRoleId: string) => {
    const roleDef = ROLE_MAP[newRoleId];
    if (!roleDef) return;

    // Check Drunk limit: strictly max 1 Drunk
    if (newRoleId === 'drunk') {
      const alreadyHasDrunk = seats.some((s) => s.seatIndex !== seatIdx && s.roleId === 'drunk');
      if (alreadyHasDrunk) {
        setErrorMessage('Hanya boleh ada 1 Drunk dalam permainan! Aturan resmi Trouble Brewing membatasi Drunk maksimal 1 orang.');
        return;
      }
    }

    setErrorMessage(null);

    setSeats((prev) => {
      // If new role is Drunk, pick first unused Townsfolk as their fake role
      let fakeRole: string | undefined = undefined;
      if (newRoleId === 'drunk') {
        const inPlay = prev.map((s) => s.roleId);
        const unused = ROLES.filter((r) => r.team === 'townsfolk' && !inPlay.includes(r.id));
        fakeRole = unused[0]?.id ?? 'investigator';
      }

      // If another seat had this unique role, swap or reassign
      return prev.map((s) => {
        if (s.seatIndex === seatIdx) {
          return {
            ...s,
            roleId: newRoleId,
            drunkFakeRoleId: fakeRole,
          };
        }
        // If another seat had this role (and it's not Demon where only 1 Imp exists), swap them
        if (s.roleId === newRoleId && newRoleId !== 'washerwoman') {
          return {
            ...s,
            roleId: prev[seatIdx].roleId,
            drunkFakeRoleId: prev[seatIdx].drunkFakeRoleId,
          };
        }
        return s;
      });
    });

    setActivePickerSeatIdx(null);
  };

  // Update Drunk fake Townsfolk role
  const handleUpdateDrunkFake = (seatIdx: number, fakeRoleId: string) => {
    setSeats((prev) =>
      prev.map((s) =>
        s.seatIndex === seatIdx ? { ...s, drunkFakeRoleId: fakeRoleId } : s
      )
    );
  };

  // Calculations & Validation
  const currentRoleIds = seats.map((s) => s.roleId);
  const effectiveCounts = getEffectiveCharacterCounts(playerCount, currentRoleIds);

  const counts = useMemo(() => {
    let townsfolk = 0;
    let outsiders = 0;
    let minions = 0;
    let demons = 0;

    for (const s of seats) {
      const r = ROLE_MAP[s.roleId];
      if (!r) continue;
      if (r.team === 'townsfolk') townsfolk++;
      else if (r.team === 'outsider') outsiders++;
      else if (r.team === 'minion') minions++;
      else if (r.team === 'demon') demons++;
    }

    return { townsfolk, outsiders, minions, demons };
  }, [seats]);

  const hasDrunk = seats.some((s) => s.roleId === 'drunk');
  const drunkSeat = seats.find((s) => s.roleId === 'drunk');

  // Townsfolk available for Drunk (Townsfolk not taken by any actual player)
  const availableTownsfolkForDrunk = useMemo(() => {
    const takenTownsfolk = new Set(
      seats.filter((s) => s.roleId !== 'drunk').map((s) => s.roleId)
    );
    return ROLES.filter((r) => r.team === 'townsfolk' && !takenTownsfolk.has(r.id));
  }, [seats]);

  // Validation Check
  const validationErrors: string[] = [];
  if (counts.townsfolk !== effectiveCounts.townsfolk) {
    validationErrors.push(
      `Townsfolk: saat ini ${counts.townsfolk}, dibutuhkan ${effectiveCounts.townsfolk}.`
    );
  }
  if (counts.outsiders !== effectiveCounts.outsiders) {
    validationErrors.push(
      `Outsider: saat ini ${counts.outsiders}, dibutuhkan ${effectiveCounts.outsiders}.`
    );
  }
  if (counts.minions !== effectiveCounts.minions) {
    validationErrors.push(
      `Minion: saat ini ${counts.minions}, dibutuhkan ${effectiveCounts.minions}.`
    );
  }
  if (counts.demons !== effectiveCounts.demons) {
    validationErrors.push(
      `Demon: saat ini ${counts.demons}, dibutuhkan ${effectiveCounts.demons} (Imp).`
    );
  }

  // Check duplicate non-drunk roles
  const roleOccurrences: Record<string, number> = {};
  for (const s of seats) {
    roleOccurrences[s.roleId] = (roleOccurrences[s.roleId] || 0) + 1;
  }
  const duplicateRoles = Object.entries(roleOccurrences).filter(
    ([id, cnt]) => cnt > 1 && id !== 'washerwoman'
  );
  if (duplicateRoles.length > 0) {
    validationErrors.push(
      `Peran duplikat: ${duplicateRoles.map(([id]) => ROLE_MAP[id]?.name).join(', ')} dipilih lebih dari satu kali.`
    );
  }

  if (hasDrunk && !drunkSeat?.drunkFakeRoleId) {
    validationErrors.push('Pilih karakter Townsfolk yang dikira oleh Drunk.');
  }

  // Launch Game
  const handleStartGame = () => {
    // Check names
    const emptyNames = seats.filter((s) => !s.name.trim());
    if (emptyNames.length > 0) {
      setErrorMessage(
        `Ada ${emptyNames.length} nama pemain yang masih kosong (contoh Kursi ${
          emptyNames[0].seatIndex + 1
        }). Silakan isi nama semua pemain terlebih dahulu!`
      );
      return;
    }

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      return;
    }

    // Build PlayerSeat[]
    const finalSelectedRoleIds = seats.map((s) => s.roleId);
    const resolvedDrunkFake = hasDrunk ? drunkSeat?.drunkFakeRoleId ?? null : null;

    const { recommendedBluffs } = computeSafeDemonBluffs(
      finalSelectedRoleIds,
      resolvedDrunkFake,
      108 + playerCount
    );

    const generatedPlayers: PlayerSeat[] = seats.map((s) => {
      const isDrunk = s.roleId === 'drunk';
      const perceivedRoleId = isDrunk && resolvedDrunkFake ? resolvedDrunkFake : s.roleId;

      return {
        id: `seat-${s.seatIndex + 1}`,
        seatIndex: s.seatIndex,
        name: s.name.trim(),
        trueRoleId: s.roleId,
        perceivedRoleId,
        isAlive: true,
        hasGhostVote: true,
        reminders: isDrunk
          ? [
              {
                instanceId: `rem-drunk-${s.seatIndex}`,
                reminderId: 'is_the_drunk',
              },
            ]
          : [],
      };
    });

    onCompleteSetup({
      playerCount,
      selectedRoleIds: finalSelectedRoleIds,
      drunkFakeRoleId: resolvedDrunkFake,
      demonBluffIds: recommendedBluffs,
      players: generatedPlayers,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Setup Hero / Title Header */}
      <div className="bg-[#181520] border border-[#2A2636] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FDE68A] text-xs font-bold uppercase tracking-wider">
                Setup Terpadu Trouble Brewing
              </span>
              <span className="text-xs text-[#A8A092]">Bahasa Indonesia Resmi</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
              Pengaturan Pemain & Peran
            </h1>
            <p className="text-xs sm:text-sm text-[#BDB5A7] mt-0.5 max-w-2xl">
              Tentukan jumlah pemain, ketik nama di setiap kursi, dan pilih peran langsung dengan icon. Tanpa langkah bertingkat yang berulang!
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

        {/* Player Count Control (5-15) */}
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
              onClick={() => handleCountChange(playerCount - 1)}
              disabled={playerCount <= 5}
              aria-label="Kurangi Pemain"
              className="w-10 h-10 rounded-xl bg-[#221B2E] hover:bg-[#312742] disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-[#382E4D]"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Quick Count Pills */}
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto p-1 bg-[#1A1525] rounded-xl border border-[#2A2338]">
              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleCountChange(cnt)}
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
              onClick={() => handleCountChange(playerCount + 1)}
              disabled={playerCount >= 15}
              aria-label="Tambah Pemain"
              className="w-10 h-10 rounded-xl bg-[#221B2E] hover:bg-[#312742] disabled:opacity-40 text-white font-bold flex items-center justify-center cursor-pointer disabled:cursor-not-allowed border border-[#382E4D]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role Composition Target Bar */}
        <div className="p-4 rounded-2xl bg-[#13101C] border border-[#2B243B] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#E5DFD5]">
              Target Standar Trouble Brewing ({playerCount} Pemain):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAutoBalance(playerCount >= 6)}
                className="px-2.5 py-1 rounded-lg bg-[#251E33] hover:bg-[#362A4B] text-[11px] font-bold text-[#D4AF37] border border-[#44355D] flex items-center gap-1 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Isi Otomatis Rekomendasi</span>
              </button>
              <button
                type="button"
                onClick={handleShuffleRoles}
                className="px-2.5 py-1 rounded-lg bg-[#1F192C] hover:bg-[#2B233D] text-[11px] font-semibold text-[#EDE7DB] border border-[#332A47] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Acak Posisi</span>
              </button>
              <button
                type="button"
                onClick={handleClearNames}
                className="px-2.5 py-1 rounded-lg bg-[#1F192C] hover:bg-[#2B233D] text-[11px] font-semibold text-[#A8A092] border border-[#332A47] cursor-pointer"
              >
                Kosongkan Nama
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold">
            {/* Townsfolk */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                counts.townsfolk === effectiveCounts.townsfolk
                  ? 'bg-[#1E293B]/60 border-[#3B82F6]/70 text-[#93C5FD]'
                  : 'bg-[#1C1628] border-[#382F4C] text-[#C4BCAD]'
              }`}
            >
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#60A5FA]">
                  Townsfolk
                </span>
                <span className="text-[10px] text-[#A8A092]">Warga Kota</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-black">
                  {counts.townsfolk}/{effectiveCounts.townsfolk}
                </span>
              </div>
            </div>

            {/* Outsiders */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                counts.outsiders === effectiveCounts.outsiders
                  ? 'bg-[#162738]/60 border-[#38BDF8]/70 text-[#7DD3FC]'
                  : 'bg-[#1C1628] border-[#382F4C] text-[#C4BCAD]'
              }`}
            >
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
                  Outsider
                </span>
                <span className="text-[10px] text-[#A8A092]">Warga Luar</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-black">
                  {counts.outsiders}/{effectiveCounts.outsiders}
                </span>
              </div>
            </div>

            {/* Minions */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                counts.minions === effectiveCounts.minions
                  ? 'bg-[#2E161A]/60 border-[#EF4444]/70 text-[#FCA5A5]'
                  : 'bg-[#1C1628] border-[#382F4C] text-[#C4BCAD]'
              }`}
            >
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#EF4444]">
                  Minion
                </span>
                <span className="text-[10px] text-[#A8A092]">Anak Buah Evil</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-black">
                  {counts.minions}/{effectiveCounts.minions}
                </span>
              </div>
            </div>

            {/* Demon */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                counts.demons === effectiveCounts.demons
                  ? 'bg-[#351418]/60 border-[#DC2626]/70 text-[#FCA5A5]'
                  : 'bg-[#1C1628] border-[#382F4C] text-[#C4BCAD]'
              }`}
            >
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#DC2626]">
                  Demon (Imp)
                </span>
                <span className="text-[10px] text-[#A8A092]">Iblis Utama</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-black">
                  {counts.demons}/{effectiveCounts.demons}
                </span>
              </div>
            </div>
          </div>

          {hasDrunk && (
            <div className="p-3 rounded-xl bg-[#261E13] border border-[#D97706]/50 flex items-center gap-2.5 text-xs text-[#FDE68A]">
              <Beer className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>
                <strong>Karakter Drunk Aktif:</strong> Drunk adalah Outsider yang mengira dirinya adalah Townsfolk. Token Townsfolk palsu dimasukkan ke dalam tas untuknya (+1 token Townsfolk yang tampak).
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error / Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#2B1417] border border-[#EF4444] text-[#FECACA] text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#F87171]" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Players List: Direct Name & Role Assignment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-display text-lg font-bold text-[#F5EFE6]">
            Daftar Kursi Pemain ({playerCount} Kursi)
          </h2>
          <span className="text-xs text-[#A8A092]">
            Ketik nama & klik tombol peran untuk mengganti peran
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {seats.map((seat, index) => {
            const role = ROLE_MAP[seat.roleId];
            const isDrunkSeat = seat.roleId === 'drunk';
            const fakeTownsfolk = seat.drunkFakeRoleId ? ROLE_MAP[seat.drunkFakeRoleId] : null;

            return (
              <div
                key={seat.seatIndex}
                className={`p-4 rounded-2xl border transition-all ${
                  isDrunkSeat
                    ? 'bg-[#1C1726] border-[#D97706]/60 shadow-lg'
                    : 'bg-[#171320] border-[#2A2438] hover:border-[#3E3452]'
                }`}
              >
                {/* Row Header: Seat number + Name input */}
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#120F1A] border-2 border-[#D4AF37] font-mono text-xs font-black text-[#FDE68A] flex items-center justify-center shrink-0 tabular-nums shadow-sm">
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
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
                </div>

                {/* Role Picker Trigger Button */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleSearchQuery('');
                      setActivePickerSeatIdx(seat.seatIndex);
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
                      <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center shrink-0">
                        <RoleGlyph roleId={seat.roleId} className="w-5 h-5 text-[#FDE68A]" />
                      </div>

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

                {/* If Drunk: Inline Fake Townsfolk Picker */}
                {isDrunkSeat && (
                  <div className="mt-3 p-3 rounded-xl bg-[#231A10] border border-[#D97706]/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#FDE68A] flex items-center gap-1.5">
                        <Beer className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>Mengira sebagai Townsfolk:</span>
                      </span>
                      <span className="text-[10px] text-[#E5D7B7]">
                        Token yang diberikan ke pemain
                      </span>
                    </div>

                    <select
                      value={seat.drunkFakeRoleId ?? ''}
                      onChange={(e) => handleUpdateDrunkFake(seat.seatIndex, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#140F0A] border border-[#78350F] text-xs font-bold text-white focus:outline-none focus:border-[#F59E0B]"
                    >
                      {availableTownsfolkForDrunk.map((tf) => (
                        <option key={tf.id} value={tf.id}>
                          {tf.name} ({tf.indonesianName})
                        </option>
                      ))}
                    </select>

                    <p className="text-[11px] text-[#E5D7B7]/80 leading-tight">
                      Pemain ini mengira dia adalah{' '}
                      <strong>{fakeTownsfolk?.name}</strong>. Jumlah Townsfolk dalam tas bertambah 1 token untuknya.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Game Action Banner */}
      <div className="bg-[#181520] border border-[#2A2636] rounded-3xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                validationErrors.length === 0 ? 'bg-[#10B981]' : 'bg-[#EF4444]'
              }`}
            />
            <span className="font-bold text-sm text-[#F5EFE6]">
              {validationErrors.length === 0
                ? 'Komposisi Peran Lengkap & Seimbang!'
                : 'Peringatan Komposisi Peran:'}
            </span>
          </div>
          <p className="text-xs text-[#A8A092] mt-0.5">
            {validationErrors.length === 0
              ? 'Seluruh pemain dan peran telah memenuhi aturan resmi Trouble Brewing. Klik tombol di kanan untuk mulai!'
              : validationErrors[0]}
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartGame}
          className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-[#121016] font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Mulai Permainan Grimoire</span>
        </button>
      </div>

      {/* Role Picker Modal */}
      {activePickerSeatIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pilih Karakter untuk Kursi"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-3xl bg-[#15121D] border-2 border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#1C1726] border-b border-[#2E283C]">
              <div>
                <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  Pilih Karakter Trouble Brewing
                </span>
                <h3 className="font-display text-base sm:text-lg font-black text-white">
                  Kursi {activePickerSeatIdx + 1}: {seats[activePickerSeatIdx]?.name || 'Tanpa Nama'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActivePickerSeatIdx(null)}
                aria-label="Tutup Pilihan Karakter"
                className="w-9 h-9 rounded-xl bg-[#292336] hover:bg-[#3B324E] text-[#EDE7DB] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Search */}
            <div className="p-3 bg-[#110E18] border-b border-[#282234]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#7D7588] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roleSearchQuery}
                  onChange={(e) => setRoleSearchQuery(e.target.value)}
                  placeholder="Cari karakter (misal: Washerwoman, Investigator, Imp)..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#1A1524] border border-[#322A42] text-xs sm:text-sm text-white placeholder-[#7D7588] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Grouped Roles Grid */}
            <div className="p-5 overflow-y-auto space-y-5 text-sm">
              {(['townsfolk', 'outsider', 'minion', 'demon'] as TeamType[]).map((team) => {
                const teamRoles = ROLES.filter((r) => {
                  if (r.team !== team) return false;
                  if (!roleSearchQuery) return true;
                  const q = roleSearchQuery.toLowerCase();
                  return (
                    r.name.toLowerCase().includes(q) ||
                    r.indonesianName.toLowerCase().includes(q) ||
                    r.ability.toLowerCase().includes(q)
                  );
                });

                if (teamRoles.length === 0) return null;

                const teamTitle =
                  team === 'townsfolk'
                    ? 'Townsfolk (Warga Kota - 13 Karakter)'
                    : team === 'outsider'
                    ? 'Outsider (Warga Luar - 4 Karakter)'
                    : team === 'minion'
                    ? 'Minion (Anak Buah Evil - 4 Karakter)'
                    : 'Demon (Iblis Utama - 1 Karakter: Imp)';

                return (
                  <div key={team} className="space-y-2.5">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#D4AF37] px-1">
                      {teamTitle}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {teamRoles.map((r) => {
                        const isCurrent = seats[activePickerSeatIdx]?.roleId === r.id;
                        const takenSeat = seats.find(
                          (s) => s.seatIndex !== activePickerSeatIdx && s.roleId === r.id
                        );
                        const isDrunkDisabled =
                          r.id === 'drunk' &&
                          seats.some(
                            (s) => s.seatIndex !== activePickerSeatIdx && s.roleId === 'drunk'
                          );

                        return (
                          <button
                            key={r.id}
                            type="button"
                            disabled={isDrunkDisabled}
                            onClick={() => handleSelectRoleForSeat(activePickerSeatIdx, r.id)}
                            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer text-left transition-all ${
                              isCurrent
                                ? 'bg-[#292236] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                                : isDrunkDisabled
                                ? 'opacity-40 bg-[#120F19] border-[#251E30] cursor-not-allowed'
                                : 'bg-[#181423] hover:bg-[#231D31] border-[#2C243A]'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                              <RoleGlyph roleId={r.id} className="w-5 h-5 text-[#FDE68A]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs sm:text-sm text-white truncate">
                                  {r.name}
                                </span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#D4AF37] text-[#121016] text-[10px] font-black shrink-0">
                                    Dipilih
                                  </span>
                                )}
                                {takenSeat && !isCurrent && (
                                  <span className="text-[10px] text-[#A8A092] truncate shrink-0">
                                    Kursi {takenSeat.seatIndex + 1}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#BFB7A8] font-medium">
                                {r.indonesianName}
                              </p>
                              <p className="text-[11px] text-[#8C8396] line-clamp-2 mt-1 leading-snug">
                                {r.ability}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
