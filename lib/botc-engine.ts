import {
  CHARACTER_COUNTS,
  CharacterCountRow,
  DEFAULT_INDONESIAN_NAMES,
  REMINDER_TOKENS,
  ReminderDefinition,
  ROLE_MAP,
  ROLES,
  RoleDefinition,
} from './botc-data';

export interface PlacedReminder {
  instanceId: string;
  reminderId: string;
}

export interface PlayerSeat {
  id: string;
  seatIndex: number; // 0 to N-1 clockwise
  name: string;
  trueRoleId: string; // e.g. 'drunk' if actually the Drunk
  perceivedRoleId: string; // e.g. 'empath' if Drunk thinks they are Empath; otherwise === trueRoleId
  isAlive: boolean;
  hasGhostVote: boolean;
  reminders: PlacedReminder[];
  deathCause?: 'demon' | 'execution' | 'slayer';
}

export type GamePhase = 'first_night' | 'day' | 'other_night';

export interface NightOrderStep {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  roleId: string | null;
  playerId: string | null;
  playerName: string | null;
  seatNumber: number | null;
  isDrunkPlayer: boolean;
  isPoisonedPlayer: boolean;
  isConditional: boolean;
  instruction: string;
  dynamicHelperText?: string;
  storytellerWarning?: string;
}

export interface EffectiveCounts extends CharacterCountRow {
  hasBaronModifier: boolean;
  hasDrunkModifier: boolean;
  baseTownsfolk: number;
  baseOutsiders: number;
  bagTownsfolk: number;
  bagOutsiders: number;
}

export function clampPlayerCount(count: number): number {
  if (!Number.isFinite(count)) return 8;
  return Math.max(5, Math.min(15, Math.round(count)));
}

export function getBaseCharacterCounts(playerCount: number): CharacterCountRow {
  const clamped = clampPlayerCount(playerCount);
  return CHARACTER_COUNTS[clamped];
}

export function getEffectiveCharacterCounts(
  playerCount: number,
  selectedRoleIds: string[]
): EffectiveCounts {
  const base = getBaseCharacterCounts(playerCount);
  const hasBaron = selectedRoleIds.includes('baron');
  const hasDrunk = selectedRoleIds.includes('drunk');

  let townsfolk = base.townsfolk;
  let outsiders = base.outsiders;

  if (hasBaron) {
    // Trouble Brewing Baron adds +2 Outsiders and removes -2 Townsfolk (capped at max 4 Outsiders available in TB)
    const maxPossibleOutsiders = Math.min(4, base.outsiders + 2);
    const addedOutsiders = maxPossibleOutsiders - base.outsiders;
    outsiders = maxPossibleOutsiders;
    townsfolk = Math.max(0, base.townsfolk - addedOutsiders);
  }

  // When Drunk is in play, the player receives a Townsfolk token (+1 Townsfolk in bag, -1 other Outsiders in bag)
  const bagTownsfolk = hasDrunk ? townsfolk + 1 : townsfolk;
  const bagOutsiders = hasDrunk ? Math.max(0, outsiders - 1) : outsiders;

  return {
    players: base.players,
    townsfolk,
    outsiders,
    minions: base.minions,
    demons: base.demons,
    hasBaronModifier: hasBaron,
    hasDrunkModifier: hasDrunk,
    baseTownsfolk: base.townsfolk,
    baseOutsiders: base.outsiders,
    bagTownsfolk,
    bagOutsiders,
  };
}

