import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_TB_ROLES,
  ROLES,
  TB_TRAVELLERS,
  calculateBalancedBag,
  getCustomNoteText,
  noteInitials,
} from './botc-data.ts';
import {
  addPlayerSeat,
  calculateNominationThresholds,
  canSeatNominate,
  getActiveReminderTokensForSeats,
  getPlayerAlignment,
  removePlayerSeat,
  rotatePlayerSeats,
} from './botc-engine.ts';
import type { DayNomination, PlayerSeat } from './botc-engine.ts';
import {
  applyDayNominationMark,
  computeTimerRemainingMs,
  countAliveNonTravellers,
  evaluateBoardWinner,
  formatTimerClock,
  getSeatVoteWeight,
  resolveVoteTieStatus,
} from './botc-engine.ts';
import {
  fitRing,
  placeSeatMenu,
  reminderStack,
  voteArc,
} from './ring-geometry.ts';
import {
  createBagPile,
  createSpreadLayout,
  stirBagPile,
} from './bag-physics.ts';
import {
  createEmptyHistory,
  pushHistorySnapshot,
  stepHistoryRedo,
  stepHistoryUndo,
} from './history-stack.ts';

function sampleSeats(count = 7): PlayerSeat[] {
  const rolePool = ['washerwoman', 'librarian', 'chef', 'empath', 'saint', 'poisoner', 'imp'];
  return Array.from({ length: count }, (_, idx) => ({
    id: `seat-${idx + 1}`,
    seatIndex: idx,
    name: `Pemain ${idx + 1}`,
    trueRoleId: rolePool[idx % rolePool.length],
    perceivedRoleId: rolePool[idx % rolePool.length],
    isAlive: true,
    hasGhostVote: true,
    reminders: [],
  }));
}

test('Trouble Brewing script contains all 22 core roles and 5 TB Travellers', () => {
  assert.equal(ROLES.length, 22);
  assert.equal(TB_TRAVELLERS.length, 5);
  assert.equal(ALL_TB_ROLES.length, 27);
  assert.equal(ROLES.filter((r) => r.team === 'demon').length, 1);
  assert.equal(ROLES.find((r) => r.id === 'demon_none'), undefined);
});

test('addPlayerSeat, removePlayerSeat, and rotatePlayerSeats keep sequential seatIndex', () => {
  const initial = sampleSeats(6);
  const added = addPlayerSeat(initial, 2, 'Bureaucrat Baru', 'bureaucrat');
  assert.equal(added.length, 7);
  assert.equal(added[2].name, 'Bureaucrat Baru');
  assert.equal(added[2].trueRoleId, 'bureaucrat');
  assert.deepEqual(
    added.map((s) => s.seatIndex),
    [0, 1, 2, 3, 4, 5, 6]
  );

  const rotatedCw = rotatePlayerSeats(added, 'cw');
  assert.equal(rotatedCw[0].id, added[added.length - 1].id);
  assert.equal(rotatedCw[0].seatIndex, 0);

  const removed = removePlayerSeat(rotatedCw, rotatedCw[0].id);
  assert.equal(removed.length, 6);
  assert.deepEqual(
    removed.map((s) => s.seatIndex),
    [0, 1, 2, 3, 4, 5]
  );
});

test('getPlayerAlignment respects manual override for Travellers/Spy/Recluse', () => {
  const seat = sampleSeats(5)[0];
  assert.equal(getPlayerAlignment(seat), 'good');
  const evilOverride: PlayerSeat = { ...seat, alignment: 'evil' };
  assert.equal(getPlayerAlignment(evilOverride), 'evil');

  const demonSeat = sampleSeats(7)[6];
  assert.equal(getPlayerAlignment(demonSeat), 'evil');
});

test('nominations enforce once-per-day rules and calculate tie / execution threshold', () => {
  const seats = sampleSeats(7);
  const noms: DayNomination[] = [
    {
      id: 'nom-1',
      dayNumber: 1,
      nominatorId: seats[0].id,
      nomineeId: seats[6].id,
      voterIds: [seats[0].id, seats[1].id, seats[2].id, seats[3].id],
      voteTotal: 4,
      markedForExecution: true,
    },
  ];

  // Seat 0 already nominated today, seat 6 already nominated today
  assert.equal(canSeatNominate(noms, seats[0].id, seats[5].id, seats), false);
  assert.equal(canSeatNominate(noms, seats[1].id, seats[6].id, seats), false);
  assert.equal(canSeatNominate(noms, seats[1].id, seats[5].id, seats), true);

  const threshold = calculateNominationThresholds(seats, noms);
  assert.equal(threshold.highestVotes, 4);
  assert.equal(threshold.execute, 5);
  assert.equal(threshold.tie, 4);
  assert.equal(threshold.onBlockSeatId, seats[6].id);
});

