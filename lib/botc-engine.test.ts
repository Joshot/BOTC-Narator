import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assignRolesToPlayers,
  autoSelectRoles,
  buildNightOrder,
  calculateChefNumber,
  calculateEmpathInfo,
  calculateVoteThreshold,
  computeSafeDemonBluffs,
  getActiveReminderTokensForSeats,
  getBaseCharacterCounts,
  getEffectiveCharacterCounts,
  swapPlayerSeats,
  validateRoleSelection,
  validateRoleBag,
  sanitizePlayerSeats,
  type PlayerSeat,
} from './botc-engine.ts';

test('official Trouble Brewing character counts match 5 to 15 players table', () => {
  const expected: Record<number, [number, number, number, number]> = {
    5: [3, 0, 1, 1],
    6: [3, 1, 1, 1],
    7: [5, 0, 1, 1],
    8: [5, 1, 1, 1],
    9: [5, 2, 1, 1],
    10: [7, 0, 2, 1],
    11: [7, 1, 2, 1],
    12: [7, 2, 2, 1],
    13: [9, 0, 3, 1],
    14: [9, 1, 3, 1],
    15: [9, 2, 3, 1],
  };

  for (let count = 5; count <= 15; count++) {
    const row = getBaseCharacterCounts(count);
    const [t, o, m, d] = expected[count];
    assert.equal(row.townsfolk, t, `Townsfolk mismatch for ${count} players`);
    assert.equal(row.outsiders, o, `Outsiders mismatch for ${count} players`);
    assert.equal(row.minions, m, `Minions mismatch for ${count} players`);
    assert.equal(row.demons, d, `Demons mismatch for ${count} players`);
    assert.equal(row.townsfolk + row.outsiders + row.minions + row.demons, count);
  }
});

test('Baron modifier adds 2 Outsiders and subtracts 2 Townsfolk while keeping total equal', () => {
  const eff7 = getEffectiveCharacterCounts(7, ['baron', 'imp']);
  assert.equal(eff7.hasBaronModifier, true);
  assert.equal(eff7.townsfolk, 3);
  assert.equal(eff7.outsiders, 2);
  assert.equal(eff7.minions, 1);
  assert.equal(eff7.demons, 1);
});

test('Drunk management assigns unused Townsfolk perceived role, attaches Is the Drunk reminder, and excludes fake role from Demon bluffs', () => {
  const auto = autoSelectRoles(8, { forceDrunk: true, seed: 99 });
  assert.ok(auto.selectedRoleIds.includes('drunk'));
  assert.ok(auto.drunkFakeRoleId, 'Drunk must have a fake Townsfolk role');
  assert.equal(
    auto.selectedRoleIds.includes(auto.drunkFakeRoleId!),
    false,
    'Drunk fake role must not collide with real in-play Townsfolk'
  );

  const bluffs = computeSafeDemonBluffs(auto.selectedRoleIds, auto.drunkFakeRoleId, 99);
  assert.equal(bluffs.recommendedBluffs.length, 3);
  for (const bluffId of bluffs.recommendedBluffs) {
    assert.equal(auto.selectedRoleIds.includes(bluffId), false);
    assert.notEqual(bluffId, auto.drunkFakeRoleId);
  }

  const validation = validateRoleSelection(8, auto.selectedRoleIds, auto.drunkFakeRoleId);
  assert.equal(validation.isValid, true);

  const seats = assignRolesToPlayers(
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    auto.selectedRoleIds,
    auto.drunkFakeRoleId,
    { shuffleRoles: false }
  );

  const drunkSeat = seats.find((s) => s.trueRoleId === 'drunk');
  assert.ok(drunkSeat);
  assert.equal(drunkSeat!.perceivedRoleId, auto.drunkFakeRoleId);
  assert.equal(
    drunkSeat!.reminders.some((r) => r.reminderId === 'is_the_drunk'),
    true,
    'Drunk seat must carry Is the Drunk reminder automatically'
  );
});