export function validateRoleBag(
  playerCount: number,
  selectedRoleIds: string[]
): {
  isValid: boolean;
  errors: string[];
  counts: { townsfolk: number; outsiders: number; minions: number; demons: number };
  required: EffectiveCounts;
} {
  const required = getEffectiveCharacterCounts(playerCount, selectedRoleIds);
  const uniqueIds = Array.from(new Set(selectedRoleIds));

  const counts = {
    townsfolk: 0,
    outsiders: 0,
    minions: 0,
    demons: 0,
  };

  for (const id of uniqueIds) {
    const role = ROLE_MAP[id];
    if (!role) continue;
    if (role.team === 'townsfolk') counts.townsfolk += 1;
    else if (role.team === 'outsider') counts.outsiders += 1;
    else if (role.team === 'minion') counts.minions += 1;
    else if (role.team === 'demon') counts.demons += 1;
  }

  const errors: string[] = [];
  const includesDrunkToken = uniqueIds.includes('drunk');

  // Trouble Brewing allows two valid representations when Drunk is in play:
  // 1. Physical Bag: +1 Townsfolk replaces Drunk token (bagTownsfolk & bagOutsiders)
  // 2. Logical Bag: Drunk token is explicitly included (townsfolk & outsiders)
  const matchesPhysicalDrunkBag =
    required.hasDrunkModifier &&
    counts.townsfolk === required.bagTownsfolk &&
    counts.outsiders === required.bagOutsiders;
  const matchesStandardBag =
    counts.townsfolk === required.townsfolk &&
    counts.outsiders === required.outsiders;

  if (!matchesPhysicalDrunkBag && !matchesStandardBag) {
    const expectedTownsfolk =
      required.hasDrunkModifier && !includesDrunkToken
        ? required.bagTownsfolk
        : required.townsfolk;
    const expectedOutsiders =
      required.hasDrunkModifier && !includesDrunkToken
        ? required.bagOutsiders
        : required.outsiders;

    if (counts.townsfolk !== expectedTownsfolk) {
      errors.push(
        `Pilih tepat ${expectedTownsfolk} karakter Townsfolk${
          required.hasDrunkModifier ? ' (+1 Townsfolk ekstra karena Drunk)' : ''
        } (saat ini ${counts.townsfolk}).`
      );
    }
    if (counts.outsiders !== expectedOutsiders) {
      errors.push(
        `Pilih tepat ${expectedOutsiders} karakter Outsider${
          required.hasDrunkModifier ? ' (Drunk telah digantikan token Townsfolk)' : ''
        } (saat ini ${counts.outsiders}).`
      );
    }
  }

  if (counts.minions !== required.minions) {
    errors.push(`Pilih tepat ${required.minions} karakter Minion (saat ini ${counts.minions}).`);
  }
  if (counts.demons !== required.demons) {
    errors.push(`Pilih tepat ${required.demons} karakter Demon (saat ini ${counts.demons}).`);
  }

  const drunkCount = selectedRoleIds.filter((id) => id === 'drunk').length;
  if (drunkCount > 1) {
    errors.push('Hanya boleh ada 1 Drunk dalam permainan!');
  }

  return {
    isValid: errors.length === 0 && uniqueIds.length === playerCount,
    errors,
    counts,
    required,
  };
}

export function validateRoleSelection(
  playerCount: number,
  selectedRoleIds: string[],
  drunkFakeRoleId: string | null
): {
  isValid: boolean;
  errors: string[];
  counts: { townsfolk: number; outsiders: number; minions: number; demons: number };
  required: EffectiveCounts;
} {
  const bagValidation = validateRoleBag(playerCount, selectedRoleIds);
  const errors = [...bagValidation.errors];
  const uniqueIds = Array.from(new Set(selectedRoleIds));

  if (uniqueIds.includes('drunk')) {
    if (!drunkFakeRoleId) {
      errors.push('Karakter Drunk aktif: pilih 1 peran Townsfolk palsu untuk Drunk.');
    } else {
      const fakeRole = ROLE_MAP[drunkFakeRoleId];
      if (!fakeRole || fakeRole.team !== 'townsfolk') {
        errors.push('Peran palsu untuk Drunk harus berupa karakter Townsfolk.');
      } else if (uniqueIds.includes(drunkFakeRoleId)) {
        errors.push('Peran Townsfolk palsu untuk Drunk tidak boleh sama dengan Townsfolk yang sedang dimainkan pemain lain.');
      }
    }
  }

  return {
    isValid: errors.length === 0 && uniqueIds.length === playerCount,
    errors,
    counts: bagValidation.counts,
    required: bagValidation.required,
  };
}