test('custom note initials and died_today Undertaker reminder helpers', () => {
  assert.equal(noteInitials('Cek Chef 1'), 'CC1');
  assert.equal(noteInitials('Klaim'), 'KLA');
  assert.equal(getCustomNoteText('note:Klaim Empath 0'), 'Klaim Empath 0');

  const seats = sampleSeats(7);
  seats[2] = { ...seats[2], trueRoleId: 'undertaker', perceivedRoleId: 'undertaker' };
  const activeTokens = getActiveReminderTokensForSeats(seats);
  assert.ok(activeTokens.some((t) => t.id === 'died_today'));
});

test('calculateBalancedBag builds exact Trouble Brewing player counts with balanced Townsfolk', () => {
  for (const count of [5, 7, 10, 13, 15]) {
    const res = calculateBalancedBag(count);
    assert.equal(res.selectedRoleIds.length, count);
    assert.ok(res.selectedRoleIds.includes('imp'));
    assert.ok(res.formulaDetails.length >= 4);
  }
});

test('ring-geometry fits non-overlapping seats, inward stacks, menu placement, and voting arc', () => {
  const ring = fitRing({ width: 760, height: 520 }, 12);
  assert.equal(ring.positions.length, 12);
  assert.ok(ring.size >= 42 && ring.size <= 112);

  const stack = reminderStack(ring.size, ring.positions[0].angle, 3, false);
  assert.equal(stack.points.length, 3);

  const menuPos = placeSeatMenu({
    at: ring.positions[0],
    size: ring.size,
    centre: { x: 380, y: 260 },
    room: { left: 8, top: 8, right: 752, bottom: 512 },
    others: ring.positions.slice(1),
    menu: { width: 260, height: 340 },
  });
  assert.ok(menuPos.left >= 8 && menuPos.top >= 8);

  const arc = voteArc(ring.band, ring.rx, ring.ry, ring.size, 12, ring.positions[0], ring.positions[5]);
  assert.ok(arc && arc.lit > 0.25 && arc.lit < 0.75);
});

test('bag-physics initializes pile within bounds, stirs smoothly, and creates spread layout', () => {
  const bounds = { cx: 280, cy: 190, rx: 220, ry: 150, tokenSize: 76 };
  const pile = createBagPile(10, bounds);
  assert.equal(pile.length, 10);

  const stirred = stirBagPile(pile, bounds, 280, 190, 24, -12, pile[0].id);
  assert.equal(stirred.length, 10);
  for (const body of stirred) {
    assert.ok(Number.isFinite(body.x) && Number.isFinite(body.y));
  }

  const spread = createSpreadLayout(10, 560, 380);
  assert.equal(spread.length, 10);
  assert.ok(spread[0].size >= 52);
});

test('history-stack supports multi-step undo, redo, depth limit, and redo invalidation', () => {
  let stack = createEmptyHistory<string>();
  stack = pushHistorySnapshot(stack, 'step-0');
  stack = pushHistorySnapshot(stack, 'step-1');

  const u1 = stepHistoryUndo(stack, 'step-2');
  assert.equal(u1.restored, 'step-1');
  assert.deepEqual(u1.nextStack.undo, ['step-0']);
  assert.deepEqual(u1.nextStack.redo, ['step-2']);

  const u2 = stepHistoryUndo(u1.nextStack, 'step-1');
  assert.equal(u2.restored, 'step-0');
  assert.deepEqual(u2.nextStack.undo, []);
  assert.deepEqual(u2.nextStack.redo, ['step-2', 'step-1']);

  const r1 = stepHistoryRedo(u2.nextStack, 'step-0');
  assert.equal(r1.restored, 'step-1');
  assert.deepEqual(r1.nextStack.undo, ['step-0']);
  assert.deepEqual(r1.nextStack.redo, ['step-2']);

  // New mutation invalidates remaining redo branch
  const branched = pushHistorySnapshot(r1.nextStack, 'step-1-branch');
  assert.deepEqual(branched.redo, []);
  assert.deepEqual(branched.undo, ['step-0', 'step-1-branch']);
});