test('Chef and Empath calculations handle circular adjacency and skip dead neighbors', () => {
  const roles = ['poisoner', 'imp', 'empath', 'washerwoman', 'chef', 'saint', 'monk', 'soldier'];
  const seats = assignRolesToPlayers(
    ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'],
    roles,
    null,
    { shuffleRoles: false }
  );

  // P1 (Poisoner) and P2 (Imp) sit next to each other -> 1 evil pair
  const chefInfo = calculateChefNumber(seats);
  assert.equal(chefInfo.evilPairs, 1);

  // Empath at seatIndex 2 (P3): neighbors are P2 (Imp, alive) and P4 (Washerwoman, alive) -> 1 evil
  const empath1 = calculateEmpathInfo(seats, 2);
  assert.equal(empath1.evilCount, 1);

  // If P2 dies, Empath's left alive neighbor becomes P1 (Poisoner, alive) -> still 1 evil!
  seats[1].isAlive = false;
  const empath2 = calculateEmpathInfo(seats, 2);
  assert.equal(empath2.leftNeighbor?.name, 'P1');
  assert.equal(empath2.evilCount, 1);

  // Swap P1 (seat 0) and P4 (seat 3)
  const swapped = swapPlayerSeats(seats, 0, 3);
  assert.equal(swapped[0].name, 'P4');
  assert.equal(swapped[3].name, 'P1');
  assert.equal(swapped[3].seatIndex, 3);
});

test('Night Order wakes Drunk under their perceived Townsfolk slot with Storyteller warning and computes vote thresholds', () => {
  const roles = ['washerwoman', 'chef', 'empath', 'monk', 'soldier', 'drunk', 'poisoner', 'imp'];
  const seats = assignRolesToPlayers(
    ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
    roles,
    'investigator',
    { shuffleRoles: false }
  );

  const firstNight = buildNightOrder('first_night', seats, null, ['librarian', 'slayer', 'mayor']);
  // Expected order includes Dusk -> Minion Info -> Demon Info -> Poisoner -> Washerwoman -> Investigator (Drunk!) -> Chef -> Empath -> Dawn
  const roleSteps = firstNight.filter((s) => s.roleId !== null).map((s) => s.id);
  const invStep = firstNight.find((s) => s.roleId === 'investigator');
  assert.ok(invStep, 'Drunk perceiving Investigator must appear in First Night order');
  assert.equal(invStep!.isDrunkPlayer, true);
  assert.ok(invStep!.storytellerWarning?.includes('DRUNK'));
  assert.ok(roleSteps.length >= 6);

  // Vote threshold check: 8 alive -> 4 votes; 7 alive -> 4 votes
  assert.equal(calculateVoteThreshold(seats).votesNeeded, 4);
  seats[0].isAlive = false;
  assert.equal(calculateVoteThreshold(seats).votesNeeded, 4);
  seats[1].isAlive = false;
  assert.equal(calculateVoteThreshold(seats).votesNeeded, 3);
});

test('validateRoleBag validates step 1 bag and rejects more than 1 Drunk', () => {
  // 6 players: 3 Townsfolk, 1 Outsider, 1 Minion, 1 Demon
  const bagWithDrunk = ['washerwoman', 'chef', 'empath', 'drunk', 'poisoner', 'imp'];
  const res = validateRoleBag(6, bagWithDrunk);
  assert.equal(res.isValid, true);
  assert.equal(res.errors.length, 0);

  // Incomplete bag (missing 1 Townsfolk)
  const invalidBag = ['washerwoman', 'chef', 'drunk', 'poisoner', 'imp'];
  const resInvalid = validateRoleBag(6, invalidBag);
  assert.equal(resInvalid.isValid, false);
  assert.ok(resInvalid.errors.length > 0);
});

test('getActiveReminderTokensForSeats dynamically filters tokens based on in-play characters', () => {
  // Case 1: Game with Spy and Imp, but NO Poisoner and NO Drunk
  const seatsWithoutPoisoner = assignRolesToPlayers(
    ['P1', 'P2', 'P3', 'P4', 'P5'],
    ['washerwoman', 'chef', 'empath', 'spy', 'imp'],
    null,
    { shuffleRoles: false }
  );

  const tokensNoPoisoner = getActiveReminderTokensForSeats(seatsWithoutPoisoner);
  const tokenIdsNoPoisoner = tokensNoPoisoner.map((t) => t.id);

  assert.equal(tokenIdsNoPoisoner.includes('poisoned'), false, 'Poisoned token must not exist without Poisoner in play');
  assert.equal(tokenIdsNoPoisoner.includes('is_the_drunk'), false, 'Is the Drunk token must not exist without Drunk in play');
  assert.ok(tokenIdsNoPoisoner.includes('die_imp'), 'Imp die reminder should exist since Imp is in play');

  // Case 2: Game WITH Poisoner and Drunk
  const seatsWithPoisonerAndDrunk = assignRolesToPlayers(
    ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    ['washerwoman', 'chef', 'empath', 'drunk', 'poisoner', 'imp'],
    'investigator',
    { shuffleRoles: false }
  );

  const tokensWithBoth = getActiveReminderTokensForSeats(seatsWithPoisonerAndDrunk);
  const tokenIdsWithBoth = tokensWithBoth.map((t) => t.id);

  assert.equal(tokenIdsWithBoth.includes('poisoned'), true, 'Poisoned token must exist when Poisoner is in play');
  assert.equal(tokenIdsWithBoth.includes('is_the_drunk'), true, 'Is the Drunk token must exist when Drunk is in play');
});