function seededShuffle<T>(items: T[], seed?: number): T[] {
  const copy = [...items];
  if (seed === undefined) {
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const nextRand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getUnusedTownsfolkForDrunk(selectedRoleIds: string[]): RoleDefinition[] {
  const inPlaySet = new Set(selectedRoleIds);
  return ROLES.filter((r) => r.team === 'townsfolk' && !inPlaySet.has(r.id));
}

export function computeSafeDemonBluffs(
  inPlayRoleIds: string[],
  drunkFakeRoleId: string | null,
  seed?: number
): {
  recommendedBluffs: string[];
  allAvailableSafeGoodRoles: RoleDefinition[];
} {
  const excluded = new Set(inPlayRoleIds);
  if (drunkFakeRoleId) {
    excluded.add(drunkFakeRoleId);
  }

  // Primarily recommend unused Townsfolk as safe Demon bluffs per Trouble Brewing guide
  const unusedTownsfolk = ROLES.filter(
    (r) => r.team === 'townsfolk' && !excluded.has(r.id)
  );
  const unusedOutsiders = ROLES.filter(
    (r) => r.team === 'outsider' && r.id !== 'drunk' && !excluded.has(r.id)
  );

  const shuffledTownsfolk = seededShuffle(unusedTownsfolk, seed);
  const recommended = shuffledTownsfolk.slice(0, 3).map((r) => r.id);

  // Fallback if fewer than 3 unused Townsfolk (e.g., 15 players + Drunk uses 10 Townsfolk, still leaves 3 Townsfolk! 13 - 10 = 3, so always >= 3!)
  if (recommended.length < 3) {
    const extra = seededShuffle(unusedOutsiders, seed)
      .slice(0, 3 - recommended.length)
      .map((r) => r.id);
    recommended.push(...extra);
  }

  return {
    recommendedBluffs: recommended,
    allAvailableSafeGoodRoles: [...unusedTownsfolk, ...unusedOutsiders],
  };
}

export function autoSelectRoles(
  playerCount: number,
  options?: {
    forceDrunk?: boolean;
    forceBaron?: boolean;
    seed?: number;
  }
): {
  selectedRoleIds: string[];
  drunkFakeRoleId: string | null;
  demonBluffIds: string[];
} {
  const clamped = clampPlayerCount(playerCount);
  const base = getBaseCharacterCounts(clamped);
  const seed = options?.seed;

  const allMinions = ROLES.filter((r) => r.team === 'minion').map((r) => r.id);
  let chosenMinions: string[] = [];

  if (options?.forceBaron) {
    chosenMinions.push('baron');
    const restMinions = seededShuffle(
      allMinions.filter((id) => id !== 'baron'),
      seed
    );
    chosenMinions.push(...restMinions.slice(0, Math.max(0, base.minions - 1)));
  } else {
    // Avoid picking Baron randomly unless base.outsiders + 2 <= 4 and random hits it, or prefer Poisoner/Scarlet Woman/Spy for clean default
    const nonBaronMinions = seededShuffle(
      allMinions.filter((id) => id !== 'baron'),
      seed
    );
    chosenMinions = nonBaronMinions.slice(0, base.minions);
  }

  const effective = getEffectiveCharacterCounts(clamped, chosenMinions);

  const allOutsiders = ROLES.filter((r) => r.team === 'outsider').map((r) => r.id);
  let chosenOutsiders: string[] = [];
  if (effective.outsiders > 0) {
    if (options?.forceDrunk) {
      chosenOutsiders.push('drunk');
      const restOutsiders = seededShuffle(
        allOutsiders.filter((id) => id !== 'drunk'),
        seed !== undefined ? seed + 7 : undefined
      );
      chosenOutsiders.push(...restOutsiders.slice(0, effective.outsiders - 1));
    } else {
      chosenOutsiders = seededShuffle(
        allOutsiders,
        seed !== undefined ? seed + 7 : undefined
      ).slice(0, effective.outsiders);
    }
  }

  const allTownsfolk = ROLES.filter((r) => r.team === 'townsfolk').map((r) => r.id);
  const shuffledTownsfolk = seededShuffle(
    allTownsfolk,
    seed !== undefined ? seed + 13 : undefined
  );
  const chosenTownsfolk = shuffledTownsfolk.slice(0, effective.townsfolk);
  const remainingTownsfolk = shuffledTownsfolk.slice(effective.townsfolk);

  const selectedRoleIds = [
    ...chosenTownsfolk,
    ...chosenOutsiders,
    ...chosenMinions,
    'imp',
  ];

  let drunkFakeRoleId: string | null = null;
  if (chosenOutsiders.includes('drunk')) {
    drunkFakeRoleId = remainingTownsfolk[0] ?? null;
  }

  const { recommendedBluffs } = computeSafeDemonBluffs(
    selectedRoleIds,
    drunkFakeRoleId,
    seed !== undefined ? seed + 29 : undefined
  );

  return {
    selectedRoleIds,
    drunkFakeRoleId,
    demonBluffIds: recommendedBluffs,
  };
}

export function assignRolesToPlayers(
  playerNames: string[],
  selectedRoleIds: string[],
  drunkFakeRoleId: string | null,
  options?: { shuffleRoles?: boolean; seed?: number }
): PlayerSeat[] {
  const shouldShuffle = options?.shuffleRoles ?? true;
  const rolesOrdered = shouldShuffle
    ? seededShuffle(selectedRoleIds, options?.seed)
    : [...selectedRoleIds];

  // Pick a fallback unused Townsfolk if Drunk is in play and drunkFakeRoleId was somehow null
  let resolvedDrunkFake = drunkFakeRoleId;
  if (rolesOrdered.includes('drunk') && !resolvedDrunkFake) {
    const unused = getUnusedTownsfolkForDrunk(rolesOrdered);
    resolvedDrunkFake = unused[0]?.id ?? 'empath';
  }

  const seats: PlayerSeat[] = playerNames.map((rawName, idx) => {
    const trueRoleId = rolesOrdered[idx] ?? 'washerwoman';
    const isDrunk = trueRoleId === 'drunk';
    const perceivedRoleId = isDrunk && resolvedDrunkFake ? resolvedDrunkFake : trueRoleId;

    const reminders: PlacedReminder[] = [];
    if (isDrunk) {
      reminders.push({
        instanceId: `rem-drunk-init-${idx}`,
        reminderId: 'is_the_drunk',
      });
    }

    return {
      id: `seat-${idx + 1}`,
      seatIndex: idx,
      name: rawName.trim() || `Pemain ${idx + 1}`,
      trueRoleId,
      perceivedRoleId,
      isAlive: true,
      hasGhostVote: true,
      reminders,
    };
  });

  // If Fortune Teller is in play (or Drunk perceives Fortune Teller), automatically place Red Herring (decoy_ft) on 1 Good player
  const hasFortuneTeller = seats.some((s) => s.perceivedRoleId === 'fortune_teller');
  if (hasFortuneTeller) {
    const goodCandidates = seats.filter((s) => {
      const role = ROLE_MAP[s.trueRoleId];
      return role && (role.team === 'townsfolk' || role.team === 'outsider');
    });
    if (goodCandidates.length > 0) {
      // Prefer a good player other than the Fortune Teller first if available, else Fortune Teller themselves
      const nonFtGood = goodCandidates.filter((s) => s.perceivedRoleId !== 'fortune_teller');
      const pool = nonFtGood.length > 0 ? nonFtGood : goodCandidates;
      const chosenPool = seededShuffle(
        pool,
        options?.seed !== undefined ? options.seed + 41 : undefined
      );
      const target = chosenPool[0];
      target.reminders.push({
        instanceId: `rem-ft-decoy-init`,
        reminderId: 'decoy_ft',
      });
    }
  }

  return seats;
}

export function swapPlayerSeats(
  players: PlayerSeat[],
  fromSeatIndex: number,
  toSeatIndex: number
): PlayerSeat[] {
  if (
    fromSeatIndex === toSeatIndex ||
    fromSeatIndex < 0 ||
    toSeatIndex < 0 ||
    fromSeatIndex >= players.length ||
    toSeatIndex >= players.length
  ) {
    return players;
  }

  const updated = [...players];
  const temp = { ...updated[fromSeatIndex] };
  updated[fromSeatIndex] = { ...updated[toSeatIndex], seatIndex: fromSeatIndex };
  updated[toSeatIndex] = { ...temp, seatIndex: toSeatIndex };
  return updated;
}

export function movePlayerSeat(
  players: PlayerSeat[],
  seatIndex: number,
  direction: 'cw' | 'ccw'
): PlayerSeat[] {
  if (players.length < 2) return players;
  const targetIndex =
    direction === 'cw'
      ? (seatIndex + 1) % players.length
      : (seatIndex - 1 + players.length) % players.length;
  return swapPlayerSeats(players, seatIndex, targetIndex);
}

export function isPlayerEvil(player: PlayerSeat): boolean {
  const role = ROLE_MAP[player.trueRoleId];
  return role?.team === 'minion' || role?.team === 'demon';
}

export function isPlayerPoisoned(player: PlayerSeat): boolean {
  return player.reminders.some((r) => r.reminderId === 'poisoned');
}

export function getActiveReminderTokensForSeats(players: PlayerSeat[]): ReminderDefinition[] {
  const trueRoleSet = new Set(players.map((p) => p.trueRoleId));
  const perceivedRoleSet = new Set(players.map((p) => p.perceivedRoleId));
  const inPlaySet = new Set([...trueRoleSet, ...perceivedRoleSet]);

  return REMINDER_TOKENS.filter((rem) => {
    // Undertaker's executed reminder is relevant if Undertaker is in play
    if (rem.id === 'executed') {
      return inPlaySet.has('undertaker');
    }
    // Only include reminder token if the owning character is actually in the game
    return inPlaySet.has(rem.roleId);
  });
}

/**
 * Sanitizes player seats to eliminate duplicate tokens, enforce at most 1 Drunk,
 * and guarantee death causes match alive status. Prevents corrupt local storage or spam.
 */
export function sanitizePlayerSeats(players: PlayerSeat[]): PlayerSeat[] {
  if (!players || !Array.isArray(players)) return [];

  // Single-target reminder tokens that can only exist on 1 player globally in Trouble Brewing
  const singleTargetTokens = new Set(['poisoned', 'protected', 'die_imp', 'is_the_drunk']);
  const claimedSingleTokens = new Set<string>();

  // Ensure only 1 Drunk exists across all seats
  let drunkAssigned = false;

  return players.map((p, idx) => {
    let trueRoleId = p.trueRoleId;
    if (trueRoleId === 'drunk') {
      if (drunkAssigned) {
        trueRoleId = p.perceivedRoleId;
      } else {
        drunkAssigned = true;
      }
    }

    const uniqueReminders: PlacedReminder[] = [];
    const seatSeen = new Set<string>();

    for (const r of p.reminders || []) {
      if (!r || !r.reminderId) continue;

      // Deduplicate per seat: only 1 instance of any reminder token per player
      if (seatSeen.has(r.reminderId)) continue;

      // Single-target global uniqueness: only 1 player gets poisoned/protected/die_imp/is_the_drunk
      if (singleTargetTokens.has(r.reminderId)) {
        if (claimedSingleTokens.has(r.reminderId)) continue;
        claimedSingleTokens.add(r.reminderId);
      }

      seatSeen.add(r.reminderId);
      uniqueReminders.push(r);
    }

    return {
      ...p,
      seatIndex: idx,
      trueRoleId,
      deathCause: p.isAlive ? undefined : (p.deathCause ?? ('demon' as const)),
      reminders: uniqueReminders,
    };
  });
}

export function calculateChefNumber(players: PlayerSeat[]): {
  evilPairs: number;
  hasRecluseOrSpyNote: boolean;
} {
  const n = players.length;
  if (n < 2) return { evilPairs: 0, hasRecluseOrSpyNote: false };

  let pairs = 0;
  for (let i = 0; i < n; i++) {
    const current = players[i];
    const next = players[(i + 1) % n];
    // Avoid double-counting when n === 2
    if (n === 2 && i === 1) break;
    if (isPlayerEvil(current) && isPlayerEvil(next)) {
      pairs += 1;
    }
  }

  const hasRecluseOrSpyNote = players.some(
    (p) => p.trueRoleId === 'recluse' || p.trueRoleId === 'spy'
  );

  return { evilPairs: pairs, hasRecluseOrSpyNote };
}

export function calculateEmpathInfo(
  players: PlayerSeat[],
  empathSeatIndex: number
): {
  leftNeighbor: PlayerSeat | null;
  rightNeighbor: PlayerSeat | null;
  evilCount: number;
  hasMisregistrationNote: boolean;
} {
  const n = players.length;
  if (n < 2 || empathSeatIndex < 0 || empathSeatIndex >= n) {
    return {
      leftNeighbor: null,
      rightNeighbor: null,
      evilCount: 0,
      hasMisregistrationNote: false,
    };
  }

  // Search counter-clockwise (left around circle) for nearest alive player
  let ccwNeighbor: PlayerSeat | null = null;
  for (let step = 1; step < n; step++) {
    const candidate = players[(empathSeatIndex - step + n) % n];
    if (candidate.isAlive) {
      ccwNeighbor = candidate;
      break;
    }
  }

  // Search clockwise (right around circle) for nearest alive player
  let cwNeighbor: PlayerSeat | null = null;
  for (let step = 1; step < n; step++) {
    const candidate = players[(empathSeatIndex + step) % n];
    if (candidate.isAlive) {
      cwNeighbor = candidate;
      break;
    }
  }

  const uniqueNeighbors: PlayerSeat[] = [];
  if (ccwNeighbor) uniqueNeighbors.push(ccwNeighbor);
  if (cwNeighbor && cwNeighbor.id !== ccwNeighbor?.id) {
    uniqueNeighbors.push(cwNeighbor);
  }

  const evilCount = uniqueNeighbors.filter((p) => isPlayerEvil(p)).length;
  const hasMisregistrationNote = uniqueNeighbors.some(
    (p) => p.trueRoleId === 'recluse' || p.trueRoleId === 'spy'
  );

  return {
    leftNeighbor: ccwNeighbor,
    rightNeighbor: cwNeighbor,
    evilCount,
    hasMisregistrationNote,
  };
}

export function calculateVoteThreshold(players: PlayerSeat[]): {
  totalPlayers: number;
  aliveCount: number;
  deadCount: number;
  votesNeeded: number;
  ghostVotesRemaining: number;
} {
  const totalPlayers = players.length;
  const aliveCount = players.filter((p) => p.isAlive).length;
  const deadPlayers = players.filter((p) => !p.isAlive);
  const deadCount = deadPlayers.length;
  const votesNeeded = Math.max(1, Math.ceil(aliveCount / 2));
  const ghostVotesRemaining = deadPlayers.filter((p) => p.hasGhostVote).length;

  return {
    totalPlayers,
    aliveCount,
    deadCount,
    votesNeeded,
    ghostVotesRemaining,
  };
}

export function buildNightOrder(
  phase: 'first_night' | 'other_night',
  players: PlayerSeat[],
  executedTodayPlayerId: string | null,
  demonBluffIds: string[]
): NightOrderStep[] {
  const steps: NightOrderStep[] = [];

  steps.push({
    id: `${phase}-dusk`,
    order: 1,
    title: 'Senja (Dusk) - Semua Mata Tertutup',
    subtitle: 'Pembukaan Malam',
    roleId: null,
    playerId: null,
    playerName: null,
    seatNumber: null,
    isDrunkPlayer: false,
    isPoisonedPlayer: false,
    isConditional: false,
    instruction:
      'Ucapkan kepada seluruh pemain: "Malam telah tiba di Ravenswood Bluff. Semua pemain silakan tutup mata, tundukkan kepala, dan jangan bersuara." Pastikan seluruh mata benar-benar tertutup sebelum melanjutkan.',
  });

  if (phase === 'first_night') {
    const minions = players.filter((p) => ROLE_MAP[p.trueRoleId]?.team === 'minion');
    const demon = players.find((p) => ROLE_MAP[p.trueRoleId]?.team === 'demon') ?? null;
    const isSmallGame = players.length < 7;

    // Minion Info
    if (minions.length > 0 && demon) {
      const minionNames = minions
        .map((m) => `${m.name} (Kursi ${m.seatIndex + 1} - ${ROLE_MAP[m.trueRoleId]?.name})`)
        .join(', ');

      steps.push({
        id: 'first-minion-info',
        order: 5,
        title: 'Informasi Minion (Minion Info)',
        subtitle: minions.map((m) => m.name).join(', '),
        roleId: minions[0].trueRoleId,
        playerId: minions[0].id,
        playerName: minionNames,
        seatNumber: minions[0].seatIndex + 1,
        isDrunkPlayer: false,
        isPoisonedPlayer: false,
        isConditional: isSmallGame,
        instruction: `Bangunkan seluruh Minion (${minionNames}). Biarkan mereka saling bertatapan untuk mengenal rekan sesama Minion. Kemudian tunjuk pemain Demon yaitu ${demon.name} (Kursi ${demon.seatIndex + 1}) dan perlihatkan kartu "INI ADALAH DEMON ANDA". Tidurkan kembali seluruh Minion.`,
        storytellerWarning: isSmallGame
          ? 'Catatan Aturan 5-6 Pemain (Teensyville): Dalam aturan turnamen 5-6 pemain, Minion & Demon tidak saling mengenal di Malam 1. Namun Anda dapat tetap menjalankan langkah ini jika grup Anda bermain mode standar.'
          : undefined,
      });

      const bluffNames = demonBluffIds
        .map((id) => ROLE_MAP[id]?.name)
        .filter(Boolean)
        .join(', ');

      steps.push({
        id: 'first-demon-info',
        order: 10,
        title: 'Informasi Demon & 3 Bluff Aman (Demon Info)',
        subtitle: `${demon.name} (Imp)`,
        roleId: demon.trueRoleId,
        playerId: demon.id,
        playerName: demon.name,
        seatNumber: demon.seatIndex + 1,
        isDrunkPlayer: false,
        isPoisonedPlayer: false,
        isConditional: isSmallGame,
        instruction: `Bangunkan Demon yaitu ${demon.name} (Kursi ${demon.seatIndex + 1}). Tunjuk seluruh Minion (${minions.map((m) => `${m.name} di Kursi ${m.seatIndex + 1}`).join(', ')}) sebagai rekannya. Lalu perlihatkan 3 karakter Bluff Aman yang TIDAK ada di permainan: ${bluffNames || 'Lihat Panel Bluff'}. Tidurkan kembali Demon.`,
        dynamicHelperText: bluffNames
          ? `3 Bluff Aman Demon: ${bluffNames}`
          : undefined,
        storytellerWarning: isSmallGame
          ? 'Catatan 5-6 Pemain: Lewati langkah ini jika Anda memainkan mode Teensyville tanpa info tim Evil.'
          : undefined,
      });
    }
  }

  // Gather active roles in seat table based on perceivedRoleId (so Drunk wakes up as their fake Townsfolk!)
  // Wait: what if a player is dead? Dead players do NOT wake up, EXCEPT Ravenkeeper on the night they die, and Spy does not see Grimoire if dead.
  // Also Scarlet Woman wakes if she became the Imp or check condition.
  interface CandidateWake {
    order: number;
    player: PlayerSeat;
    actingRole: RoleDefinition;
  }

  const candidateWakes: CandidateWake[] = [];

  for (const player of players) {
    const actingRole = ROLE_MAP[player.perceivedRoleId];
    if (!actingRole) continue;

    const orderNum =
      phase === 'first_night' ? actingRole.firstNightOrder : actingRole.otherNightOrder;
    if (orderNum === null) continue;

    // Alive check: dead players don't wake except Ravenkeeper (who wakes right after dying tonight)
    const diedTonightByImp = player.reminders.some((r) => r.reminderId === 'die_imp');
    if (!player.isAlive && actingRole.id !== 'ravenkeeper') {
      continue;
    }
    if (actingRole.id === 'ravenkeeper' && !diedTonightByImp && player.isAlive) {
      // Still include Ravenkeeper as conditional step so Storyteller remembers if Imp kills them right before!
    }

    candidateWakes.push({
      order: orderNum,
      player,
      actingRole,
    });
  }

  candidateWakes.sort((a, b) => a.order - b.order || a.player.seatIndex - b.player.seatIndex);

  for (const item of candidateWakes) {
    const { player, actingRole, order } = item;
    const isDrunk = player.trueRoleId === 'drunk';
    const isPoisoned = isPlayerPoisoned(player);
    const baseInstruction =
      phase === 'first_night'
        ? actingRole.firstNightInstruction ?? actingRole.ability
        : actingRole.otherNightInstruction ?? actingRole.ability;

    let dynamicHelperText: string | undefined;
    let storytellerWarning: string | undefined;

    if (isDrunk) {
      storytellerWarning = `PERINGATAN DRUNK: ${player.name} SEBENARNYA ADALAH THE DRUNK (hanya mengira dirinya ${actingRole.name}). Tetap bangunkan seperti biasa, namun kemampuannya TIDAK berefek dan Anda bebas memberikan informasi palsu yang masuk akal!`;
    } else if (isPoisoned) {
      storytellerWarning = `PERINGATAN POISONED: ${player.name} sedang terkena racun (Poisoned)! Kemampuannya tidak bekerja malam ini—berikan informasi palsu/acak atau abaikan efek perlindungannya.`;
    }

    // Contextual helper calculations
    if (actingRole.id === 'chef') {
      const chefCalc = calculateChefNumber(players);
      dynamicHelperText = `Hitung Otomatis Chef: Terdapat ${chefCalc.evilPairs} pasang pemain Evil duduk bersebelahan.${
        chefCalc.hasRecluseOrSpyNote
          ? ' (Catatan: Ada Recluse/Spy di permainan yang boleh mengubah angka ini).'
          : ''
      }`;
    } else if (actingRole.id === 'empath') {
      const empCalc = calculateEmpathInfo(players, player.seatIndex);
      const leftLabel = empCalc.leftNeighbor
        ? `${empCalc.leftNeighbor.name} (Kursi ${empCalc.leftNeighbor.seatIndex + 1})`
        : '-';
      const rightLabel = empCalc.rightNeighbor
        ? `${empCalc.rightNeighbor.name} (Kursi ${empCalc.rightNeighbor.seatIndex + 1})`
        : '-';
      dynamicHelperText = `Tetangga Hidup Terdekat: ${leftLabel} & ${rightLabel} -> Jumlah Evil Asli: ${empCalc.evilCount} jari.${
        empCalc.hasMisregistrationNote ? ' (Ada Recluse/Spy di tetangga).' : ''
      }`;
    } else if (actingRole.id === 'undertaker') {
      const executedPlayer = executedTodayPlayerId
        ? players.find((p) => p.id === executedTodayPlayerId)
        : players.find((p) => p.reminders.some((r) => r.reminderId === 'executed'));
      if (executedPlayer) {
        const execTrueRole = ROLE_MAP[executedPlayer.trueRoleId];
        dynamicHelperText = `Dieksekusi Siang Tadi: ${executedPlayer.name} — Peran Asli: ${execTrueRole?.name ?? executedPlayer.trueRoleId}.`;
      } else {
        dynamicHelperText =
          'Belum ada pemain berlabel Dieksekusi siang tadi. Jangan bangunkan Undertaker jika tidak ada eksekusi.';
      }
    } else if (actingRole.id === 'fortune_teller') {
      const redHerring = players.find((p) =>
        p.reminders.some((r) => r.reminderId === 'decoy_ft')
      );
      const currentDemon = players.find((p) => ROLE_MAP[p.trueRoleId]?.team === 'demon');
      dynamicHelperText = `Pemicu Anggukan "YA": Demon (${currentDemon ? `${currentDemon.name}` : '-'}) ATAU Red Herring (${
        redHerring ? `${redHerring.name} di Kursi ${redHerring.seatIndex + 1}` : 'Belum dipasang'
      }).`;
    } else if (actingRole.id === 'librarian') {
      const outsidersInPlay = players.filter(
        (p) => ROLE_MAP[p.trueRoleId]?.team === 'outsider'
      );
      if (outsidersInPlay.length === 0) {
        dynamicHelperText =
          'Hitung Otomatis: 0 Outsider dalam permainan (kecuali Anda ingin memakai Spy untuk terbaca sebagai Outsider). Tunjukkan angka 0.';
      } else {
        dynamicHelperText = `Outsider di Permainan: ${outsidersInPlay
          .map((o) => `${o.name} (${ROLE_MAP[o.trueRoleId]?.name})`)
          .join(', ')}.`;
      }
    } else if (actingRole.id === 'investigator') {
      const minionsInPlay = players.filter(
        (p) => ROLE_MAP[p.trueRoleId]?.team === 'minion'
      );
      dynamicHelperText = `Minion di Permainan: ${
        minionsInPlay.map((m) => `${m.name} (${ROLE_MAP[m.trueRoleId]?.name})`).join(', ') || '-'
      }.`;
    }

    const isConditional =
      actingRole.id === 'ravenkeeper' ||
      actingRole.id === 'undertaker' ||
      actingRole.id === 'scarlet_woman';

    steps.push({
      id: `${phase}-${player.id}-${actingRole.id}`,
      order,
      title: `${actingRole.name} (${actingRole.indonesianName})`,
      subtitle: `${player.name} · Kursi ${player.seatIndex + 1}${isDrunk ? ' [ASLI: DRUNK]' : ''}`,
      roleId: actingRole.id,
      playerId: player.id,
      playerName: player.name,
      seatNumber: player.seatIndex + 1,
      isDrunkPlayer: isDrunk,
      isPoisonedPlayer: isPoisoned,
      isConditional,
      instruction: baseInstruction,
      dynamicHelperText,
      storytellerWarning,
    });
  }

  const nightVictimPlayers = players.filter((p) =>
    p.reminders.some((r) => r.reminderId === 'die_imp')
  );

  steps.push({
    id: `${phase}-dawn`,
    order: 999,
    title: 'Fajar Menyingsing (Dawn) - Buka Mata',
    subtitle: 'Transisi ke Siang Hari',
    roleId: null,
    playerId: null,
    playerName: null,
    seatNumber: null,
    isDrunkPlayer: false,
    isPoisonedPlayer: false,
    isConditional: false,
    instruction:
      phase === 'first_night'
        ? 'Tunggu sekitar 5-10 detik agar tidak ada petunjuk suara, lalu ucapkan: "Pagi telah tiba di Ravenswood Bluff! Semua pemain silakan buka mata. Tidak ada korban jiwa malam tadi. Diskusi Siang Hari Pertama dimulai!"'
        : `Tunggu sekitar 5-10 detik, lalu minta semua pemain membuka mata. Umumkan segera siapa yang ditemukan tewas malam ini (${
            nightVictimPlayers.length > 0
              ? nightVictimPlayers.map((v) => v.name).join(', ')
              : 'Tidak ada yang mati malam ini'
          }), tanpa menyebutkan penyebab kematiannya!`,
    dynamicHelperText:
      phase === 'other_night' && nightVictimPlayers.length > 0
        ? `Target berlabel Mati (Die) malam ini: ${nightVictimPlayers
            .map((v) => `${v.name} (Kursi ${v.seatIndex + 1})`)
            .join(', ')}. Klik "Lanjut ke Siang Hari" untuk otomatis mengubah status mereka menjadi Mati.`
        : undefined,
  });

  return steps;
}

export function createDemoSession(playerCount = 8): {
  playerCount: number;
  selectedRoleIds: string[];
  drunkFakeRoleId: string | null;
  demonBluffIds: string[];
  players: PlayerSeat[];
} {
  // Deterministic 8-player Trouble Brewing showcase session including Drunk!
  // 8 players = 5 Townsfolk, 1 Outsider (Drunk!), 1 Minion (Poisoner), 1 Demon (Imp)
  if (playerCount === 8) {
    const selectedRoleIds = [
      'washerwoman',
      'chef',
      'empath',
      'fortune_teller',
      'monk',
      'drunk',
      'poisoner',
      'imp',
    ];
    const drunkFakeRoleId = 'investigator';
    const demonBluffIds = ['librarian', 'slayer', 'mayor'];
    const names = DEFAULT_INDONESIAN_NAMES.slice(0, 8);
    const players = assignRolesToPlayers(names, selectedRoleIds, drunkFakeRoleId, {
      shuffleRoles: true,
      seed: 108,
    });
    return {
      playerCount: 8,
      selectedRoleIds,
      drunkFakeRoleId,
      demonBluffIds,
      players,
    };
  }

  const auto = autoSelectRoles(playerCount, { forceDrunk: playerCount >= 6, seed: 42 });
  const names = DEFAULT_INDONESIAN_NAMES.slice(0, clampPlayerCount(playerCount));
  const players = assignRolesToPlayers(
    names,
    auto.selectedRoleIds,
    auto.drunkFakeRoleId,
    { shuffleRoles: true, seed: 42 }
  );

  return {
    playerCount: clampPlayerCount(playerCount),
    selectedRoleIds: auto.selectedRoleIds,
    drunkFakeRoleId: auto.drunkFakeRoleId,
    demonBluffIds: auto.demonBluffIds,
    players,
  };
}