test('evaluateBoardWinner excludes Travellers from 2-alive Evil win threshold', () => {
  const base = sampleSeats(5);
  base[4] = { ...base[4], trueRoleId: 'imp', perceivedRoleId: 'imp', alignment: 'evil' };
  base[3] = { ...base[3], trueRoleId: 'scapegoat', perceivedRoleId: 'scapegoat', alignment: 'good' };
  // Kill 2 Townsfolk -> remaining alive: seat 2 (good), seat 3 (Traveller), seat 4 (Imp)
  // Non-travellers alive = 2 (seat 2 + Imp), total alive = 3 -> Evil MUST win!
  base[0] = { ...base[0], isAlive: false };
  base[1] = { ...base[1], isAlive: false };

  assert.equal(countAliveNonTravellers(base), 2);
  assert.equal(evaluateBoardWinner(base), 'evil');

  // If Demon dies, Good wins immediately even if Evil Minion alive
  base[4] = { ...base[4], isAlive: false };
  assert.equal(evaluateBoardWinner(base), 'good');
});

test('getSeatVoteWeight handles Bureaucrat (+3), Thief (-1), and normal (+1)', () => {
  const seats = sampleSeats(3);
  seats[0] = {
    ...seats[0],
    reminders: [{ instanceId: 'r1', reminderId: 'bureaucrat_3x' }],
  };
  seats[1] = {
    ...seats[1],
    reminders: [{ instanceId: 'r2', reminderId: 'thief_neg' }],
  };
  assert.equal(getSeatVoteWeight(seats[0]), 3);
  assert.equal(getSeatVoteWeight(seats[1]), -1);
  assert.equal(getSeatVoteWeight(seats[2]), 1);
  assert.equal(getSeatVoteWeight(undefined), 1);
});

test('resolveVoteTieStatus & applyDayNominationMark auto-clear tied blocks at majority threshold', () => {
  const seats = sampleSeats(6); // threshold = ceil(6 / 2) = 3
  const noms: DayNomination[] = [
    {
      id: 'n1',
      dayNumber: 1,
      nominatorId: seats[0].id,
      nomineeId: seats[2].id,
      voterIds: [seats[0].id, seats[1].id, seats[2].id],
      voteTotal: 3,
      markedForExecution: false,
    },
    {
      id: 'n2',
      dayNumber: 1,
      nominatorId: seats[1].id,
      nomineeId: seats[3].id,
      voterIds: [seats[0].id, seats[1].id],
      voteTotal: 2,
      markedForExecution: false,
    },
  ];

  // Marking unique leader n1 succeeds
  const markLead = applyDayNominationMark(noms, 'n1', true, seats);
  assert.equal(markLead.isTieCleared, false);
  assert.equal(markLead.nominations[0].markedForExecution, true);
  assert.equal(resolveVoteTieStatus(markLead.nominations, seats).isTie, false);
  assert.equal(resolveVoteTieStatus(markLead.nominations, seats).onBlockNomination?.id, 'n1');

  // When n2 ties n1 at 3 votes, tie status triggers and clears the block
  const tiedList: DayNomination[] = [
    markLead.nominations[0],
    { ...markLead.nominations[1], voterIds: [seats[0].id, seats[1].id, seats[4].id], voteTotal: 3 },
  ];
  const markTied = applyDayNominationMark(tiedList, 'n2', true, seats);
  assert.equal(markTied.isTieCleared, true);
  assert.equal(markTied.nominations[0].markedForExecution, false);
  assert.equal(markTied.nominations[1].markedForExecution, false);
  const resolved = resolveVoteTieStatus(markTied.nominations, seats);
  assert.equal(resolved.isTie, true);
  assert.deepEqual(resolved.tiedNominationIds, ['n1', 'n2']);
  assert.equal(resolved.onBlockNomination, null);
});

test('DayTimer computeTimerRemainingMs & formatTimerClock calculate running and paused times', () => {
  const paused = { durationMs: 300_000, remainingMs: 125_000, deadline: null };
  assert.equal(computeTimerRemainingMs(paused, 1_000_000), 125_000);
  assert.equal(formatTimerClock(125_000), '02:05');

  const running = { durationMs: 300_000, remainingMs: 300_000, deadline: 1_090_500 };
  assert.equal(computeTimerRemainingMs(running, 1_000_000), 90_500);
  assert.equal(formatTimerClock(90_500), '01:31');
  assert.equal(computeTimerRemainingMs(running, 2_000_000), 0);
  assert.equal(formatTimerClock(0), '00:00');
  assert.equal(formatTimerClock(3_661_000), '1:01:01');
});