test('sanitizePlayerSeats removes duplicate tokens and limits single-target tokens to 1 seat', () => {
  const dirtySeats = [
    {
      id: 'p1',
      seatIndex: 0,
      name: 'Player 1',
      trueRoleId: 'drunk',
      perceivedRoleId: 'chef',
      isAlive: true,
      hasGhostVote: true,
      reminders: [
        { instanceId: 'r1', reminderId: 'poisoned' },
        { instanceId: 'r2', reminderId: 'poisoned' }, // duplicate!
        { instanceId: 'r3', reminderId: 'is_the_drunk' },
      ],
    },
    {
      id: 'p2',
      seatIndex: 1,
      name: 'Player 2',
      trueRoleId: 'drunk', // illegal second Drunk!
      perceivedRoleId: 'investigator',
      isAlive: false,
      hasGhostVote: true,
      reminders: [
        { instanceId: 'r4', reminderId: 'poisoned' }, // second poisoned!
        { instanceId: 'r5', reminderId: 'die_imp' },
      ],
    },
  ];

  const cleaned = sanitizePlayerSeats(dirtySeats);

  // Player 1 should only have 1 poisoned token
  assert.equal(cleaned[0].reminders.filter((r) => r.reminderId === 'poisoned').length, 1);
  assert.equal(cleaned[0].trueRoleId, 'drunk');

  // Player 2 should NOT be Drunk (reverted to perceived role), and should NOT have poisoned (already claimed by p1)
  assert.equal(cleaned[1].trueRoleId, 'investigator');
  assert.equal(cleaned[1].reminders.filter((r) => r.reminderId === 'poisoned').length, 0);
  assert.equal(cleaned[1].reminders.filter((r) => r.reminderId === 'die_imp').length, 1);
  assert.equal(cleaned[1].deathCause, 'demon');
});

test('physical Drunk bag representation (+1 Townsfolk chosen at start) validates successfully', () => {
  // 8 players with Drunk active: 6 Townsfolk, 0 Outsiders, 1 Minion, 1 Imp
  const selectedRoles = [
    'washerwoman',
    'librarian',
    'investigator',
    'chef',
    'empath',
    'mayor',
    'poisoner',
    'imp',
  ];
  // Drunk fake role is one of the chosen Townsfolk (e.g. mayor)
  const validation = validateRoleSelection(8, selectedRoles, 'mayor', true);
  assert.equal(validation.isValid, true);
  assert.equal(validation.errors.length, 0);
  assert.equal(validation.counts.townsfolk, 6);
  assert.equal(validation.counts.outsiders, 0);
});

test('multiple players can be dead by execution and executed reminder tokens are purged', () => {
  const seats: PlayerSeat[] = [
    {
      id: 'p1',
      seatIndex: 0,
      name: 'Player 1',
      trueRoleId: 'chef',
      perceivedRoleId: 'chef',
      isAlive: false,
      deathCause: 'execution',
      hasGhostVote: true,
      reminders: [{ instanceId: 'r-exec-1', reminderId: 'executed' }],
    },
    {
      id: 'p2',
      seatIndex: 1,
      name: 'Player 2',
      trueRoleId: 'empath',
      perceivedRoleId: 'empath',
      isAlive: false,
      deathCause: 'execution',
      hasGhostVote: true,
      reminders: [{ instanceId: 'r-exec-2', reminderId: 'executed' }],
    },
    {
      id: 'p3',
      seatIndex: 2,
      name: 'Player 3',
      trueRoleId: 'imp',
      perceivedRoleId: 'imp',
      isAlive: false,
      deathCause: 'demon',
      hasGhostVote: true,
      reminders: [],
    },
  ];

  const sanitized = sanitizePlayerSeats(seats);
  // Both p1 and p2 remain dead with deathCause = 'execution'
  assert.equal(sanitized[0].isAlive, false);
  assert.equal(sanitized[0].deathCause, 'execution');
  assert.equal(sanitized[1].isAlive, false);
  assert.equal(sanitized[1].deathCause, 'execution');
  assert.equal(sanitized[2].isAlive, false);
  assert.equal(sanitized[2].deathCause, 'demon');

  // Any 'executed' reminder tokens must be completely purged
  assert.equal(sanitized[0].reminders.some((r) => r.reminderId === 'executed'), false);
  assert.equal(sanitized[1].reminders.some((r) => r.reminderId === 'executed'), false);
});

